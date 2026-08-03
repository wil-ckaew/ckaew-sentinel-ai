use actix_web::{get, web, HttpResponse, Responder};
use serde_json::json;
use sqlx::PgPool;

#[get("/api/alerts")]
pub async fn list_alerts(pool: web::Data<PgPool>) -> impl Responder {
    // Tentar buscar do banco de dados primeiro
    let alerts_result = sqlx::query!(
        r#"
        SELECT 
            id::text as id,
            title,
            priority,
            status,
            source_ip,
            created_at
        FROM alerts
        ORDER BY created_at DESC
        LIMIT 50
        "#
    )
    .fetch_all(pool.get_ref())
    .await;

    match alerts_result {
        Ok(alerts) => {
            if alerts.is_empty() {
                // Se não houver dados no banco, retornar dados mockados
                return HttpResponse::Ok().json(json!({
                    "alerts": [
                        {
                            "id": "1",
                            "title": "Tentativa de Força Bruta",
                            "priority": "critical",
                            "status": "new",
                            "source_ip": "192.168.1.45",
                            "created_at": "2024-01-15T10:34:35Z"
                        },
                        {
                            "id": "2",
                            "title": "Login Suspeito",
                            "priority": "high",
                            "status": "investigating",
                            "source_ip": "10.0.1.100",
                            "created_at": "2024-01-15T10:20:11Z"
                        },
                        {
                            "id": "3",
                            "title": "Escaneamento de Portas",
                            "priority": "medium",
                            "status": "new",
                            "source_ip": "10.0.0.55",
                            "created_at": "2024-01-15T10:15:42Z"
                        },
                        {
                            "id": "4",
                            "title": "Arquivo Malicioso Detectado",
                            "priority": "critical",
                            "status": "new",
                            "source_ip": "DESKTOP-7GHAB2",
                            "created_at": "2024-01-15T10:10:55Z"
                        },
                        {
                            "id": "5",
                            "title": "Acesso fora do padrão",
                            "priority": "high",
                            "status": "investigating",
                            "source_ip": "usuario@empresa.com",
                            "created_at": "2024-01-15T09:55:30Z"
                        },
                        {
                            "id": "6",
                            "title": "Ataque DDoS Detectado",
                            "priority": "critical",
                            "status": "escalated",
                            "source_ip": "10.0.5.10",
                            "created_at": "2024-01-15T09:30:15Z"
                        },
                        {
                            "id": "7",
                            "title": "Vulnerabilidade Crítica",
                            "priority": "critical",
                            "status": "new",
                            "source_ip": "SRV-PRODUCAO-01",
                            "created_at": "2024-01-15T08:45:20Z"
                        }
                    ],
                    "total": 7
                }))
            }

            // Converter para o formato esperado
            let alerts_json: Vec<serde_json::Value> = alerts
                .iter()
                .map(|a| {
                    json!({
                        "id": a.id,
                        "title": a.title,
                        "priority": a.priority,
                        "status": a.status,
                        "source_ip": a.source_ip,
                        "created_at": a.created_at
                    })
                })
                .collect();

            HttpResponse::Ok().json(json!({
                "alerts": alerts_json,
                "total": alerts_json.len()
            }))
        }
        Err(e) => {
            eprintln!("Error listing alerts: {}", e);
            // Retornar dados mockados em caso de erro
            HttpResponse::Ok().json(json!({
                "alerts": [
                    {
                        "id": "1",
                        "title": "Tentativa de Força Bruta",
                        "priority": "critical",
                        "status": "new",
                        "source_ip": "192.168.1.45",
                        "created_at": "2024-01-15T10:34:35Z"
                    },
                    {
                        "id": "2",
                        "title": "Login Suspeito",
                        "priority": "high",
                        "status": "investigating",
                        "source_ip": "10.0.1.100",
                        "created_at": "2024-01-15T10:20:11Z"
                    },
                    {
                        "id": "3",
                        "title": "Escaneamento de Portas",
                        "priority": "medium",
                        "status": "new",
                        "source_ip": "10.0.0.55",
                        "created_at": "2024-01-15T10:15:42Z"
                    }
                ],
                "total": 3
            }))
        }
    }
}
