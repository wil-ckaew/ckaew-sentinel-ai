use actix_web::{get, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;
use std::time::Instant;
use std::env;

#[get("/api/health")]
pub async fn health_check(pool: web::Data<PgPool>) -> impl Responder {
    let start = Instant::now();
    
    // Verificar banco de dados
    let db_result = sqlx::query!("SELECT 1 as check")
        .fetch_one(pool.get_ref())
        .await;
    
    let response_time = start.elapsed().as_millis();
    let db_ok = db_result.is_ok();
    
    // Verificar Redis (se configurado)
    let redis_ok = check_redis().await;
    
    let status = if db_ok { "healthy" } else { "unhealthy" };
    let code = if db_ok { 200 } else { 503 };
    
    HttpResponse::build(actix_web::http::StatusCode::from_u16(code).unwrap())
        .json(json!({
            "status": status,
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "response_time_ms": response_time,
            "components": {
                "database": {
                    "status": if db_ok { "connected" } else { "disconnected" },
                    "type": "postgresql"
                },
                "redis": {
                    "status": if redis_ok { "connected" } else { "disconnected" },
                    "type": "redis"
                }
            },
            "version": env!("CARGO_PKG_VERSION"),
            "service": "CKAEW Sentinel AI",
            "environment": env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string())
        }))
}

async fn check_redis() -> bool {
    // Implementar verificação do Redis
    // Por enquanto, retorna true
    true
}
