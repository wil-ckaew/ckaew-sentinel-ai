use actix_web::{post, get, web, HttpResponse, Responder};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    models::{User, UserRole},
    auth::create_token,
    config::AppConfig,
};

#[derive(serde::Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(serde::Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub role: String,
}

#[derive(serde::Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
}

#[post("/api/auth/login")]
pub async fn login(
    pool: web::Data<PgPool>,
    credentials: web::Json<LoginRequest>,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let user = sqlx::query!(
        r#"
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = $1
        "#,
        credentials.username
    )
    .fetch_optional(pool.get_ref())
    .await;

    let user = match user {
        Ok(Some(u)) => u,
        Ok(None) => {
            return HttpResponse::Unauthorized().json(json!({
                "error": "Invalid credentials"
            }));
        }
        Err(_) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": "Database error"
            }));
        }
    };

    let password_valid = match verify(&credentials.password, &user.password_hash) {
        Ok(valid) => valid,
        Err(_) => false,
    };

    if !password_valid {
        return HttpResponse::Unauthorized().json(json!({
            "error": "Invalid credentials"
        }));
    }

    let token = match create_token(
        user.id,
        user.username.clone(),
        user.role.clone(),
        config.jwt_secret.as_bytes(),
    ) {
        Ok(t) => t,
        Err(_) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": "Failed to generate token"
            }));
        }
    };

    HttpResponse::Ok().json(AuthResponse {
        token,
        user_id: user.id,
        username: user.username,
        role: user.role,
    })
}

#[post("/api/auth/register")]
pub async fn register(
    pool: web::Data<PgPool>,
    new_user: web::Json<RegisterRequest>,
    config: web::Data<AppConfig>,
) -> impl Responder {
    let exists = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
        new_user.username
    )
    .fetch_one(pool.get_ref())
    .await;

    if let Ok(record) = exists {
        if record.exists.unwrap_or(false) {
            return HttpResponse::Conflict().json(json!({
                "error": "Username already exists"
            }));
        }
    }

    let password_hash = match hash(&new_user.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": "Failed to hash password"
            }));
        }
    };

    let user = sqlx::query!(
        r#"
        INSERT INTO users (username, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role
        "#,
        new_user.username,
        password_hash,
        new_user.role,
    )
    .fetch_one(pool.get_ref())
    .await;

    match user {
        Ok(user) => {
            let token = match create_token(
                user.id,
                user.username.clone(),
                user.role.clone(),
                config.jwt_secret.as_bytes(),
            ) {
                Ok(t) => t,
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to generate token"
                    }));
                }
            };

            HttpResponse::Created().json(AuthResponse {
                token,
                user_id: user.id,
                username: user.username,
                role: user.role,
            })
        }
        Err(e) => {
            eprintln!("Registration error: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to create user"
            }))
        }
    }
}

#[get("/api/auth/me")]
pub async fn get_current_user() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "message": "User authenticated"
    }))
}
