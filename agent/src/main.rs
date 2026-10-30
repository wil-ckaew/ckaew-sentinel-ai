mod collectors;
mod config;
mod http;
mod models;
mod utils;

use log::{error, info, warn};
use std::time::Duration;
use tokio::time;

use crate::{
    collectors::{LogCollector, SystemCollector},
    config::ConfigFile,
    http::client::ApiClient,
    models::AgentPayload,
};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    // Carrega .env quando executado manualmente no projeto.
    // No systemd, as variáveis serão fornecidas pelo EnvironmentFile.
    let _ = dotenv::dotenv();

    info!("CKAEW Sentinel AI Agent v0.1.0 iniciando...");

    let config_path =
        std::env::var("AGENT_CONFIG_FILE").unwrap_or_else(|_| "config.toml".to_string());

    let config_file = match ConfigFile::from_file(&config_path) {
        Ok(config) => {
            info!("Configuração carregada: {}", config_path);
            config
        }
        Err(error) => {
            warn!(
                "Não foi possível carregar {}: {}. Usando padrões.",
                config_path, error
            );
            ConfigFile::default()
        }
    };

    // Falha de forma segura se o token não existir ou for inválido.
    let config = config_file.to_agent_config()?;

    info!("Configuração validada.");
    info!("Servidor: {}", config.server_url);
    info!("Agent ID: {}", config.agent_id);
    info!(
        "Intervalo de coleta: {} segundos",
        config.collect_interval_secs
    );
    info!(
        "Intervalo de envio: {} segundos",
        config.report_interval_secs
    );

    let client = ApiClient::new(config.server_url.clone(), config.api_key.clone());

    match client.health_check().await {
        Ok(true) => info!("Conexão com o backend estabelecida."),
        Ok(false) => warn!("O backend respondeu com erro no health check."),
        Err(error) => {
            warn!("Não foi possível verificar o backend: {}", error);
        }
    }

    let mut system_collector = SystemCollector::new();
    let mut log_collector = LogCollector::new();

    if config.log_collection.enabled {
        for log_path in &config.log_collection.paths {
            log_collector.watch_file(log_path.clone(), config.log_collection.max_file_size);

            info!("Monitoramento de log configurado: {}", log_path);
        }
    }

    let report_every = (config.report_interval_secs / config.collect_interval_secs).max(1);

    info!("Coleta periódica iniciada.");

    let mut interval = time::interval(Duration::from_secs(config.collect_interval_secs));

    let mut report_count: u64 = 0;

    loop {
        interval.tick().await;
        report_count += 1;

        let system_info = system_collector.collect_system_info();
        let metrics = system_collector.collect_metrics();
        let logs = log_collector.collect_logs();

        if !logs.is_empty() {
            info!("Foram coletados {} eventos de log.", logs.len());
        }

        if report_count % report_every == 0 || !logs.is_empty() {
            let payload = AgentPayload {
                agent_id: config.agent_id.clone(),
                system_info,
                metrics,
                logs,
                timestamp: chrono::Utc::now(),
            };

            match client.send_metrics(&payload).await {
                Ok(response) => {
                    info!("Dados enviados ao backend com sucesso: {}", response.status);
                }
                Err(error) => {
                    error!("Falha ao enviar dados ao backend: {}", error);
                }
            }
        }
    }
}
