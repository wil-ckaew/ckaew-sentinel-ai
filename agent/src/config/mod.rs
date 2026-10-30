use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;

use crate::models::AgentConfig;

#[derive(Debug, Deserialize, Default)]
pub struct ConfigFile {
    #[serde(default)]
    pub server_url: Option<String>,

    #[serde(default)]
    pub collect_interval_secs: Option<u64>,

    #[serde(default)]
    pub report_interval_secs: Option<u64>,

    #[serde(default)]
    pub log_paths: Option<Vec<String>>,

    #[serde(default)]
    pub max_log_size: Option<u64>,
}

impl ConfigFile {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, anyhow::Error> {
        let content = fs::read_to_string(path)?;
        let config: ConfigFile = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn to_agent_config(&self) -> Result<AgentConfig, anyhow::Error> {
        let api_key = env::var("AGENT_INGEST_TOKEN")
            .map_err(|_| anyhow::anyhow!("AGENT_INGEST_TOKEN não foi configurado"))?;

        if api_key.trim().len() < 64 {
            return Err(anyhow::anyhow!(
                "AGENT_INGEST_TOKEN inválido: são necessários pelo menos 64 caracteres"
            ));
        }

        let server_url = env::var("AGENT_SERVER_URL").unwrap_or_else(|_| {
            self.server_url
                .clone()
                .unwrap_or_else(|| "http://127.0.0.1:8080".to_string())
        });

        let server_url = server_url.trim().trim_end_matches('/').to_string();

        if !server_url.starts_with("http://") && !server_url.starts_with("https://") {
            return Err(anyhow::anyhow!("AGENT_SERVER_URL inválida"));
        }

        let agent_id = env::var("AGENT_ID")
            .ok()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        let collect_interval_secs = self.collect_interval_secs.unwrap_or(30);
        let report_interval_secs = self.report_interval_secs.unwrap_or(60);

        if collect_interval_secs == 0 || report_interval_secs == 0 {
            return Err(anyhow::anyhow!(
                "Os intervalos de coleta e envio precisam ser maiores que zero"
            ));
        }

        Ok(AgentConfig {
            server_url,
            api_key,
            agent_id,
            collect_interval_secs,
            report_interval_secs,

            log_collection: crate::models::LogCollectionConfig {
                enabled: true,
                paths: self.log_paths.clone().unwrap_or_else(|| {
                    vec![
                        "/var/log/auth.log".to_string(),
                        "/var/log/syslog".to_string(),
                    ]
                }),
                max_file_size: self.max_log_size.unwrap_or(10 * 1024 * 1024),
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
        })
    }
}
