use serde::Deserialize;
use std::fs;
use std::path::Path;

use crate::models::AgentConfig;

#[derive(Debug, Deserialize)]
pub struct ConfigFile {
    pub server_url: String,
    pub api_key: String,
    pub collect_interval_secs: Option<u64>,
    pub report_interval_secs: Option<u64>,
    pub log_paths: Option<Vec<String>>,
    pub max_log_size: Option<u64>,
}

impl ConfigFile {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, anyhow::Error> {
        let content = fs::read_to_string(path)?;
        let config: ConfigFile = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn to_agent_config(&self) -> AgentConfig {
        let agent_id = std::env::var("AGENT_ID")
            .unwrap_or_else(|_| uuid::Uuid::new_v4().to_string());

        AgentConfig {
            server_url: self.server_url.clone(),
            api_key: self.api_key.clone(),
            agent_id,
            collect_interval_secs: self.collect_interval_secs.unwrap_or(30),
            report_interval_secs: self.report_interval_secs.unwrap_or(60),
            log_collection: crate::models::LogCollectionConfig {
                enabled: true,
                paths: self.log_paths.clone().unwrap_or_else(|| vec![
                    "/var/log/auth.log".to_string(),
                    "/var/log/syslog".to_string(),
                    "/var/log/secure".to_string(),
                ]),
                max_file_size: self.max_log_size.unwrap_or(10 * 1024 * 1024), // 10MB
                tail_lines: 1000,
            },
            monitoring: crate::models::MonitoringConfig {
                enabled: true,
                process_names: vec![
                    "ssh".to_string(),
                    "nginx".to_string(),
                    "apache".to_string(),
                    "mysql".to_string(),
                    "postgres".to_string(),
                ],
                suspicious_commands: vec![
                    "rm -rf".to_string(),
                    "chmod 777".to_string(),
                    "wget".to_string(),
                    "curl".to_string(),
                    "nc".to_string(),
                    "nmap".to_string(),
                ],
                network_scan_detection: true,
            },
        }
    }
}
