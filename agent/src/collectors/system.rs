use std::cmp::Ordering;
use sysinfo::{Disks, Networks, System};

use chrono::Utc;

use crate::models::{DiskUsage, NetworkUsage, ProcessInfo, SystemInfo, SystemMetrics};

pub struct SystemCollector {
    system: System,
}

impl SystemCollector {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        Self { system }
    }

    pub fn collect_system_info(&mut self) -> SystemInfo {
        self.system.refresh_all();

        SystemInfo {
            hostname: hostname::get()
                .map(|host| host.to_string_lossy().to_string())
                .unwrap_or_else(|_| "unknown".to_string()),

            os: System::name().unwrap_or_else(|| std::env::consts::OS.to_string()),

            kernel_version: System::kernel_version().unwrap_or_else(|| "unknown".to_string()),

            cpu_cores: self.system.cpus().len(),
            total_memory: self.system.total_memory(),
            uptime: System::uptime(),
        }
    }

    pub fn collect_metrics(&mut self) -> SystemMetrics {
        self.system.refresh_all();

        // CPU
        let cpus = self.system.cpus();

        let cpu_usage = if cpus.is_empty() {
            0.0
        } else {
            cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
        };

        // Memória
        let total_memory = self.system.total_memory();
        let used_memory = self.system.used_memory();

        let memory_usage = if total_memory > 0 {
            (used_memory as f32 / total_memory as f32) * 100.0
        } else {
            0.0
        };

        // Processos: não coletar argumentos completos de comandos,
        // pois podem conter informações sensíveis.
        let mut processes: Vec<ProcessInfo> = self
            .system
            .processes()
            .iter()
            .map(|(pid, process)| ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                cmd: String::new(),
                cpu_usage: process.cpu_usage(),
                memory_usage: process.memory(),
                status: format!("{:?}", process.status()),
                start_time: chrono::DateTime::from_timestamp(process.start_time() as i64, 0)
                    .unwrap_or_else(Utc::now),
            })
            .collect();

        // Limitar o tamanho do payload enviado ao backend.
        processes.sort_by(|a, b| {
            b.cpu_usage
                .partial_cmp(&a.cpu_usage)
                .unwrap_or(Ordering::Equal)
        });

        processes.truncate(200);

        // Discos: sysinfo 0.30 possui estrutura separada.
        let disks = Disks::new_with_refreshed_list();

        let disk_usage: Vec<DiskUsage> = disks
            .iter()
            .map(|disk| {
                let total = disk.total_space();
                let free = disk.available_space();
                let used = total.saturating_sub(free);

                DiskUsage {
                    mount_point: disk.mount_point().to_string_lossy().to_string(),
                    total,
                    used,
                    free,
                    usage_percent: if total > 0 {
                        (used as f32 / total as f32) * 100.0
                    } else {
                        0.0
                    },
                }
            })
            .collect();

        // Rede: sysinfo 0.30 também utiliza estrutura separada.
        let networks = Networks::new_with_refreshed_list();

        let network_usage: Vec<NetworkUsage> = networks
            .iter()
            .map(|(name, data)| NetworkUsage {
                interface: name.to_string(),
                bytes_received: data.total_received(),
                bytes_sent: data.total_transmitted(),
                packets_received: data.total_packets_received(),
                packets_sent: data.total_packets_transmitted(),
            })
            .collect();

        // Carga média do sistema.
        let load_average = System::load_average();

        SystemMetrics {
            timestamp: Utc::now(),
            cpu_usage,
            memory_usage,
            disk_usage,
            network_usage,
            processes,
            load_average: (
                load_average.one as f32,
                load_average.five as f32,
                load_average.fifteen as f32,
            ),
        }
    }

    pub fn refresh(&mut self) {
        self.system.refresh_all();
    }
}

impl Default for SystemCollector {
    fn default() -> Self {
        Self::new()
    }
}
