use actix_web::{
    http::header::AUTHORIZATION,
    middleware::Logger,
    web, App, HttpRequest, HttpResponse, HttpServer,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use dotenv::dotenv;
use jsonwebtoken::{
    decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{
    postgres::{PgPoolOptions, PgRow},
    PgPool, Row,
};
use std::{
    env,
    error::Error,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    jwt_secret: String,
    monitor_token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Claims {
    sub: String,
    username: String,
    role: String,
    iat: usize,
    exp: usize,
}

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Deserialize)]
struct RegisterRequest {
    username: String,
    password: String,
    role: Option<String>,
}

#[derive(Deserialize)]
struct CreateAlertRequest {
    title: String,
    priority: String,
    source_ip: Option<String>,
    message: Option<String>,
    description: Option<String>,
}

#[derive(Deserialize)]
struct CreateLogRequest {
    event_type: String,
    severity: String,
    message: String,
    source_ip: Option<String>,
}

fn now_unix() -> usize {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_secs() as usize)
        .unwrap_or(0)
}

fn create_token(
    secret: &str,
    user_id: String,
    username: String,
    role: String,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = now_unix();

    let hours = env::var("JWT_EXPIRATION")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| (1..=168).contains(value))
        .unwrap_or(8);

    let claims = Claims {
        sub: user_id,
        username,
        role,
        iat: now,
        exp: now.saturating_add(hours * 3600),
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

fn unauthorized() -> HttpResponse {
    HttpResponse::Unauthorized().json(json!({
        "error": "Authentication required"
    }))
}

fn forbidden() -> HttpResponse {
    HttpResponse::Forbidden().json(json!({
        "error": "Insufficient permissions"
    }))
}

// O token interno do monitor é aceito somente nas consultas de alertas
// que chamam este método com allow_monitor=true.
fn authenticate(
    request: &HttpRequest,
    state: &AppState,
    allow_monitor: bool,
) -> Result<Option<Claims>, HttpResponse> {
    let authorization = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");

    let token = match authorization.strip_prefix("Bearer ") {
        Some(value) if !value.is_empty() => value,
        _ => return Err(unauthorized()),
    };

    if allow_monitor
        && !state.monitor_token.is_empty()
        && token == state.monitor_token
    {
        return Ok(None);
    }

    let validation = Validation::new(Algorithm::HS256);

    match decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &validation,
    ) {
        Ok(data) => Ok(Some(data.claims)),
        Err(_) => Err(unauthorized()),
    }
}

fn require_admin(
    request: &HttpRequest,
    state: &AppState,
) -> Result<Claims, HttpResponse> {
    let claims = authenticate(request, state, false)?.ok_or_else(unauthorized)?;

    if claims.role.eq_ignore_ascii_case("admin") {
        Ok(claims)
    } else {
        Err(forbidden())
    }
}

async fn bootstrap_admin(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> Result<(), Box<dyn Error>> {
    let existing = sqlx::query_scalar::<_, String>(
        "SELECT id::text FROM users WHERE username = $1",
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        println!("Usuário inicial já existe; senha preservada.");
        return Ok(());
    }

    if username.len() < 3
        || username.len() > 64
        || password.len() < 8
        || password.len() > 72
    {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "Credenciais iniciais inválidas.",
        )
        .into());
    }

    let password_hash = hash(password, DEFAULT_COST)?;

    sqlx::query(
        "INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, 'admin')
         ON CONFLICT (username) DO NOTHING",
    )
    .bind(username)
    .bind(password_hash)
    .execute(pool)
    .await?;

    println!("Verificação do administrador inicial concluída.");
    Ok(())
}

async fn index() -> HttpResponse {
    HttpResponse::Ok().body("CKAEW Sentinel AI")
}

async fn health_check(state: web::Data<AppState>) -> HttpResponse {
    match sqlx::query("SELECT 1").execute(&state.pool).await {
        Ok(_) => HttpResponse::Ok().json(json!({
            "service": "CKAEW Sentinel AI",
            "status": "ok",
            "version": "0.2.0",
            "database": "connected"
        })),
        Err(_) => HttpResponse::ServiceUnavailable().json(json!({
            "service": "CKAEW Sentinel AI",
            "status": "degraded"
        })),
    }
}

async fn login(
    state: web::Data<AppState>,
    body: web::Json<LoginRequest>,
) -> HttpResponse {
    if body.username.is_empty()
        || body.username.len() > 64
        || body.password.is_empty()
        || body.password.len() > 72
    {
        return unauthorized();
    }

    let row = match sqlx::query(
        "SELECT id::text AS id, username, password_hash, role
         FROM users WHERE username = $1",
    )
    .bind(&body.username)
    .fetch_optional(&state.pool)
    .await
    {
        Ok(Some(row)) => row,
        Ok(None) => return unauthorized(),
        Err(error) => {
            log::error!("Falha na consulta de login: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Login unavailable"}));
        }
    };

    let stored_hash: String = match row.try_get("password_hash") {
        Ok(value) => value,
        Err(_) => return HttpResponse::InternalServerError()
            .json(json!({"error": "Login unavailable"})),
    };

    if !verify(&body.password, &stored_hash).unwrap_or(false) {
        return unauthorized();
    }

    let user_id: String = row.try_get("id").unwrap_or_default();
    let username: String = row.try_get("username").unwrap_or_default();
    let role: String = row.try_get("role").unwrap_or_default();

    let token = match create_token(
        &state.jwt_secret,
        user_id.clone(),
        username.clone(),
        role.clone(),
    ) {
        Ok(value) => value,
        Err(error) => {
            log::error!("Falha ao gerar JWT: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Token generation failed"}));
        }
    };

    HttpResponse::Ok().json(json!({
        "token": token,
        "user_id": user_id,
        "username": username,
        "role": role
    }))
}

async fn register(
    request: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<RegisterRequest>,
) -> HttpResponse {
    if let Err(response) = require_admin(&request, &state) {
        return response;
    }

    let username = body.username.trim();
    let password = body.password.as_str();
    let role = body
        .role
        .as_deref()
        .unwrap_or("analyst")
        .trim()
        .to_ascii_lowercase();

    let valid_username = username.len() >= 3
        && username.len() <= 64
        && username
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || "_.-".contains(character));

    if !valid_username
        || password.len() < 8
        || password.len() > 72
        || !matches!(role.as_str(), "analyst" | "auditor")
    {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid username, password, or role"
        }));
    }

    let password_hash = match hash(password, DEFAULT_COST) {
        Ok(value) => value,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Password processing failed"}));
        }
    };

    match sqlx::query(
        "INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id::text AS id, username, role",
    )
    .bind(username)
    .bind(password_hash)
    .bind(&role)
    .fetch_one(&state.pool)
    .await
    {
        Ok(row) => HttpResponse::Created().json(json!({
            "user_id": row.try_get::<String, _>("id").unwrap_or_default(),
            "username": row.try_get::<String, _>("username").unwrap_or_default(),
            "role": row.try_get::<String, _>("role").unwrap_or_default()
        })),
        Err(error) => {
            log::error!("Falha ao registrar usuário: {error}");
            HttpResponse::Conflict().json(json!({
                "error": "User could not be registered"
            }))
        }
    }
}

async fn get_current_user(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    match authenticate(&request, &state, false) {
        Ok(Some(claims)) => HttpResponse::Ok().json(json!({
            "user_id": claims.sub,
            "username": claims.username,
            "role": claims.role
        })),
        Ok(None) => unauthorized(),
        Err(response) => response,
    }
}

fn alert_json(row: &PgRow) -> Value {
    let description: Option<String> = row.try_get("description").unwrap_or(None);

    json!({
        "id": row.try_get::<String, _>("id").unwrap_or_default(),
        "title": row.try_get::<String, _>("title").unwrap_or_default(),
        "priority": row.try_get::<String, _>("priority").unwrap_or_default(),
        "status": row.try_get::<String, _>("status").unwrap_or_default(),
        "source_ip": row.try_get::<Option<String>, _>("source_ip").unwrap_or(None),
        "description": description,
        "message": description.unwrap_or_default(),
        "created_at": row.try_get::<String, _>("created_at").unwrap_or_default()
    })
}

async fn list_alerts(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, true) {
        return response;
    }

    let rows = match sqlx::query(
        "SELECT id::text AS id, title, priority::text AS priority,
                status::text AS status, source_ip, description,
                created_at::text AS created_at
         FROM alerts ORDER BY created_at DESC LIMIT 100",
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            log::error!("Falha ao consultar alertas: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Alerts unavailable"}));
        }
    };

    let alerts: Vec<Value> = rows.iter().map(alert_json).collect();
    let total = alerts.len();

    HttpResponse::Ok().json(json!({
        "alerts": alerts,
        "total": total
    }))
}

async fn create_alert(
    request: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateAlertRequest>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let title = body.title.trim().to_string();
    let priority = body.priority.trim().to_ascii_lowercase();
    let source_ip = body.source_ip.clone();
    let description = body.message.clone().or(body.description.clone());

    if title.is_empty()
        || title.len() > 255
        || !matches!(priority.as_str(), "low" | "medium" | "high" | "critical")
    {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid alert title or priority"
        }));
    }

    let row = match sqlx::query(
        "INSERT INTO alerts (title, description, priority, status, source_ip)
         VALUES ($1, $2, $3::alert_priority, 'new'::alert_status, $4)
         RETURNING id::text AS id, title, priority::text AS priority,
                   status::text AS status, source_ip, description,
                   created_at::text AS created_at",
    )
    .bind(title)
    .bind(description)
    .bind(priority)
    .bind(source_ip)
    .fetch_one(&state.pool)
    .await
    {
        Ok(row) => row,
        Err(error) => {
            log::error!("Falha ao salvar alerta: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Alert could not be saved"}));
        }
    };

    HttpResponse::Created().json(alert_json(&row))
}

async fn list_logs(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let rows = match sqlx::query(
        "SELECT id::text AS id, event_type, severity::text AS severity,
                message, source_ip, created_at::text AS created_at
         FROM security_logs ORDER BY created_at DESC LIMIT 100",
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            log::error!("Falha ao consultar logs: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Security logs unavailable"}));
        }
    };

    let logs: Vec<Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.try_get::<String, _>("id").unwrap_or_default(),
                "event_type": row.try_get::<String, _>("event_type").unwrap_or_default(),
                "severity": row.try_get::<String, _>("severity").unwrap_or_default(),
                "message": row.try_get::<String, _>("message").unwrap_or_default(),
                "source_ip": row.try_get::<Option<String>, _>("source_ip").unwrap_or(None),
                "created_at": row.try_get::<String, _>("created_at").unwrap_or_default()
            })
        })
        .collect();

    let total = logs.len();

    HttpResponse::Ok().json(json!({
        "logs": logs,
        "total": total
    }))
}

async fn create_log(
    request: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateLogRequest>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let event_type = body.event_type.trim().to_string();
    let severity = body.severity.trim().to_ascii_lowercase();
    let message = body.message.trim().to_string();
    let source_ip = body.source_ip.clone();

    if event_type.is_empty()
        || event_type.len() > 100
        || message.is_empty()
        || !matches!(severity.as_str(), "info" | "warning" | "error" | "critical")
    {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid security log"
        }));
    }

    let mut transaction = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(error) => {
            log::error!("Falha ao iniciar transação: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Security log could not be saved"}));
        }
    };

    let row = match sqlx::query(
        "INSERT INTO security_logs (event_type, severity, message, source_ip)
         VALUES ($1, $2::log_severity, $3, $4)
         RETURNING id::text AS id, event_type, severity::text AS severity,
                   message, source_ip, created_at::text AS created_at",
    )
    .bind(&event_type)
    .bind(&severity)
    .bind(&message)
    .bind(source_ip.clone())
    .fetch_one(&mut *transaction)
    .await
    {
        Ok(row) => row,
        Err(error) => {
            log::error!("Falha ao salvar log: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Security log could not be saved"}));
        }
    };

    if severity == "critical" || severity == "error" {
        let priority = if severity == "critical" {
            "critical"
        } else {
            "high"
        };

        let title = format!("Alerta: {event_type}");

        if let Err(error) = sqlx::query(
            "INSERT INTO alerts (title, description, priority, status, source_ip)
             VALUES ($1, $2, $3::alert_priority, 'new'::alert_status, $4)",
        )
        .bind(title)
        .bind(message.clone())
        .bind(priority)
        .bind(source_ip.clone())
        .execute(&mut *transaction)
        .await
        {
            log::error!("Falha ao criar alerta associado ao log: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Security event could not be committed"}));
        }
    }

    let log_json = json!({
        "id": row.try_get::<String, _>("id").unwrap_or_default(),
        "event_type": row.try_get::<String, _>("event_type").unwrap_or_default(),
        "severity": row.try_get::<String, _>("severity").unwrap_or_default(),
        "message": row.try_get::<String, _>("message").unwrap_or_default(),
        "source_ip": row.try_get::<Option<String>, _>("source_ip").unwrap_or(None),
        "created_at": row.try_get::<String, _>("created_at").unwrap_or_default()
    });

    if let Err(error) = transaction.commit().await {
        log::error!("Falha ao confirmar transação: {error}");
        return HttpResponse::InternalServerError()
            .json(json!({"error": "Security event could not be committed"}));
    }

    HttpResponse::Created().json(log_json)
}

async fn security_log_stats(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let row = match sqlx::query(
        "SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE severity::text = 'critical')::bigint AS critical,
            COUNT(*) FILTER (WHERE severity::text = 'error')::bigint AS error,
            COUNT(*) FILTER (WHERE severity::text = 'warning')::bigint AS warning,
            COUNT(*) FILTER (WHERE severity::text = 'info')::bigint AS info
         FROM security_logs
         WHERE created_at >= NOW() - INTERVAL '24 hours'",
    )
    .fetch_one(&state.pool)
    .await
    {
        Ok(row) => row,
        Err(error) => {
            log::error!("Falha ao consultar estatísticas de logs: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Statistics unavailable"}));
        }
    };

    HttpResponse::Ok().json(json!({
        "total_logs_24h": row.try_get::<i64, _>("total").unwrap_or(0),
        "critical": row.try_get::<i64, _>("critical").unwrap_or(0),
        "error": row.try_get::<i64, _>("error").unwrap_or(0),
        "warning": row.try_get::<i64, _>("warning").unwrap_or(0),
        "info": row.try_get::<i64, _>("info").unwrap_or(0)
    }))
}

async fn list_assets(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let rows = match sqlx::query(
        "SELECT id::text AS id, name, ip_address,
                asset_type::text AS asset_type, status::text AS status,
                criticality::text AS criticality, location, department,
                created_at::text AS created_at, last_seen::text AS last_seen
         FROM assets ORDER BY created_at DESC LIMIT 500",
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            log::error!("Falha ao consultar ativos: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Assets unavailable"}));
        }
    };

    let assets: Vec<Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.try_get::<String, _>("id").unwrap_or_default(),
                "name": row.try_get::<String, _>("name").unwrap_or_default(),
                "ip_address": row.try_get::<String, _>("ip_address").unwrap_or_default(),
                "asset_type": row.try_get::<String, _>("asset_type").unwrap_or_default(),
                "status": row.try_get::<String, _>("status").unwrap_or_default(),
                "criticality": row.try_get::<String, _>("criticality").unwrap_or_default(),
                "location": row.try_get::<Option<String>, _>("location").unwrap_or(None),
                "department": row.try_get::<Option<String>, _>("department").unwrap_or(None),
                "created_at": row.try_get::<String, _>("created_at").unwrap_or_default(),
                "last_seen": row.try_get::<Option<String>, _>("last_seen").unwrap_or(None)
            })
        })
        .collect();

    let total = assets.len();

    HttpResponse::Ok().json(json!({
        "assets": assets,
        "total": total
    }))
}


#[derive(Deserialize)]
struct CreateAssetRequest {
    name: String,
    ip_address: String,
    asset_type: String,
    status: Option<String>,
    criticality: Option<String>,
    location: Option<String>,
    department: Option<String>,
    description: Option<String>,
}

async fn create_asset(
    request: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateAssetRequest>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let name = body.name.trim().to_string();
    let ip_address = body.ip_address.trim().to_string();
    let asset_type = body.asset_type.trim().to_ascii_lowercase();
    let status = body
        .status
        .as_deref()
        .unwrap_or("active")
        .trim()
        .to_ascii_lowercase();
    let criticality = body
        .criticality
        .as_deref()
        .unwrap_or("medium")
        .trim()
        .to_ascii_lowercase();

    let valid_asset_type = matches!(
        asset_type.as_str(),
        "server" | "workstation" | "network_device" | "database"
            | "cloud_instance" | "container" | "iot_device" | "firewall"
    );

    let valid_status = matches!(
        status.as_str(),
        "active" | "inactive" | "maintenance" | "compromised" | "decommissioned"
    );

    let valid_criticality = matches!(
        criticality.as_str(),
        "low" | "medium" | "high" | "critical"
    );

    if name.is_empty()
        || name.len() > 255
        || ip_address.is_empty()
        || ip_address.len() > 45
        || !valid_asset_type
        || !valid_status
        || !valid_criticality
    {
        return HttpResponse::BadRequest().json(json!({
            "error": "Invalid asset fields"
        }));
    }

    let description = body.description.as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let location = body.location.as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let department = body.department.as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    let row = match sqlx::query(
        "INSERT INTO assets
            (name, description, ip_address, asset_type, status,
             criticality, location, department)
         VALUES ($1, $2, $3, $4::asset_type, $5::asset_status,
                 $6::criticality, $7, $8)
         RETURNING id::text AS id, name, ip_address,
                   asset_type::text AS asset_type,
                   status::text AS status,
                   criticality::text AS criticality,
                   location, department,
                   created_at::text AS created_at,
                   last_seen::text AS last_seen"
    )
    .bind(name)
    .bind(description)
    .bind(ip_address)
    .bind(asset_type)
    .bind(status)
    .bind(criticality)
    .bind(location)
    .bind(department)
    .fetch_one(&state.pool)
    .await
    {
        Ok(row) => row,
        Err(error) => {
            log::error!("Falha ao cadastrar ativo: {error}");
            return HttpResponse::InternalServerError().json(json!({
                "error": "Asset could not be saved"
            }));
        }
    };

    HttpResponse::Created().json(json!({
        "id": row.try_get::<String, _>("id").unwrap_or_default(),
        "name": row.try_get::<String, _>("name").unwrap_or_default(),
        "ip_address": row.try_get::<String, _>("ip_address").unwrap_or_default(),
        "asset_type": row.try_get::<String, _>("asset_type").unwrap_or_default(),
        "status": row.try_get::<String, _>("status").unwrap_or_default(),
        "criticality": row.try_get::<String, _>("criticality").unwrap_or_default(),
        "location": row.try_get::<Option<String>, _>("location").unwrap_or(None),
        "department": row.try_get::<Option<String>, _>("department").unwrap_or(None),
        "created_at": row.try_get::<String, _>("created_at").unwrap_or_default(),
        "last_seen": row.try_get::<Option<String>, _>("last_seen").unwrap_or(None)
    }))
}

async fn dashboard_stats(
    request: HttpRequest,
    state: web::Data<AppState>,
) -> HttpResponse {
    if let Err(response) = authenticate(&request, &state, false) {
        return response;
    }

    let row = match sqlx::query(
        "SELECT
            (SELECT COUNT(*) FROM assets)::bigint AS total_assets,
            (SELECT COUNT(*) FROM assets WHERE status::text = 'active')::bigint AS active_assets,
            (SELECT COUNT(*) FROM assets WHERE criticality::text = 'critical')::bigint AS critical_assets,
            (SELECT COUNT(*) FROM alerts)::bigint AS total_alerts,
            (SELECT COUNT(*) FROM alerts
                WHERE priority::text = 'critical' AND status::text <> 'resolved')::bigint AS critical_alerts,
            (SELECT COUNT(*) FROM security_logs
                WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint AS logs_24h,
            (SELECT COUNT(*) FROM security_logs
                WHERE severity::text = 'critical'
                  AND created_at >= NOW() - INTERVAL '24 hours')::bigint AS critical_logs",
    )
    .fetch_one(&state.pool)
    .await
    {
        Ok(row) => row,
        Err(error) => {
            log::error!("Falha ao consultar o dashboard: {error}");
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Dashboard statistics unavailable"}));
        }
    };

    HttpResponse::Ok().json(json!({
        "total_assets": row.try_get::<i64, _>("total_assets").unwrap_or(0),
        "active_assets": row.try_get::<i64, _>("active_assets").unwrap_or(0),
        "critical_assets": row.try_get::<i64, _>("critical_assets").unwrap_or(0),
        "total_alerts": row.try_get::<i64, _>("total_alerts").unwrap_or(0),
        "critical_alerts": row.try_get::<i64, _>("critical_alerts").unwrap_or(0),
        "logs_24h": row.try_get::<i64, _>("logs_24h").unwrap_or(0),
        "critical_logs": row.try_get::<i64, _>("critical_logs").unwrap_or(0)
    }))
}

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv().ok();
    let _ = env_logger::try_init();

    let database_url = env::var("DATABASE_URL")?;
    let jwt_secret = env::var("JWT_SECRET")?;
    let monitor_token = env::var("TELEGRAM_MONITOR_TOKEN").unwrap_or_default();

    if jwt_secret.len() < 32 {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "JWT_SECRET deve ter pelo menos 32 caracteres.",
        )
        .into());
    }

    if monitor_token.len() < 32 {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "TELEGRAM_MONITOR_TOKEN ausente ou muito curto.",
        )
        .into());
    }

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    let admin_username = env::var("ADMIN_BOOTSTRAP_USERNAME").unwrap_or_default();
    let admin_password = env::var("ADMIN_BOOTSTRAP_PASSWORD").unwrap_or_default();

    if !admin_username.is_empty() && !admin_password.is_empty() {
        bootstrap_admin(&pool, &admin_username, &admin_password).await?;
    } else {
        let user_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*)::bigint FROM users",
        )
        .fetch_one(&pool)
        .await?;

        if user_count == 0 {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Não há usuários. Configure as credenciais iniciais do administrador.",
            )
            .into());
        }
    }

    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(8080);

    let state = web::Data::new(AppState {
        pool,
        jwt_secret,
        monitor_token,
    });

    println!("CKAEW Sentinel AI v0.2.0 iniciado.");
    println!("PostgreSQL conectado; autenticação JWT habilitada.");
    println!("API ouvindo na porta {port}.");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(Logger::default())
            .route("/", web::get().to(index))
            .route("/api/health", web::get().to(health_check))
            .route("/api/auth/login", web::post().to(login))
            .route("/api/auth/register", web::post().to(register))
            .route("/api/auth/me", web::get().to(get_current_user))
            .route("/api/assets", web::get().to(list_assets))
            .route("/api/assets", web::post().to(create_asset))
            .route("/api/security/logs", web::get().to(list_logs))
            .route("/api/security/logs", web::post().to(create_log))
            .route("/api/security/logs/stats", web::get().to(security_log_stats))
            .route("/api/alerts", web::get().to(list_alerts))
            .route("/api/alerts", web::post().to(create_alert))
            .route("/api/dashboard/stats", web::get().to(dashboard_stats))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await?;

    Ok(())
}
