use actix_web::{get, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;

use crate::auth::Claims;

#[get("/api/dashboard/stats")]
pub async fn get_dashboard_stats(
    pool: web::Data<PgPool>,
    _claims: Claims,
) -> impl Responder {
    // Buscar total de ativos
    let total_assets = sqlx::query!(
        "SELECT COUNT(*) as count FROM assets"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar ativos críticos
    let critical_assets = sqlx::query!(
        "SELECT COUNT(*) as count FROM assets WHERE criticality = 'critical'"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar ativos ativos
    let active_assets = sqlx::query!(
        "SELECT COUNT(*) as count FROM assets WHERE status = 'active'"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar total de alertas
    let total_alerts = sqlx::query!(
        "SELECT COUNT(*) as count FROM alerts"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar alertas críticos
    let critical_alerts = sqlx::query!(
        "SELECT COUNT(*) as count FROM alerts WHERE priority = 'critical' AND status != 'resolved'"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar logs das últimas 24h
    let logs_24h = sqlx::query!(
        "SELECT COUNT(*) as count FROM security_logs WHERE created_at >= NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    // Buscar logs críticos das últimas 24h
    let critical_logs = sqlx::query!(
        "SELECT COUNT(*) as count FROM security_logs WHERE severity = 'critical' AND created_at >= NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(pool.get_ref())
    .await
    .map(|r| r.count.unwrap_or(0))
    .unwrap_or(0);

    HttpResponse::Ok().json(json!({
        "total_assets": total_assets,
        "active_assets": active_assets,
        "critical_assets": critical_assets,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "logs_24h": logs_24h,
        "critical_logs": critical_logs,
    }))
}
