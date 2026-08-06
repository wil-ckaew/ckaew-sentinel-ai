use actix_web::{get, HttpResponse, Responder};
use serde_json::json;

#[get("/api/health")]
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "version": "0.1.0",
        "service": "CKAEW Sentinel AI"
    }))
}
