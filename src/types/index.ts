export interface Asset {
  id: string;
  name: string;
  description?: string;
  ip_address: string;
  asset_type: 'server' | 'workstation' | 'network_device' | 'database' | 'cloud_instance' | 'container' | 'iot_device' | 'firewall';
  status: 'active' | 'inactive' | 'maintenance' | 'compromised' | 'decommissioned';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  department?: string;
  owner_id?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  last_seen?: string;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source_ip?: string;
  user_id?: string;
  asset_id?: string;
  details: any;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'escalated' | 'resolved' | 'false_positive';
  source_ip?: string;
  asset_id?: string;
  triggered_by?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  critical_assets: number;
  total_alerts: number;
  critical_alerts: number;
  new_alerts: number;
  total_logs_24h: number;
  critical_logs: number;
}

export interface AnomalyResult {
  anomaly: boolean;
  score: number;
  confidence: number;
}

export interface AuthResponse {
  token: string;
  user_id: string;
  username: string;
  role: 'Admin' | 'Analyst' | 'Auditor';
}
