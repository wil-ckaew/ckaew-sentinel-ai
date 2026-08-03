use reqwest::Client;
use serde_json::json;
use std::time::Duration;

use crate::models::{AgentPayload, ServerResponse};

pub struct ApiClient {
    client: Client,
    server_url: String,
    api_key: String,
}

impl ApiClient {
    pub fn new(server_url: String, api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            server_url,
            api_key,
        }
    }

    pub async fn send_metrics(&self, payload: &AgentPayload) -> Result<ServerResponse, anyhow::Error> {
        let url = format!("{}/api/agent/metrics", self.server_url);
        
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(payload)
            .send()
            .await?;

        if response.status().is_success() {
            let server_response: ServerResponse = response.json().await?;
            Ok(server_response)
        } else {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Err(anyhow::anyhow!("Server error: {}", error_text))
        }
    }

    pub async fn send_logs(&self, logs: &[crate::models::SecurityLog], agent_id: &str) -> Result<(), anyhow::Error> {
        let url = format!("{}/api/security/logs/batch", self.server_url);
        
        let payload = json!({
            "agent_id": agent_id,
            "logs": logs
        });

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow::anyhow!("Failed to send logs: {}", error_text));
        }

        Ok(())
    }

    pub async fn health_check(&self) -> Result<bool, anyhow::Error> {
        let url = format!("{}/api/health", self.server_url);
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }
}
