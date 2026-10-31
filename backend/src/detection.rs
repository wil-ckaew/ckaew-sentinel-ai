use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use std::collections::HashSet;

#[derive(Clone)]
pub struct DetectionConfig {
    pub interval_secs: u64,
    pub offline_after_secs: i64,
    pub cpu_warning: f64,
    pub cpu_critical: f64,
    pub memory_warning: f64,
    pub memory_critical: f64,
    pub disk_warning: f64,
    pub disk_critical: f64,
}

impl DetectionConfig {
    pub fn from_env() -> Self {
        fn number(name: &str, default: f64) -> f64 {
            std::env::var(name)
                .ok()
                .and_then(|value| value.parse::<f64>().ok())
                .filter(|value| value.is_finite())
                .unwrap_or(default)
                .clamp(0.0, 100.0)
        }

        fn seconds(name: &str, default: u64, minimum: u64) -> u64 {
            std::env::var(name)
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(default)
                .max(minimum)
        }

        let cpu_warning = number("AGENT_CPU_WARNING", 85.0);
        let memory_warning = number("AGENT_MEMORY_WARNING", 90.0);
        let disk_warning = number("AGENT_DISK_WARNING", 90.0);

        Self {
            interval_secs: seconds("DETECTION_INTERVAL_SECS", 30, 5),
            offline_after_secs: seconds("AGENT_OFFLINE_AFTER_SECS", 120, 30) as i64,

            cpu_warning,
            cpu_critical: number("AGENT_CPU_CRITICAL", 95.0).max(cpu_warning),

            memory_warning,
            memory_critical: number("AGENT_MEMORY_CRITICAL", 95.0).max(memory_warning),

            disk_warning,
            disk_critical: number("AGENT_DISK_CRITICAL", 95.0).max(disk_warning),
        }
    }
}

struct DiskInfo {
    mount_point: String,
    usage_percent: f64,
    total: u64,
    used: u64,
    free: u64,
}

// O agente pode reportar vários pontos de montagem do mesmo volume.
// Agrupamos estatísticas idênticas para não gerar alertas duplicados.
fn unique_disks(value: &Value) -> Vec<DiskInfo> {
    let Some(items) = value.as_array() else {
        return Vec::new();
    };

    let mut seen = HashSet::new();
    let mut disks = Vec::new();

    for item in items {
        let total = item.get("total").and_then(Value::as_u64).unwrap_or(0);
        let used = item.get("used").and_then(Value::as_u64).unwrap_or(0);
        let free = item.get("free").and_then(Value::as_u64).unwrap_or(0);

        if total == 0 || !seen.insert((total, used, free)) {
            continue;
        }

        let mount_point = item
            .get("mount_point")
            .and_then(Value::as_str)
            .unwrap_or("unknown")
            .to_string();

        let usage_percent = item
            .get("usage_percent")
            .and_then(Value::as_f64)
            .unwrap_or(0.0)
            .clamp(0.0, 100.0);

        disks.push(DiskInfo {
            mount_point,
            usage_percent,
            total,
            used,
            free,
        });
    }

    disks
}

fn safe_rule_key(value: &str) -> String {
    value
        .chars()
        .filter(|character| {
            character.is_ascii_alphanumeric()
                || *character == '_'
                || *character == '-'
                || *character == '.'
                || *character == ':'
        })
        .take(100)
        .collect()
}

async fn write_security_event(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event_type: &str,
    severity: &str,
    message: &str,
    details: Value,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO security_logs (
            event_type, severity, message, details
        )
        VALUES ($1, $2::log_severity, $3, $4)
        "#,
    )
    .bind(event_type)
    .bind(severity)
    .bind(message)
    .bind(details)
    .execute(&mut **transaction)
    .await?;

    Ok(())
}

async fn evaluate_rule(
    pool: &PgPool,
    agent_id: &str,
    hostname: &str,
    rule_key: &str,
    title: &str,
    value: f64,
    threshold: f64,
    critical_threshold: f64,
    breached: bool,
) -> Result<(), sqlx::Error> {
    let mut transaction = pool.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO agent_alert_states (
            agent_id, rule_key, is_active,
            last_value, threshold, last_evaluated_at, updated_at
        )
        VALUES ($1, $2, FALSE, $3, $4, NOW(), NOW())
        ON CONFLICT (agent_id, rule_key) DO NOTHING
        "#,
    )
    .bind(agent_id)
    .bind(rule_key)
    .bind(value)
    .bind(threshold)
    .execute(&mut *transaction)
    .await?;

    let state = sqlx::query(
        r#"
        SELECT is_active, alert_id::text AS alert_id
        FROM agent_alert_states
        WHERE agent_id = $1 AND rule_key = $2
        FOR UPDATE
        "#,
    )
    .bind(agent_id)
    .bind(rule_key)
    .fetch_one(&mut *transaction)
    .await?;

    let was_active: bool = state.try_get("is_active")?;
    let alert_id: Option<String> = state.try_get("alert_id")?;

    let priority = if value >= critical_threshold {
        "critical"
    } else {
        "high"
    };

    let description = if rule_key == "agent_offline" {
        format!(
            "O agente {} está sem comunicação há {:.0} segundos. Limite: {:.0} segundos.",
            hostname, value, threshold
        )
    } else {
        format!(
            "Agente {}: {} está em {:.2}%. Limite configurado: {:.2}%.",
            hostname, title, value, threshold
        )
    };

    if breached && (!was_active || alert_id.is_none()) {
        let metadata = json!({
            "source": "rust_detection_engine",
            "agent_id": agent_id,
            "agent_hostname": hostname,
            "rule_key": rule_key,
            "current_value": value,
            "threshold": threshold
        });

        let new_alert_id: String = sqlx::query_scalar(
            r#"
            INSERT INTO alerts (
                title, description, priority, status, metadata
            )
            VALUES (
                $1, $2, $3::alert_priority, 'new'::alert_status, $4
            )
            RETURNING id::text
            "#,
        )
        .bind(title)
        .bind(&description)
        .bind(priority)
        .bind(metadata.clone())
        .fetch_one(&mut *transaction)
        .await?;

        let event_type = if rule_key == "agent_offline" {
            "AGENT_OFFLINE"
        } else {
            "AGENT_THRESHOLD_EXCEEDED"
        };

        let severity = if priority == "critical" {
            "critical"
        } else {
            "warning"
        };

        write_security_event(
            &mut transaction,
            event_type,
            severity,
            &description,
            metadata,
        )
        .await?;

        sqlx::query(
            r#"
            UPDATE agent_alert_states
            SET alert_id = $3::uuid,
                is_active = TRUE,
                last_value = $4,
                threshold = $5,
                first_triggered_at = NOW(),
                last_evaluated_at = NOW(),
                recovered_at = NULL,
                updated_at = NOW()
            WHERE agent_id = $1 AND rule_key = $2
            "#,
        )
        .bind(agent_id)
        .bind(rule_key)
        .bind(new_alert_id)
        .bind(value)
        .bind(threshold)
        .execute(&mut *transaction)
        .await?;

        log::warn!(
            "Detecção: agente={} regra={} valor={:.2} prioridade={}",
            hostname,
            rule_key,
            value,
            priority
        );
    } else if breached {
        let metadata = json!({
            "source": "rust_detection_engine",
            "agent_id": agent_id,
            "agent_hostname": hostname,
            "rule_key": rule_key,
            "current_value": value,
            "threshold": threshold
        });

        if let Some(existing_alert_id) = alert_id {
            sqlx::query(
                r#"
                UPDATE alerts
                SET priority = $2::alert_priority,
                    description = $3,
                    metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
                    updated_at = NOW()
                WHERE id = $1::uuid
                  AND status::text <> 'resolved'
                "#,
            )
            .bind(existing_alert_id)
            .bind(priority)
            .bind(&description)
            .bind(metadata)
            .execute(&mut *transaction)
            .await?;
        }

        sqlx::query(
            r#"
            UPDATE agent_alert_states
            SET last_value = $3,
                threshold = $4,
                last_evaluated_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1 AND rule_key = $2
            "#,
        )
        .bind(agent_id)
        .bind(rule_key)
        .bind(value)
        .bind(threshold)
        .execute(&mut *transaction)
        .await?;
    } else if was_active {
        if let Some(existing_alert_id) = alert_id {
            let resolution = format!(
                "Condição normalizada automaticamente pelo motor de detecção. Último valor: {:.2}.",
                value
            );

            sqlx::query(
                r#"
                UPDATE alerts
                SET status = 'resolved'::alert_status,
                    resolved_at = NOW(),
                    resolution_notes = $2,
                    updated_at = NOW()
                WHERE id = $1::uuid
                  AND status::text <> 'resolved'
                "#,
            )
            .bind(existing_alert_id)
            .bind(&resolution)
            .execute(&mut *transaction)
            .await?;
        }

        let event_type = if rule_key == "agent_offline" {
            "AGENT_ONLINE"
        } else {
            "AGENT_THRESHOLD_RECOVERED"
        };

        let message = format!(
            "Recuperação automática: agente {}. Regra {} normalizada. Valor atual: {:.2}.",
            hostname, rule_key, value
        );

        let metadata = json!({
            "source": "rust_detection_engine",
            "agent_id": agent_id,
            "agent_hostname": hostname,
            "rule_key": rule_key,
            "current_value": value,
            "threshold": threshold
        });

        write_security_event(&mut transaction, event_type, "info", &message, metadata).await?;

        sqlx::query(
            r#"
            UPDATE agent_alert_states
            SET is_active = FALSE,
                last_value = $3,
                threshold = $4,
                last_evaluated_at = NOW(),
                recovered_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1 AND rule_key = $2
            "#,
        )
        .bind(agent_id)
        .bind(rule_key)
        .bind(value)
        .bind(threshold)
        .execute(&mut *transaction)
        .await?;

        log::info!("Recuperação: agente={} regra={}", hostname, rule_key);
    } else {
        sqlx::query(
            r#"
            UPDATE agent_alert_states
            SET last_value = $3,
                threshold = $4,
                last_evaluated_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1 AND rule_key = $2
            "#,
        )
        .bind(agent_id)
        .bind(rule_key)
        .bind(value)
        .bind(threshold)
        .execute(&mut *transaction)
        .await?;
    }

    transaction.commit().await?;
    Ok(())
}

pub async fn run_cycle(pool: &PgPool, config: &DetectionConfig) -> Result<(), sqlx::Error> {
    // Atualiza a situação de comunicação de todas as máquinas.
    sqlx::query(
        r#"
        UPDATE agents
        SET status = CASE
            WHEN last_seen < NOW() - ($1::double precision * INTERVAL '1 second')
            THEN 'offline'
            ELSE 'online'
        END
        WHERE status IS DISTINCT FROM CASE
            WHEN last_seen < NOW() - ($1::double precision * INTERVAL '1 second')
            THEN 'offline'
            ELSE 'online'
        END
        "#,
    )
    .bind(config.offline_after_secs as f64)
    .execute(pool)
    .await?;

    let rows = sqlx::query(
        r#"
        SELECT
            a.agent_id,
            a.hostname,
            EXTRACT(EPOCH FROM (NOW() - a.last_seen))::double precision
                AS seconds_since_seen,
            m.id AS metric_id,
            m.cpu_usage,
            m.memory_usage,
            m.disk_usage
        FROM agents a
        LEFT JOIN LATERAL (
            SELECT id, cpu_usage, memory_usage, disk_usage
            FROM agent_metrics
            WHERE agent_id = a.agent_id
            ORDER BY collected_at DESC
            LIMIT 1
        ) m ON TRUE
        ORDER BY a.hostname
        "#,
    )
    .fetch_all(pool)
    .await?;

    for row in rows {
        let agent_id: String = row.try_get("agent_id")?;
        let hostname: String = row.try_get("hostname")?;
        let seconds_since_seen: f64 = row.try_get("seconds_since_seen")?;
        let metric_id: Option<i64> = row.try_get("metric_id")?;

        let offline = seconds_since_seen >= config.offline_after_secs as f64;

        evaluate_rule(
            pool,
            &agent_id,
            &hostname,
            "agent_offline",
            "Agente sem comunicação",
            seconds_since_seen,
            config.offline_after_secs as f64,
            0.0,
            offline,
        )
        .await?;

        // Métricas antigas não devem gerar alertas novos enquanto
        // a máquina está offline.
        if offline || metric_id.is_none() {
            continue;
        }

        let cpu: f64 = row.try_get::<Option<f64>, _>("cpu_usage")?.unwrap_or(0.0);
        let memory: f64 = row
            .try_get::<Option<f64>, _>("memory_usage")?
            .unwrap_or(0.0);

        evaluate_rule(
            pool,
            &agent_id,
            &hostname,
            "cpu_high",
            "Uso elevado de CPU",
            cpu,
            config.cpu_warning,
            config.cpu_critical,
            cpu >= config.cpu_warning,
        )
        .await?;

        evaluate_rule(
            pool,
            &agent_id,
            &hostname,
            "memory_high",
            "Uso elevado de memória",
            memory,
            config.memory_warning,
            config.memory_critical,
            memory >= config.memory_warning,
        )
        .await?;

        let disk_value: Value = row
            .try_get::<Option<Value>, _>("disk_usage")?
            .unwrap_or_else(|| json!([]));

        for disk in unique_disks(&disk_value) {
            let key_suffix = disk.mount_point.trim_matches('/').replace('/', "_");

            let suffix = if key_suffix.is_empty() {
                "root".to_string()
            } else {
                key_suffix
            };

            let rule_key = safe_rule_key(&format!("disk_high:{suffix}"));
            let title = format!("Uso elevado de disco: {}", disk.mount_point);
            let description_key = rule_key.clone();

            evaluate_rule(
                pool,
                &agent_id,
                &hostname,
                &description_key,
                &title,
                disk.usage_percent,
                config.disk_warning,
                config.disk_critical,
                disk.usage_percent >= config.disk_warning,
            )
            .await?;

            let _disk_capacity = (disk.total, disk.used, disk.free);
        }
    }

    Ok(())
}
