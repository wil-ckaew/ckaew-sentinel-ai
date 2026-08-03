use actix_web::{post, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;
use chrono::Utc;

use crate::models::{AgentPayload, SecurityLog, LogSeverity};

#[post("/api/agent/metrics")]
pub async fn receive_agent_metrics(
    pool: web::Data<PgPool>,
    payload: web::Json<AgentPayload>,
) -> impl Responder {
    // Processar sistema
    let system_info = &payload.system_info;
    let metrics = &payload.metrics;

    // Atualizar ou criar asset baseado no agente
    let asset_id = match create_or_update_asset(
        pool.get_ref(),
        &payload.agent_id,
        system_info,
    ).await {
        Ok(id) => id,
        Err(e) => {
            eprintln!("Error creating asset: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Failed to process agent data"
            }));
        }
    };

    // Salvar métricas (pode ser em uma tabela separada)
    // Por enquanto, vamos criar logs de segurança com as métricas importantes
    let mut logs = Vec::new();
    
    // Criar log de sistema
    let system_log = SecurityLog {
        id: uuid::Uuid::new_v4(),
        event_type: "SYSTEM_METRICS".to_string(),
        severity: LogSeverity::Info,
        message: format!(
            "CPU: {:.1}%, Memory: {:.1}%, Load: {:.2}, {:.2}, {:.2}",
            metrics.cpu_usage,
            metrics.memory_usage,
            metrics.load_average.0,
            metrics.load_average.1,
            metrics.load_average.2
        ),
        source_ip: None,
        user_id: None,
        asset_id: Some(asset_id),
        details: serde_json::json!({
            "cpu_usage": metrics.cpu_usage,
            "memory_usage": metrics.memory_usage,
            "processes": metrics.processes.len(),
            "load_average": metrics.load_average,
        }),
        created_at: Utc::now(),
    };

    logs.push(system_log);

    // Inserir logs no banco
    for log in &logs {
        if let Err(e) = insert_log(pool.get_ref(), log).await {
            eprintln!("Error inserting log: {}", e);
        }
    }

    // Verificar por anomalias
    if metrics.cpu_usage > 90.0 {
        create_alert(
            pool.get_ref(),
            "High CPU Usage",
            &format!("CPU usage is at {:.1}% on host {}", metrics.cpu_usage, system_info.hostname),
            "high",
            asset_id,
        ).await;
    }

    if metrics.memory_usage > 90.0 {
        create_alert(
            pool.get_ref(),
            "High Memory Usage",
            &format!("Memory usage is at {:.1}% on host {}", metrics.memory_usage, system_info.hostname),
            "high",
            asset_id,
        ).await;
    }

    HttpResponse::Ok().json(json!({
        "status": "ok",
        "message": "Data received successfully",
        "asset_id": asset_id,
        "logs_received": logs.len()
    }))
}

#[post("/api/security/logs/batch")]
pub async fn receive_batch_logs(
    pool: web::Data<PgPool>,
    payload: web::Json<BatchLogRequest>,
) -> impl Responder {
    let mut inserted = 0;
    
    for log in &payload.logs {
        let security_log = SecurityLog {
            id: uuid::Uuid::new_v4(),
            event_type: log.event_type.clone(),
            severity: log.severity.clone(),
            message: log.message.clone(),
            source_ip: log.source_ip.clone(),
            user_id: None,
            asset_id: None, // Será associado depois
            details: serde_json::to_value(&log.details).unwrap_or(serde_json::Value::Null),
            created_at: Utc::now(),
        };

        if let Ok(_) = insert_log(pool.get_ref(), &security_log).await {
            inserted += 1;
        }
    }

    HttpResponse::Ok().json(json!({
        "status": "ok",
        "inserted": inserted,
        "total": payload.logs.len()
    }))
}

async fn create_or_update_asset(
    pool: &PgPool,
    agent_id: &str,
    system_info: &crate::models::SystemInfo,
) -> Result<uuid::Uuid, sqlx::Error> {
    // Buscar asset existente
    let existing = sqlx::query!(
        "SELECT id FROM assets WHERE metadata->>'agent_id' = $1",
        agent_id
    )
    .fetch_optional(pool)
    .await?;

    if let Some(row) = existing {
        // Atualizar last_seen
        sqlx::query!(
            "UPDATE assets SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            row.id
        )
        .execute(pool)
        .await?;
        Ok(row.id)
    } else {
        // Criar novo asset
        let hostname = system_info.hostname.clone();
        let ip_address = get_host_ip().unwrap_or_else(|| "0.0.0.0".to_string());
        let os = system_info.os.clone();
        
        let asset = sqlx::query!(
            r#"
            INSERT INTO assets (
                name, description, ip_address, asset_type, status,
                criticality, metadata
            )
            VALUES ($1, $2, $3, $4, 'active', 'medium', $5)
            RETURNING id
            "#,
            hostname,
            Some(format!("Auto-registered agent: {}", os)),
            ip_address,
            crate::models::AssetType::Server as crate::models::AssetType,
            serde_json::json!({
                "agent_id": agent_id,
                "os": os,
                "kernel": system_info.kernel_version,
                "cpu_cores": system_info.cpu_cores,
                "total_memory": system_info.total_memory,
                "registered_at": Utc::now(),
            }),
        )
        .fetch_one(pool)
        .await?;

        Ok(asset.id)
    }
}

async fn insert_log(pool: &PgPool, log: &SecurityLog) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO security_logs (
            id, event_type, severity, message, source_ip,
            user_id, asset_id, details, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        "#,
        log.id,
        log.event_type,
        log.severity as LogSeverity,
        log.message,
        log.source_ip,
        log.user_id,
        log.asset_id,
        log.details,
        log.created_at,
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn create_alert(pool: &PgPool, title: &str, description: &str, priority: &str, asset_id: uuid::Uuid) {
    let priority = match priority {
        "critical" => crate::models::AlertPriority::Critical,
        "high" => crate::models::AlertPriority::High,
        "medium" => crate::models::AlertPriority::Medium,
        _ => crate::models::AlertPriority::Low,
    };

    let _ = sqlx::query!(
        r#"
        INSERT INTO alerts (
            title, description, priority, status,
            asset_id, metadata
        )
        VALUES ($1, $2, $3, 'new', $4, $5)
        "#,
        title,
        description,
        priority as crate::models::AlertPriority,
        asset_id,
        serde_json::json!({
            "source": "agent_monitoring",
            "created_at": Utc::now(),
        }),
    )
    .execute(pool)
    .await;
}

fn get_host_ip() -> Option<String> {
    use std::net::ToSocketAddrs;
    
    // Tentar obter IP público
    if let Ok(addrs) = "8.8.8.8:53".to_socket_addrs() {
        for addr in addrs {
            if let std::net::SocketAddr::V4(_) = addr {
                // Tentar encontrar IP local
                if let Ok(ifaces) = local_ip_address::local_ip() {
                    return Some(ifaces.to_string());
                }
            }
        }
    }
    None
}

#[derive(Debug, serde::Deserialize)]
pub struct BatchLogRequest {
    pub agent_id: String,
    pub logs: Vec<SecurityLogReceived>,
}

#[derive(Debug, serde::Deserialize)]
pub struct SecurityLogReceived {
    pub event_type: String,
    pub severity: LogSeverity,
    pub message: String,
    pub source_ip: Option<String>,
    pub details: serde_json::Value,
}
