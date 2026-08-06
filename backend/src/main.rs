use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger, HttpResponse, Responder};
use dotenv::dotenv;
use serde_json::json;
use std::sync::Mutex;
use std::collections::HashMap;

// Estado global para armazenar alertas dinâmicos
struct AppState {
    alerts: Mutex<Vec<serde_json::Value>>,
    logs: Mutex<Vec<serde_json::Value>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    println!("🚀 CKAEW Sentinel AI v0.2.0 - Modo Dinâmico");
    println!("📡 Servidor rodando em http://0.0.0.0:8080");

    // Inicializar com dados mockados
    let state = web::Data::new(AppState {
        alerts: Mutex::new(vec![
            json!({
                "id": "1",
                "title": "Tentativa de Força Bruta",
                "priority": "critical",
                "status": "new",
                "source_ip": "192.168.1.45",
                "created_at": "2024-01-15T10:34:35Z"
            }),
            json!({
                "id": "2",
                "title": "Login Suspeito",
                "priority": "high",
                "status": "investigating",
                "source_ip": "10.0.1.100",
                "created_at": "2024-01-15T10:20:11Z"
            }),
            json!({
                "id": "3",
                "title": "Escaneamento de Portas",
                "priority": "medium",
                "status": "new",
                "source_ip": "10.0.0.55",
                "created_at": "2024-01-15T10:15:42Z"
            }),
            json!({
                "id": "4",
                "title": "Arquivo Malicioso Detectado",
                "priority": "critical",
                "status": "new",
                "source_ip": "DESKTOP-7GHAB2",
                "created_at": "2024-01-15T10:10:55Z"
            }),
            json!({
                "id": "5",
                "title": "Acesso fora do padrão",
                "priority": "high",
                "status": "investigating",
                "source_ip": "usuario@empresa.com",
                "created_at": "2024-01-15T09:55:30Z"
            })
        ]),
        logs: Mutex::new(vec![
            json!({
                "id": "1",
                "event_type": "LOGIN_FAILED",
                "severity": "warning",
                "message": "Falha de login de 192.168.1.100",
                "source_ip": "192.168.1.100",
                "created_at": "2024-01-15T10:00:00Z"
            }),
            json!({
                "id": "2",
                "event_type": "FIREWALL_BLOCK",
                "severity": "error",
                "message": "Tráfego bloqueado pelo firewall",
                "source_ip": "10.0.0.55",
                "created_at": "2024-01-15T09:45:00Z"
            })
        ]),
    });

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .app_data(state.clone())
            .wrap(Logger::default())
            .wrap(cors)
            .route("/", web::get().to(index))
            .route("/api/health", web::get().to(health_check))
            .route("/api/auth/login", web::post().to(login))
            .route("/api/assets", web::get().to(list_assets))
            .route("/api/security/logs", web::get().to(list_logs))
            .route("/api/security/logs", web::post().to(create_log))
            .route("/api/security/logs/stats", web::get().to(get_stats))
            .route("/api/alerts", web::get().to(list_alerts))
            .route("/api/alerts", web::post().to(create_alert))
            .route("/api/dashboard/stats", web::get().to(dashboard_stats))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}

// ============ Handlers ============

async fn index() -> impl Responder {
    HttpResponse::Ok().body("🚀 CKAEW Sentinel AI - Servidor Rodando!")
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "service": "CKAEW Sentinel AI",
        "version": "0.2.0"
    }))
}

#[derive(serde::Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

async fn login(req: web::Json<LoginRequest>) -> impl Responder {
    if req.username == "admin" && req.password == "admin123" {
        HttpResponse::Ok().json(json!({
            "token": "mock-token-123456789",
            "user_id": "1",
            "username": "admin",
            "role": "Admin"
        }))
    } else {
        HttpResponse::Unauthorized().json(json!({
            "error": "Invalid credentials"
        }))
    }
}

async fn list_assets() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "assets": [
            {
                "id": "1",
                "name": "Web Server",
                "ip_address": "10.0.1.10",
                "asset_type": "server",
                "status": "active",
                "criticality": "high",
                "location": "Data Center A",
                "department": "IT"
            },
            {
                "id": "2",
                "name": "Database Server",
                "ip_address": "10.0.1.20",
                "asset_type": "database",
                "status": "active",
                "criticality": "critical",
                "location": "Data Center A",
                "department": "IT"
            },
            {
                "id": "3",
                "name": "Firewall",
                "ip_address": "10.0.0.1",
                "asset_type": "firewall",
                "status": "active",
                "criticality": "critical",
                "location": "Network",
                "department": "Security"
            }
        ],
        "total": 3
    }))
}

async fn list_logs(state: web::Data<AppState>) -> impl Responder {
    let logs = state.logs.lock().unwrap();
    HttpResponse::Ok().json(json!({
        "logs": *logs,
        "total": logs.len()
    }))
}

#[derive(serde::Deserialize)]
struct CreateLogRequest {
    event_type: String,
    severity: String,
    message: String,
    source_ip: Option<String>,
}

async fn create_log(
    state: web::Data<AppState>,
    req: web::Json<CreateLogRequest>,
) -> impl Responder {
    let mut logs = state.logs.lock().unwrap();
    
    let new_log = json!({
        "id": format!("{}", logs.len() + 1),
        "event_type": req.event_type,
        "severity": req.severity,
        "message": req.message,
        "source_ip": req.source_ip,
        "created_at": chrono::Utc::now().to_rfc3339()
    });
    
    logs.push(new_log.clone());
    
    // Se for crítico, criar alerta automaticamente
    if req.severity == "critical" || req.severity == "error" {
        let mut alerts = state.alerts.lock().unwrap();
        let alert = json!({
            "id": format!("{}", alerts.len() + 1),
            "title": format!("Alerta: {}", req.event_type),
            "priority": if req.severity == "critical" { "critical" } else { "high" },
            "status": "new",
            "source_ip": req.source_ip,
            "created_at": chrono::Utc::now().to_rfc3339()
        });
        alerts.push(alert);
    }
    
    HttpResponse::Created().json(new_log)
}

async fn get_stats(state: web::Data<AppState>) -> impl Responder {
    let logs = state.logs.lock().unwrap();
    let total = logs.len();
    let critical = logs.iter().filter(|l| {
        l["severity"].as_str().unwrap_or("") == "critical"
    }).count();
    
    HttpResponse::Ok().json(json!({
        "total_logs_24h": total,
        "critical": critical,
        "error": logs.iter().filter(|l| l["severity"] == "error").count(),
        "warning": logs.iter().filter(|l| l["severity"] == "warning").count(),
        "info": logs.iter().filter(|l| l["severity"] == "info").count()
    }))
}

async fn list_alerts(state: web::Data<AppState>) -> impl Responder {
    let alerts = state.alerts.lock().unwrap();
    HttpResponse::Ok().json(json!({
        "alerts": *alerts,
        "total": alerts.len()
    }))
}

#[derive(serde::Deserialize)]
struct CreateAlertRequest {
    title: String,
    priority: String,
    source_ip: String,
}

async fn create_alert(
    state: web::Data<AppState>,
    req: web::Json<CreateAlertRequest>,
) -> impl Responder {
    let mut alerts = state.alerts.lock().unwrap();
    
    let new_alert = json!({
        "id": format!("{}", alerts.len() + 1),
        "title": req.title,
        "priority": req.priority,
        "status": "new",
        "source_ip": req.source_ip,
        "created_at": chrono::Utc::now().to_rfc3339()
    });
    
    alerts.push(new_alert.clone());
    HttpResponse::Created().json(new_alert)
}

async fn dashboard_stats(state: web::Data<AppState>) -> impl Responder {
    let alerts = state.alerts.lock().unwrap();
    let logs = state.logs.lock().unwrap();
    
    let critical_alerts = alerts.iter().filter(|a| {
        a["priority"].as_str().unwrap_or("") == "critical"
    }).count();
    
    HttpResponse::Ok().json(json!({
        "total_assets": 10,
        "active_assets": 8,
        "critical_assets": 3,
        "total_alerts": alerts.len(),
        "critical_alerts": critical_alerts,
        "logs_24h": logs.len(),
        "critical_logs": logs.iter().filter(|l| l["severity"] == "critical").count()
    }))
}
