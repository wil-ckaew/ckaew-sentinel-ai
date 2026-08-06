#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MockHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self._send_json({})

    def do_GET(self):
        if self.path == '/api/health':
            self._send_json({
                'status': 'ok',
                'service': 'CKAEW Sentinel AI',
                'version': '0.1.0'
            })
        
        elif self.path == '/api/dashboard/stats':
            self._send_json({
                'total_assets': 10,
                'active_assets': 8,
                'critical_assets': 3,
                'total_alerts': 5,
                'critical_alerts': 2,
                'logs_24h': 156,
                'critical_logs': 12
            })
        
        elif self.path == '/api/assets':
            self._send_json({
                'assets': [
                    {'id': '1', 'name': 'Web Server', 'ip_address': '10.0.1.10', 'asset_type': 'server', 'status': 'active', 'criticality': 'high'},
                    {'id': '2', 'name': 'Database Server', 'ip_address': '10.0.1.20', 'asset_type': 'database', 'status': 'active', 'criticality': 'critical'},
                    {'id': '3', 'name': 'Firewall', 'ip_address': '10.0.0.1', 'asset_type': 'firewall', 'status': 'active', 'criticality': 'critical'}
                ],
                'total': 3
            })
        
        elif self.path == '/api/security/logs':
            self._send_json({
                'logs': [
                    {'id': '1', 'event_type': 'LOGIN_FAILED', 'severity': 'warning', 'message': 'Falha de login', 'created_at': '2024-01-15T10:00:00Z'},
                    {'id': '2', 'event_type': 'FIREWALL_BLOCK', 'severity': 'error', 'message': 'Tráfego bloqueado', 'created_at': '2024-01-15T09:45:00Z'}
                ],
                'total': 2
            })
        
        elif self.path == '/api/security/logs/stats':
            self._send_json({
                'total_logs_24h': 156,
                'critical': 12
            })
        
        elif self.path == '/api/alerts':
            self._send_json({
                'alerts': [
                    {'id': '1', 'title': 'Tentativa de Força Bruta', 'priority': 'critical', 'status': 'new', 'source_ip': '192.168.1.45', 'created_at': '2024-01-15T10:34:35Z'},
                    {'id': '2', 'title': 'Login Suspeito', 'priority': 'high', 'status': 'investigating', 'source_ip': '10.0.1.100', 'created_at': '2024-01-15T10:20:11Z'}
                ],
                'total': 2
            })
        
        else:
            self._send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        if self.path == '/api/auth/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode())
                username = data.get('username', '')
                password = data.get('password', '')
                
                if username == 'admin' and password == 'admin123':
                    self._send_json({
                        'token': 'mock-token-123456789',
                        'user_id': '1',
                        'username': 'admin',
                        'role': 'Admin'
                    })
                else:
                    self._send_json({'error': 'Invalid credentials'}, 401)
            except:
                self._send_json({'error': 'Invalid request'}, 400)
        else:
            self._send_json({'error': 'Not found'}, 404)

if __name__ == '__main__':
    print('🚀 CKAEW Sentinel AI - Backend Mock')
    print('📡 Servidor rodando em http://0.0.0.0:8080')
    print('🔑 Credenciais: admin / admin123')
    server = HTTPServer(('0.0.0.0', 8080), MockHandler)
    server.serve_forever()
