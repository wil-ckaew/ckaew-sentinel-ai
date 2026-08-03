use actix_web::{get, post, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;

#[derive(serde::Deserialize)]
pub struct CreateAssetRequest {
    pub name: String,
    pub ip_address: String,
    pub asset_type: String,
}

#[get("/api/assets")]
pub async fn list_assets(pool: web::Data<PgPool>) -> impl Responder {
    let assets = sqlx::query!(
        r#"
        SELECT id, name, ip_address, asset_type, status, criticality
        FROM assets
        ORDER BY created_at DESC
        LIMIT 100
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match assets {
        Ok(assets) => {
            let count = assets.len();
            HttpResponse::Ok().json(json!({
                "assets": assets,
                "total": count
            }))
        }
        Err(e) => {
            eprintln!("Error listing assets: {}", e);
            HttpResponse::Ok().json(json!({
                "assets": [],
                "total": 0
            }))
        }
    }
}

#[post("/api/assets")]
pub async fn create_asset(
    pool: web::Data<PgPool>,
    req: web::Json<CreateAssetRequest>,
) -> impl Responder {
    let asset = sqlx::query!(
        r#"
        INSERT INTO assets (name, ip_address, asset_type, status, criticality)
        VALUES ($1, $2, $3, 'active', 'medium')
        RETURNING id, name, ip_address, asset_type, status, criticality
        "#,
        req.name,
        req.ip_address,
        req.asset_type,
    )
    .fetch_one(pool.get_ref())
    .await;

    match asset {
        Ok(asset) => HttpResponse::Created().json(asset),
        Err(e) => {
            eprintln!("Error creating asset: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to create asset"
            }))
        }
    }
}

#[get("/api/assets/{id}")]
pub async fn get_asset(
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> impl Responder {
    let id = path.into_inner();

    let asset = sqlx::query!(
        r#"
        SELECT id, name, ip_address, asset_type, status, criticality
        FROM assets
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(pool.get_ref())
    .await;

    match asset {
        Ok(Some(asset)) => HttpResponse::Ok().json(asset),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Asset not found"
        })),
        Err(e) => {
            eprintln!("Error getting asset: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to get asset"
            }))
        }
    }
}
