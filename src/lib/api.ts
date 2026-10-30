import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Tipos do agente Rust
export interface AgentDiskUsage {
  mount_point: string;
  total: number;
  used: number;
  free: number;
  usage_percent: number;
}

export interface AgentNetworkUsage {
  interface: string;
  bytes_received: number;
  bytes_sent: number;
  packets_received: number;
  packets_sent: number;
}

export interface AgentProcess {
  pid: number;
  name: string;
  cmd: string;
  cpu_usage: number;
  memory_usage: number;
  status: string;
  start_time: string;
}

export interface AgentMetric {
  id: number;
  collected_at: string;
  cpu_usage: number;
  memory_usage: number;
  load_average: number[];
  disk_usage: AgentDiskUsage[];
  network_usage: AgentNetworkUsage[];
  processes: AgentProcess[];
}

export interface AgentRecord {
  agent_id: string;
  hostname: string;
  operating_system: string;
  kernel_version: string;
  cpu_cores: number;
  total_memory: number;
  uptime: number;
  first_seen: string;
  last_seen: string;
  status: 'online' | 'offline' | string;
  latest_metric: AgentMetric | null;
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  register: (username: string, password: string, role: string) =>
    api.post('/api/auth/register', { username, password, role }),
  getMe: () => api.get('/api/auth/me'),
};

// Assets
export const assets = {
  list: (params?: any) => api.get('/api/assets', { params }),
  get: (id: string) => api.get(`/api/assets/${id}`),
  create: (data: any) => api.post('/api/assets', data),
  update: (id: string, data: any) => api.put(`/api/assets/${id}`, data),
  delete: (id: string) => api.delete(`/api/assets/${id}`),
};

// Security Logs
export const logs = {
  list: (params?: any) => api.get('/api/security/logs', { params }),
  create: (data: any) => api.post('/api/security/logs', data),
  stats: () => api.get('/api/security/logs/stats'),
};

// Alerts
export const alerts = {
  list: (params?: any) => api.get('/api/alerts', { params }),
  create: (data: any) => api.post('/api/alerts', data),
  get: (id: string) => api.get(`/api/alerts/${id}`),
  update: (id: string, data: any) => api.put(`/api/alerts/${id}`, data),
  resolve: (id: string, notes: string) =>
    api.post(`/api/alerts/${id}/resolve`, { resolution_notes: notes }),
};

// Rust Agents
export const agents = {
  list: () =>
    api.get<{ total: number; agents: AgentRecord[] }>('/api/agents'),

  history: (agentId: string, limit = 120) =>
    api.get<{
      agent_id: string;
      total: number;
      metrics: AgentMetric[];
    }>(`/api/agents/${encodeURIComponent(agentId)}/metrics`, {
      params: { limit },
    }),
};

// AI Service
export const ai = {
  detectAnomalies: (data: any[]) =>
    axios.post(`${AI_API_URL}/detect/anomalies/metrics`, { data }),
  detectLogAnomalies: (data: any[]) =>
    axios.post(`${AI_API_URL}/detect/anomalies/logs`, { data }),
  classifyIncident: (log: any) =>
    axios.post(`${AI_API_URL}/classify/incident`, log),
  trainAnomaly: (metrics: any[]) =>
    axios.post(`${AI_API_URL}/train/anomaly`, { metrics }),
  modelsStatus: () => axios.get(`${AI_API_URL}/models/status`),
};

export default api;
