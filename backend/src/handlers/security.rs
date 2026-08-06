use actix_web::{get, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;

#[get("/api/security/logs")]
pub async fn list_logs(pool: web::Data<PgPool>) -> impl Responder {
    let logs = sqlx::query!(
        r#"
        SELECT id, event_type, severity, message, created_at
        FROM security_logs
        ORDER BY created_at DESC
        LIMIT 50
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match logs {
        Ok(logs) => {
            HttpResponse::Ok().json(json!({
                "logs": logs,
                "total": logs.len()
            }))
        }
        Err(e) => {
            eprintln!("Error listing logs: {}", e);
            HttpResponse::Ok().json(json!({
                "logs": [],
                "total": 0
            }))
        }
    }
}

#[get("/api/security/logs/stats")]
pub async fn get_log_stats(pool: web::Data<PgPool>) -> impl Responder {
    let stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as total_logs,
            COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_logs
        FROM security_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        "#
    )
    .fetch_one(pool.get_ref())
    .await;

    match stats {
        Ok(stats) => HttpResponse::Ok().json(json!({
            "total_logs_24h": stats.total_logs.unwrap_or(0),
            "critical": stats.critical_logs.unwrap_or(0),
        })),
        Err(e) => {
            eprintln!("Error getting stats: {}", e);
            HttpResponse::Ok().json(json!({
                "total_logs_24h": 0,
                "critical": 0
            }))
        }
    }
}
