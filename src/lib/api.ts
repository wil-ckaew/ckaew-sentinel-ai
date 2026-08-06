import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
  get: (id: string) => api.get(`/api/alerts/${id}`),
  update: (id: string, data: any) => api.put(`/api/alerts/${id}`, data),
  resolve: (id: string, notes: string) => 
    api.post(`/api/alerts/${id}/resolve`, { resolution_notes: notes }),
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
