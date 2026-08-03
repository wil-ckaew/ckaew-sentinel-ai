use sysinfo::{
    System, SystemExt, CpuExt, ProcessExt,
    DiskExt, NetworkExt, NetworksExt,
};
use crate::models::{
    SystemInfo, SystemMetrics, ProcessInfo, DiskUsage, NetworkUsage,
};
use chrono::Utc;
use std::time::Duration;

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
                .map(|h| h.to_string_lossy().to_string())
                .unwrap_or_else(|_| "unknown".to_string()),
            os: std::env::consts::OS.to_string(),
            kernel_version: self.system.kernel_version()
                .unwrap_or("unknown").to_string(),
            cpu_cores: self.system.cpus().len(),
            total_memory: self.system.total_memory(),
            uptime: self.system.uptime(),
        }
    }

    pub fn collect_metrics(&mut self) -> SystemMetrics {
        self.system.refresh_all();

        // CPU usage
        let cpu_usage = self.system.cpus()
            .iter()
            .map(|cpu| cpu.cpu_usage())
            .sum::<f32>() / self.system.cpus().len() as f32;

        // Memory usage
        let total_mem = self.system.total_memory();
        let used_mem = self.system.used_memory();
        let memory_usage = if total_mem > 0 {
            (used_mem as f32 / total_mem as f32) * 100.0
        } else {
            0.0
        };

        // Processes
        let processes: Vec<ProcessInfo> = self.system.processes()
            .iter()
            .map(|(pid, proc)| {
                ProcessInfo {
                    pid: pid.as_u32(),
                    name: proc.name().to_string_lossy().to_string(),
                    cmd: proc.cmd().join(" "),
                    cpu_usage: proc.cpu_usage(),
                    memory_usage: proc.memory(),
                    status: format!("{:?}", proc.status()),
                    start_time: chrono::DateTime::from_timestamp(
                        proc.start_time() as i64,
                        0
                    ).unwrap_or(Utc::now()),
                }
            })
            .collect();

        // Disk usage
        let disk_usage: Vec<DiskUsage> = self.system.disks()
            .iter()
            .map(|disk| {
                let total = disk.total_space();
                let available = disk.available_space();
                let used = total - available;
                DiskUsage {
                    mount_point: disk.mount_point().to_string_lossy().to_string(),
                    total,
                    used,
                    free: available,
                    usage_percent: if total > 0 {
                        (used as f32 / total as f32) * 100.0
                    } else {
                        0.0
                    },
                }
            })
            .collect();

        // Network usage
        let network_usage: Vec<NetworkUsage> = self.system.networks()
            .iter()
            .map(|(name, data)| {
                NetworkUsage {
                    interface: name.to_string(),
                    bytes_received: data.total_received(),
                    bytes_sent: data.total_transmitted(),
                    packets_received: data.total_packets_received(),
                    packets_sent: data.total_packets_transmitted(),
                }
            })
            .collect();

        // Load average
        let load_avg = self.system.load_average();

        SystemMetrics {
            timestamp: Utc::now(),
            cpu_usage,
            memory_usage,
            disk_usage,
            network_usage,
            processes,
            load_average: (load_avg.one, load_avg.five, load_avg.fifteen),
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
