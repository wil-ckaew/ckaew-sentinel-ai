use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Asset {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub ip_address: String,
    pub asset_type: AssetType,
    pub status: AssetStatus,
    pub criticality: Criticality,
    pub location: Option<String>,
    pub department: Option<String>,
    pub owner_id: Option<Uuid>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_seen: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CreateAssetRequest {
    pub name: String,
    pub description: Option<String>,
    pub ip_address: String,
    pub asset_type: AssetType,
    pub status: AssetStatus,
    pub criticality: Criticality,
    pub location: Option<String>,
    pub department: Option<String>,
    pub owner_id: Option<Uuid>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateAssetRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub ip_address: Option<String>,
    pub asset_type: Option<AssetType>,
    pub status: Option<AssetStatus>,
    pub criticality: Option<Criticality>,
    pub location: Option<String>,
    pub department: Option<String>,
    pub owner_id: Option<Uuid>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "asset_type", rename_all = "snake_case")]
pub enum AssetType {
    Server,
    Workstation,
    NetworkDevice,
    Database,
    CloudInstance,
    Container,
    IotDevice,
    Firewall,
}

impl std::fmt::Display for AssetType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AssetType::Server => write!(f, "server"),
            AssetType::Workstation => write!(f, "workstation"),
            AssetType::NetworkDevice => write!(f, "network_device"),
            AssetType::Database => write!(f, "database"),
            AssetType::CloudInstance => write!(f, "cloud_instance"),
            AssetType::Container => write!(f, "container"),
            AssetType::IotDevice => write!(f, "iot_device"),
            AssetType::Firewall => write!(f, "firewall"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "asset_status", rename_all = "snake_case")]
pub enum AssetStatus {
    Active,
    Inactive,
    Maintenance,
    Compromised,
    Decommissioned,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "criticality", rename_all = "snake_case")]
pub enum Criticality {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Vulnerability {
    pub id: Uuid,
    pub asset_id: Uuid,
    pub cve_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub severity: VulnerabilitySeverity,
    pub cvss_score: Option<f64>,
    pub status: VulnerabilityStatus,
    pub detection_date: DateTime<Utc>,
    pub resolved_date: Option<DateTime<Utc>>,
    pub assigned_to: Option<Uuid>,
    pub remediation_steps: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "vulnerability_severity", rename_all = "snake_case")]
pub enum VulnerabilitySeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "vulnerability_status", rename_all = "snake_case")]
pub enum VulnerabilityStatus {
    Open,
    InProgress,
    Mitigated,
    Accepted,
    Closed,
}
