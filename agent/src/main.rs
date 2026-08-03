mod collectors;
mod http;
mod config;
mod models;
mod utils;

use std::time::Duration;
use tokio::time;
use log::{info, error, warn};
use env_logger;

use crate::{
    collectors::{SystemCollector, LogCollector},
    http::client::ApiClient,
    config::ConfigFile,
    models::AgentPayload,
};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("🚀 CKAEW Sentinel AI Agent v0.1.0 iniciando...");

    // Carregar configuração
    let config_file = match ConfigFile::from_file("config.toml") {
        Ok(cfg) => cfg,
        Err(e) => {
            error!("❌ Erro ao carregar config.toml: {}", e);
            error!("Usando configuração padrão...");
            // Criar configuração padrão
            ConfigFile {
                server_url: "http://localhost:8080".to_string(),
                api_key: "agent-secret-key-123456".to_string(),
                collect_interval_secs: Some(30),
                report_interval_secs: Some(60),
                log_paths: Some(vec![
                    "/var/log/auth.log".to_string(),
                    "/var/log/syslog".to_string(),
                ]),
                max_log_size: Some(10 * 1024 * 1024),
            }
        }
    };

    let config = config_file.to_agent_config();
    info!("✅ Configuração carregada");
    info!("📡 Servidor: {}", config.server_url);
    info!("🆔 Agent ID: {}", config.agent_id);

    // Inicializar client HTTP
    let client = ApiClient::new(config.server_url.clone(), config.api_key.clone());

    // Testar conexão com servidor
    match client.health_check().await {
        Ok(true) => info!("✅ Conectado ao servidor"),
        Ok(false) => warn!("⚠️ Servidor retornou erro"),
        Err(e) => error!("❌ Não foi possível conectar ao servidor: {}", e),
    }

    // Inicializar coletores
    let mut system_collector = SystemCollector::new();
    let mut log_collector = LogCollector::new();

    // Configurar coleta de logs
    for log_path in config.log_collection.paths {
        log_collector.watch_file(log_path, config.log_collection.max_file_size);
        info!("📂 Monitorando logs: {}", log_path);
    }

    info!("🔄 Iniciando coleta periódica...");

    // Loop principal
    let mut interval = time::interval(Duration::from_secs(config.collect_interval_secs));
    let mut report_count = 0;
    let report_interval = config.report_interval_secs / config.collect_interval_secs;

    loop {
        interval.tick().await;
        report_count += 1;

        // Coletar sistema
        let system_info = system_collector.collect_system_info();
        let metrics = system_collector.collect_metrics();

        // Coletar logs
        let logs = log_collector.collect_logs();

        if !logs.is_empty() {
            info!("📝 Coletados {} logs", logs.len());
        }

        // Enviar ao servidor no intervalo configurado
        if report_count % report_interval as u64 == 0 || !logs.is_empty() {
            let payload = AgentPayload {
                agent_id: config.agent_id.clone(),
                system_info,
                metrics,
                logs,
                timestamp: chrono::Utc::now(),
            };

            // Enviar para o servidor
            match client.send_metrics(&payload).await {
                Ok(response) => {
                    info!("✅ Dados enviados com sucesso: {}", response.status);
                }
                Err(e) => {
                    error!("❌ Erro ao enviar dados: {}", e);
                }
            }
        }
    }
}
