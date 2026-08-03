use actix_web::{get, post, put, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

use crate::auth::Claims;

#[derive(Debug, serde::Deserialize)]
pub struct VulnerabilityQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub severity: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct CreateVulnerabilityRequest {
    pub asset_id: Uuid,
    pub cve_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub severity: String,
    pub cvss_score: Option<f64>,
    pub remediation_steps: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateVulnerabilityRequest {
    pub status: Option<String>,
    pub remediation_steps: Option<String>,
    pub assigned_to: Option<Uuid>,
}

#[get("/api/vulnerabilities")]
pub async fn list_vulnerabilities(
    pool: web::Data<PgPool>,
    _claims: Claims,
    query: web::Query<VulnerabilityQuery>,
) -> impl Responder {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let vulnerabilities = sqlx::query!(
        r#"
        SELECT 
            id, asset_id, cve_id, title, description,
            severity as "severity: String",
            status as "status: String",
            cvss_score, detection_date, resolved_date,
            assigned_to, remediation_steps,
            metadata, created_at, updated_at
        FROM vulnerabilities
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
        limit as i64,
        offset as i64,
    )
    .fetch_all(pool.get_ref())
    .await;

    match vulnerabilities {
        Ok(vulns) => {
            let count = sqlx::query!(
                "SELECT COUNT(*) as count FROM vulnerabilities"
            )
            .fetch_one(pool.get_ref())
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

            HttpResponse::Ok().json(json!({
                "vulnerabilities": vulns,
                "total": count,
                "limit": limit,
                "offset": offset
            }))
        }
        Err(e) => {
            eprintln!("Error listing vulnerabilities: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to list vulnerabilities: {}", e)
            }))
        }
    }
}

#[get("/api/vulnerabilities/{id}")]
pub async fn get_vulnerability(
    pool: web::Data<PgPool>,
    _claims: Claims,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();

    let vuln = sqlx::query!(
        r#"
        SELECT 
            id, asset_id, cve_id, title, description,
            severity as "severity: String",
            status as "status: String",
            cvss_score, detection_date, resolved_date,
            assigned_to, remediation_steps,
            metadata, created_at, updated_at
        FROM vulnerabilities
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(pool.get_ref())
    .await;

    match vuln {
        Ok(Some(vuln)) => HttpResponse::Ok().json(vuln),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Vulnerability not found"
        })),
        Err(e) => {
            eprintln!("Error getting vulnerability: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to get vulnerability: {}", e)
            }))
        }
    }
}

#[post("/api/vulnerabilities")]
pub async fn create_vulnerability(
    pool: web::Data<PgPool>,
    _claims: Claims,
    req: web::Json<CreateVulnerabilityRequest>,
) -> impl Responder {
    let vuln = sqlx::query!(
        r#"
        INSERT INTO vulnerabilities (
            asset_id, cve_id, title, description,
            severity, cvss_score, remediation_steps
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
            id, asset_id, cve_id, title, description,
            severity as "severity: String",
            status as "status: String",
            cvss_score, detection_date, resolved_date,
            assigned_to, remediation_steps,
            metadata, created_at, updated_at
        "#,
        req.asset_id,
        req.cve_id,
        req.title,
        req.description,
        req.severity,
        req.cvss_score,
        req.remediation_steps,
    )
    .fetch_one(pool.get_ref())
    .await;

    match vuln {
        Ok(vuln) => HttpResponse::Created().json(vuln),
        Err(e) => {
            eprintln!("Error creating vulnerability: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create vulnerability: {}", e)
            }))
        }
    }
}

#[put("/api/vulnerabilities/{id}")]
pub async fn update_vulnerability(
    pool: web::Data<PgPool>,
    _claims: Claims,
    path: web::Path<Uuid>,
    req: web::Json<UpdateVulnerabilityRequest>,
) -> impl Responder {
    let id = path.into_inner();

    let vuln = sqlx::query!(
        r#"
        UPDATE vulnerabilities
        SET 
            status = COALESCE($1, status),
            remediation_steps = COALESCE($2, remediation_steps),
            assigned_to = COALESCE($3, assigned_to),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING 
            id, asset_id, cve_id, title, description,
            severity as "severity: String",
            status as "status: String",
            cvss_score, detection_date, resolved_date,
            assigned_to, remediation_steps,
            metadata, created_at, updated_at
        "#,
        req.status,
        req.remediation_steps,
        req.assigned_to,
        id
    )
    .fetch_optional(pool.get_ref())
    .await;

    match vuln {
        Ok(Some(vuln)) => HttpResponse::Ok().json(vuln),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Vulnerability not found"
        })),
        Err(e) => {
            eprintln!("Error updating vulnerability: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to update vulnerability: {}", e)
            }))
        }
    }
}
