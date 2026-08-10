use serde_json::json;
use chrono::Utc;
use std::sync::OnceLock;
use std::env;

#[derive(Clone)]
pub struct StructuredLogger {
    service: String,
    environment: String,
}

impl StructuredLogger {
    pub fn new(service: &str) -> Self {
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
        
        Self {
            service: service.to_string(),
            environment,
        }
    }

    pub fn info(&self, message: &str, context: Option<serde_json::Value>) {
        self.log("info", message, context);
    }

    pub fn warn(&self, message: &str, context: Option<serde_json::Value>) {
        self.log("warn", message, context);
    }

    pub fn error(&self, message: &str, context: Option<serde_json::Value>) {
        self.log("error", message, context);
    }

    pub fn debug(&self, message: &str, context: Option<serde_json::Value>) {
        if self.environment == "development" {
            self.log("debug", message, context);
        }
    }

    fn log(&self, level: &str, message: &str, context: Option<serde_json::Value>) {
        let log_entry = json!({
            "timestamp": Utc::now().to_rfc3339(),
            "level": level,
            "service": self.service,
            "environment": self.environment,
            "message": message,
            "context": context,
            "correlation_id": self.generate_correlation_id(),
        });

        // Saída em JSON
        println!("{}", log_entry);
    }

    fn generate_correlation_id(&self) -> String {
        uuid::Uuid::new_v4().to_string()
    }
}

// Singleton para uso global
static LOGGER: OnceLock<StructuredLogger> = OnceLock::new();

pub fn init_logger(service: &str) {
    LOGGER.set(StructuredLogger::new(service)).unwrap();
}

pub fn get_logger() -> &'static StructuredLogger {
    LOGGER.get().expect("Logger not initialized")
}
