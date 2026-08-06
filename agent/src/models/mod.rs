use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub hostname: String,
    pub os: String,
    pub kernel_version: String,
    pub cpu_cores: usize,
    pub total_memory: u64,
    pub uptime: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cmd: String,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub status: String,
    pub start_time: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: DateTime<Utc>,
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub disk_usage: Vec<DiskUsage>,
    pub network_usage: Vec<NetworkUsage>,
    pub processes: Vec<ProcessInfo>,
    pub load_average: (f32, f32, f32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskUsage {
    pub mount_point: String,
    pub total: u64,
    pub used: u64,
    pub free: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkUsage {
    pub interface: String,
    pub bytes_received: u64,
    pub bytes_sent: u64,
    pub packets_received: u64,
    pub packets_sent: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityLog {
    pub event_type: String,
    pub severity: LogSeverity,
    pub message: String,
    pub source_ip: Option<String>,
    pub details: HashMap<String, serde_json::Value>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LogSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub server_url: String,
    pub api_key: String,
    pub agent_id: String,
    pub collect_interval_secs: u64,
    pub report_interval_secs: u64,
    pub log_collection: LogCollectionConfig,
    pub monitoring: MonitoringConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogCollectionConfig {
    pub enabled: bool,
    pub paths: Vec<String>,
    pub max_file_size: u64,
    pub tail_lines: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub enabled: bool,
    pub process_names: Vec<String>,
    pub suspicious_commands: Vec<String>,
    pub network_scan_detection: bool,
}

// Resposta do servidor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerResponse {
    pub status: String,
    pub message: Option<String>,
}

// Payload para enviar ao servidor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPayload {
    pub agent_id: String,
    pub system_info: SystemInfo,
    pub metrics: SystemMetrics,
    pub logs: Vec<SecurityLog>,
    pub timestamp: DateTime<Utc>,
}
