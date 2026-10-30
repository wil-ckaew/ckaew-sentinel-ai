use super::AppState;

use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;
use serde_json::{json, Map, Value};

#[derive(Deserialize)]
pub struct AgentIngestRequest {
    agent_id: String,
    system_info: Value,
    metrics: Value,
    #[serde(default)]
    logs: Vec<Value>,
}

fn text_field<'a>(value: &'a Value, key: &str, fallback: &'a str) -> &'a str {
    value.get(key).and_then(Value::as_str).unwrap_or(fallback)
}

fn bounded_text(value: &str, max_chars: usize) -> String {
    value.chars().take(max_chars).collect()
}

pub async fn ingest_agent(
    request: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<AgentIngestRequest>,
) -> HttpResponse {
    let supplied_token = request
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .unwrap_or("");

    if state.agent_token.is_empty() || supplied_token != state.agent_token {
        return HttpResponse::Unauthorized().json(json!({
            "error": "Agent authentication required"
        }));
    }

    let agent_id = body.agent_id.trim();

    if agent_id.is_empty() || agent_id.len() > 128 {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid agent_id"
        }));
    }

    if body.logs.len() > 1000 {
        return HttpResponse::PayloadTooLarge().json(json!({
            "error": "Maximum 1000 logs per ingestion"
        }));
    }

    let hostname = bounded_text(text_field(&body.system_info, "hostname", "unknown"), 255);
    let operating_system = bounded_text(text_field(&body.system_info, "os", "unknown"), 100);
    let kernel_version = bounded_text(
        text_field(&body.system_info, "kernel_version", "unknown"),
        500,
    );

    let cpu_cores = body
        .system_info
        .get("cpu_cores")
        .and_then(Value::as_u64)
        .unwrap_or(0)
        .min(i32::MAX as u64) as i32;

    let total_memory = body
        .system_info
        .get("total_memory")
        .and_then(Value::as_u64)
        .and_then(|value| i64::try_from(value).ok())
        .unwrap_or(0);

    let uptime = body
        .system_info
        .get("uptime")
        .and_then(Value::as_u64)
        .and_then(|value| i64::try_from(value).ok())
        .unwrap_or(0);

    let cpu_usage = body
        .metrics
        .get("cpu_usage")
        .and_then(Value::as_f64)
        .unwrap_or(0.0);

    let memory_usage = body
        .metrics
        .get("memory_usage")
        .and_then(Value::as_f64)
        .unwrap_or(0.0);

    // Validar os logs antes de iniciar a transação.
    for item in &body.logs {
        let severity = text_field(item, "severity", "info").to_lowercase();
        let event_type = text_field(item, "event_type", "");

        if !["info", "warning", "error", "critical"].contains(&severity.as_str())
            || event_type.is_empty()
            || event_type.len() > 100
            || text_field(item, "message", "").is_empty()
        {
            return HttpResponse::BadRequest().json(json!({
                "error": "Invalid log entry"
            }));
        }
    }

    let mut transaction = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(error) => {
            log::error!("Agent ingest: transaction start failed: {error}");
            return HttpResponse::InternalServerError().json(json!({
                "error": "Could not start ingestion"
            }));
        }
    };

    let result: Result<usize, sqlx::Error> = async {
        sqlx::query(
            r#"
            INSERT INTO agents (
                agent_id, hostname, operating_system, kernel_version,
                cpu_cores, total_memory, uptime, status, last_seen
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'online', CURRENT_TIMESTAMP)
            ON CONFLICT (agent_id) DO UPDATE SET
                hostname = EXCLUDED.hostname,
                operating_system = EXCLUDED.operating_system,
                kernel_version = EXCLUDED.kernel_version,
                cpu_cores = EXCLUDED.cpu_cores,
                total_memory = EXCLUDED.total_memory,
                uptime = EXCLUDED.uptime,
                status = 'online',
                last_seen = CURRENT_TIMESTAMP
            "#,
        )
        .bind(agent_id)
        .bind(&hostname)
        .bind(&operating_system)
        .bind(&kernel_version)
        .bind(cpu_cores)
        .bind(total_memory)
        .bind(uptime)
        .execute(&mut *transaction)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO agent_metrics (
                agent_id, cpu_usage, memory_usage, load_average,
                disk_usage, network_usage, processes, system_info, raw_metrics
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        )
        .bind(agent_id)
        .bind(cpu_usage)
        .bind(memory_usage)
        .bind(
            body.metrics
                .get("load_average")
                .cloned()
                .unwrap_or(json!([])),
        )
        .bind(body.metrics.get("disk_usage").cloned().unwrap_or(json!([])))
        .bind(
            body.metrics
                .get("network_usage")
                .cloned()
                .unwrap_or(json!([])),
        )
        .bind(body.metrics.get("processes").cloned().unwrap_or(json!([])))
        .bind(body.system_info.clone())
        .bind(body.metrics.clone())
        .execute(&mut *transaction)
        .await?;

        let mut inserted_logs = 0usize;

        for item in &body.logs {
            let event_type = bounded_text(text_field(item, "event_type", "AGENT_EVENT"), 100);
            let severity = text_field(item, "severity", "info").to_lowercase();
            let message = bounded_text(text_field(item, "message", ""), 10000);

            let source_ip = item
                .get("source_ip")
                .and_then(Value::as_str)
                .filter(|value| value.len() <= 45)
                .map(str::to_string);

            let mut details: Map<String, Value> = item
                .get("details")
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();

            details.insert("agent_id".to_string(), json!(agent_id));
            details.insert("agent_hostname".to_string(), json!(hostname));

            sqlx::query(
                r#"
                INSERT INTO security_logs (
                    event_type, severity, message, source_ip, details
                )
                VALUES ($1, $2::log_severity, $3, $4, $5)
                "#,
            )
            .bind(&event_type)
            .bind(&severity)
            .bind(&message)
            .bind(&source_ip)
            .bind(Value::Object(details))
            .execute(&mut *transaction)
            .await?;

            if severity == "critical" || severity == "error" {
                let priority = if severity == "critical" {
                    "critical"
                } else {
                    "high"
                };

                let title = bounded_text(&format!("Agente {}: {}", hostname, event_type), 255);

                let metadata = json!({
                    "source": "rust_agent",
                    "agent_id": agent_id,
                    "event_type": event_type
                });

                sqlx::query(
                    r#"
                    INSERT INTO alerts (
                        title, description, priority, status,
                        source_ip, metadata
                    )
                    VALUES ($1, $2, $3::alert_priority, 'new', $4, $5)
                    "#,
                )
                .bind(&title)
                .bind(&message)
                .bind(priority)
                .bind(&source_ip)
                .bind(metadata)
                .execute(&mut *transaction)
                .await?;
            }

            inserted_logs += 1;
        }

        Ok(inserted_logs)
    }
    .await;

    match result {
        Ok(logs_saved) => {
            if let Err(error) = transaction.commit().await {
                log::error!("Agent ingest: commit failed: {error}");
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Could not commit ingestion"
                }));
            }

            HttpResponse::Ok().json(json!({
                "status": "success",
                "agent_id": agent_id,
                "metrics_saved": 1,
                "logs_saved": logs_saved
            }))
        }
        Err(error) => {
            log::error!("Agent ingest: database operation failed: {error}");
            HttpResponse::InternalServerError().json(json!({
                "error": "Could not store agent data"
            }))
        }
    }
}
