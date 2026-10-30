use super::{authenticate, AppState};

use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;

#[derive(Deserialize)]
pub struct HistoryQuery {
    limit: Option<i64>,
}

pub async fn list_agents(request: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let rows = match sqlx::query(
        r#"
        SELECT
            a.agent_id,
            a.hostname,
            a.operating_system,
            a.kernel_version,
            a.cpu_cores,
            a.total_memory,
            a.uptime,
            a.first_seen::text AS first_seen,
            a.last_seen::text AS last_seen,
            CASE
                WHEN a.last_seen >= NOW() - INTERVAL '2 minutes'
                THEN 'online'
                ELSE 'offline'
            END AS connection_status,
            m.id AS metric_id,
            m.collected_at::text AS metric_collected_at,
            m.cpu_usage AS metric_cpu_usage,
            m.memory_usage AS metric_memory_usage,
            m.load_average,
            m.disk_usage,
            m.network_usage,
            m.processes
        FROM agents a
        LEFT JOIN LATERAL (
            SELECT *
            FROM agent_metrics
            WHERE agent_id = a.agent_id
            ORDER BY collected_at DESC
            LIMIT 1
        ) m ON TRUE
        ORDER BY a.last_seen DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            log::error!("Falha ao listar agentes: {error}");
            return HttpResponse::InternalServerError().json(json!({
                "error": "Agent list unavailable"
            }));
        }
    };

    let agents: Vec<Value> = rows
        .into_iter()
        .map(|row| {
            let latest_metric = row
                .try_get::<Option<i64>, _>("metric_id")
                .unwrap_or(None)
                .map(|metric_id| {
                    json!({
                        "id": metric_id,
                        "collected_at": row.try_get::<Option<String>, _>("metric_collected_at").unwrap_or(None),
                        "cpu_usage": row.try_get::<Option<f64>, _>("metric_cpu_usage").unwrap_or(None).unwrap_or(0.0),
                        "memory_usage": row.try_get::<Option<f64>, _>("metric_memory_usage").unwrap_or(None).unwrap_or(0.0),
                        "load_average": row.try_get::<Option<Value>, _>("load_average").unwrap_or(None).unwrap_or(json!([])),
                        "disk_usage": row.try_get::<Option<Value>, _>("disk_usage").unwrap_or(None).unwrap_or(json!([])),
                        "network_usage": row.try_get::<Option<Value>, _>("network_usage").unwrap_or(None).unwrap_or(json!([])),
                        "processes": row.try_get::<Option<Value>, _>("processes").unwrap_or(None).unwrap_or(json!([]))
                    })
                });

            json!({
                "agent_id": row.try_get::<String, _>("agent_id").unwrap_or_default(),
                "hostname": row.try_get::<String, _>("hostname").unwrap_or_default(),
                "operating_system": row.try_get::<String, _>("operating_system").unwrap_or_default(),
                "kernel_version": row.try_get::<String, _>("kernel_version").unwrap_or_default(),
                "cpu_cores": row.try_get::<i32, _>("cpu_cores").unwrap_or(0),
                "total_memory": row.try_get::<i64, _>("total_memory").unwrap_or(0),
                "uptime": row.try_get::<i64, _>("uptime").unwrap_or(0),
                "first_seen": row.try_get::<String, _>("first_seen").unwrap_or_default(),
                "last_seen": row.try_get::<String, _>("last_seen").unwrap_or_default(),
                "status": row.try_get::<String, _>("connection_status").unwrap_or_else(|_| "offline".to_string()),
                "latest_metric": latest_metric
            })
        })
        .collect();

    HttpResponse::Ok().json(json!({
        "total": agents.len(),
        "agents": agents
    }))
}

pub async fn agent_metrics_history(
    request: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<HistoryQuery>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let agent_id = path.into_inner();

    if agent_id.trim().is_empty() || agent_id.len() > 128 {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid agent_id"
        }));
    }

    let exists = match sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM agents WHERE agent_id = $1)",
    )
    .bind(&agent_id)
    .fetch_one(&state.pool)
    .await
    {
        Ok(value) => value,
        Err(error) => {
            log::error!("Falha ao verificar agente: {error}");
            return HttpResponse::InternalServerError().json(json!({
                "error": "Agent lookup unavailable"
            }));
        }
    };

    if !exists {
        return HttpResponse::NotFound().json(json!({
            "error": "Agent not found"
        }));
    }

    let limit = query.limit.unwrap_or(60).clamp(1, 240);

    let rows = match sqlx::query(
        r#"
        SELECT
            id,
            collected_at::text AS collected_at,
            cpu_usage,
            memory_usage,
            load_average,
            disk_usage,
            network_usage,
            processes
        FROM agent_metrics
        WHERE agent_id = $1
        ORDER BY collected_at DESC
        LIMIT $2
        "#,
    )
    .bind(&agent_id)
    .bind(limit)
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            log::error!("Falha ao consultar histórico do agente: {error}");
            return HttpResponse::InternalServerError().json(json!({
                "error": "Agent metrics unavailable"
            }));
        }
    };

    let metrics: Vec<Value> = rows
        .into_iter()
        .map(|row| {
            json!({
                "id": row.try_get::<i64, _>("id").unwrap_or(0),
                "collected_at": row.try_get::<String, _>("collected_at").unwrap_or_default(),
                "cpu_usage": row.try_get::<f64, _>("cpu_usage").unwrap_or(0.0),
                "memory_usage": row.try_get::<f64, _>("memory_usage").unwrap_or(0.0),
                "load_average": row.try_get::<Value, _>("load_average").unwrap_or(json!([])),
                "disk_usage": row.try_get::<Value, _>("disk_usage").unwrap_or(json!([])),
                "network_usage": row.try_get::<Value, _>("network_usage").unwrap_or(json!([])),
                "processes": row.try_get::<Value, _>("processes").unwrap_or(json!([]))
            })
        })
        .collect();

    HttpResponse::Ok().json(json!({
        "agent_id": agent_id,
        "total": metrics.len(),
        "metrics": metrics
    }))
}
