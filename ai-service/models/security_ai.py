"""
CKAEW Sentinel AI - Módulo de IA Avançada
Combina múltiplos modelos para análise completa de segurança
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List, Tuple, Any, Optional
import json
import logging
from datetime import datetime, timedelta
import joblib
import os

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedSecurityAI:
    """
    IA Avançada para Segurança Cibernética
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.models = {}
        self.scalers = {}
        self.model_path = model_path or "./models/saved"
        self.is_trained = False
        
        # Criar diretório para modelos
        os.makedirs(self.model_path, exist_ok=True)
        
        # Inicializar modelos
        self._init_models()
        logger.info("✅ Advanced Security AI inicializado")
    
    def _init_models(self):
        """Inicializa todos os modelos"""
        
        # 1. Detector de Anomalias
        self.models['anomaly'] = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=200
        )
        
        # 2. Classificador de Ameaças
        self.models['threat_classifier'] = RandomForestClassifier(
            n_estimators=300,
            max_depth=20,
            random_state=42
        )
        
        # 3. Rede Neural para Predição
        self.models['predictor'] = MLPClassifier(
            hidden_layer_sizes=(128, 64, 32),
            activation='relu',
            max_iter=500,
            random_state=42
        )
        
        # 4. Deep Learning (PyTorch)
        self.models['deep_learning'] = DeepLearningModel()
        
        # Scalers
        self.scalers['standard'] = StandardScaler()
        self.scalers['robust'] = StandardScaler()
        
        # Tentar carregar modelos salvos
        self._load_models()
    
    def analyze_behavior(self, user_data: Dict) -> Dict:
        """
        Análise de Comportamento do Usuário
        """
        try:
            # Extrair características
            features = self._extract_behavior_features(user_data)
            
            # Verificar se já foi treinado
            if not self.is_trained:
                return self._get_default_behavior_analysis(features)
            
            # Normalizar
            scaled = self.scalers['standard'].transform([features])
            
            # Detectar anomalia
            is_anomaly = self.models['anomaly'].predict(scaled)[0] == -1
            anomaly_score = float(self.models['anomaly'].score_samples(scaled)[0])
            
            # Classificar ameaça
            threat_level = self._classify_threat(features)
            
            # Gerar insights
            insights = self._generate_insights(user_data, is_anomaly)
            
            return {
                'is_anomaly': bool(is_anomaly),
                'anomaly_score': anomaly_score,
                'threat_level': threat_level,
                'insights': insights,
                'confidence': float(self._calculate_confidence(features))
            }
        except Exception as e:
            logger.error(f"Erro na análise de comportamento: {e}")
            return {
                'error': str(e),
                'is_anomaly': False,
                'threat_level': 'unknown'
            }
    
    def detect_malware(self, file_data: Dict) -> Dict:
        """
        Detecção de Malware
        """
        try:
            # Análise básica
            file_name = file_data.get('name', '')
            file_size = file_data.get('size', 0)
            file_type = file_data.get('type', '')
            
            # Heurística simples para demonstração
            is_suspicious = False
            severity = 'low'
            
            # Regras simples
            if '.exe' in file_name and file_size > 1000000:
                is_suspicious = True
                severity = 'high'
            elif 'setup' in file_name.lower():
                is_suspicious = True
                severity = 'medium'
            
            return {
                'is_malware': is_suspicious,
                'confidence': 0.85 if is_suspicious else 0.95,
                'type': 'Trojan' if is_suspicious else 'Clean',
                'severity': severity,
                'recommendations': [
                    'Isolar arquivo' if is_suspicious else 'Arquivo seguro',
                    'Executar scan completo' if is_suspicious else 'Monitorar'
                ]
            }
        except Exception as e:
            logger.error(f"Erro na detecção de malware: {e}")
            return {'error': str(e), 'is_malware': False}
    
    def predict_attack(self, network_data: Dict) -> Dict:
        """
        Predição de Ataques
        """
        try:
            # Análise de tráfego
            traffic = network_data.get('traffic', 0)
            connections = network_data.get('connections', 0)
            anomalies = network_data.get('anomalies', 0)
            
            # Calcular probabilidade
            probability = min(0.95, (traffic * 0.3 + connections * 0.3 + anomalies * 0.4) / 100)
            
            # Determinar risco
            if probability > 0.7:
                risk_level = 'critical'
                attack_type = 'DDoS'
            elif probability > 0.5:
                risk_level = 'high'
                attack_type = 'Brute Force'
            elif probability > 0.3:
                risk_level = 'medium'
                attack_type = 'Port Scan'
            else:
                risk_level = 'low'
                attack_type = 'Unknown'
            
            return {
                'attack_probability': probability,
                'predicted_attack_type': attack_type,
                'risk_level': risk_level,
                'estimated_time': datetime.now().isoformat(),
                'confidence': 0.88,
                'recommendations': [
                    'Bloquear IPs suspeitos' if probability > 0.5 else 'Monitorar',
                    'Aumentar logs' if probability > 0.7 else 'Manter vigilância',
                    'Escalar equipe' if probability > 0.8 else 'Documentar'
                ]
            }
        except Exception as e:
            logger.error(f"Erro na predição de ataque: {e}")
            return {'error': str(e)}
    
    def get_insights(self, data: Dict) -> List[Dict]:
        """Gera insights"""
        insights = []
        
        # Análise de Comportamento
        behavior = self.analyze_behavior(data)
        if behavior.get('is_anomaly'):
            insights.append({
                'type': 'Análise de Comportamento',
                'description': f"Padrão anômalo detectado: {behavior.get('threat_level', 'desconhecido')}",
                'severity': behavior.get('threat_level', 'medium'),
                'timestamp': datetime.now().isoformat()
            })
        
        # Detecção de Ameaças
        if data.get('file'):
            malware = self.detect_malware(data.get('file', {}))
            if malware.get('is_malware'):
                insights.append({
                    'type': 'Detecção de Malware',
                    'description': f"Arquivo suspeito identificado: {data.get('file', {}).get('name', 'desconhecido')}",
                    'severity': malware.get('severity', 'medium'),
                    'timestamp': datetime.now().isoformat()
                })
        
        # Predição de Ataques
        if data.get('network'):
            attack = self.predict_attack(data.get('network', {}))
            if attack.get('risk_level') in ['critical', 'high']:
                insights.append({
                    'type': 'Predição de Ataque',
                    'description': f"Alta probabilidade de ataque {attack.get('predicted_attack_type', 'desconhecido')}",
                    'severity': attack.get('risk_level', 'medium'),
                    'timestamp': datetime.now().isoformat()
                })
        
        return insights
    
    def train(self, data: pd.DataFrame, labels: pd.Series):
        """Treina os modelos com novos dados"""
        try:
            logger.info("🔄 Treinando modelos...")
            
            # Preparar dados
            X = data.values
            y = labels.values
            
            # Treinar cada modelo
            self.models['anomaly'].fit(X)
            self.models['threat_classifier'].fit(X, y)
            self.models['predictor'].fit(X, y)
            
            # Treinar deep learning
            self.models['deep_learning'].train(X, y)
            
            # Atualizar scalers
            self.scalers['standard'].fit(X)
            
            self.is_trained = True
            
            # Salvar modelos
            self._save_models()
            
            logger.info("✅ Modelos treinados com sucesso!")
            return {'status': 'success', 'message': 'Models trained successfully'}
        except Exception as e:
            logger.error(f"Erro no treinamento: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _save_models(self):
        """Salva os modelos treinados"""
        try:
            for name, model in self.models.items():
                if hasattr(model, 'save'):
                    model.save(f"{self.model_path}/{name}.pt")
                else:
                    joblib.dump(model, f"{self.model_path}/{name}.pkl")
            logger.info("✅ Modelos salvos com sucesso!")
        except Exception as e:
            logger.error(f"Erro ao salvar modelos: {e}")
    
    def _load_models(self):
        """Carrega modelos salvos"""
        try:
            for name in self.models.keys():
                model_file = f"{self.model_path}/{name}.pkl"
                if os.path.exists(model_file):
                    self.models[name] = joblib.load(model_file)
                    logger.info(f"✅ Modelo {name} carregado")
            self.is_trained = True
        except Exception as e:
            logger.info(f"ℹ️ Nenhum modelo salvo encontrado: {e}")
    
    def _extract_behavior_features(self, data: Dict) -> List:
        """Extrai características de comportamento"""
        return [
            float(data.get('login_attempts', 0)),
            float(data.get('failed_login', 0)),
            float(data.get('access_time', 0)),
            float(data.get('ip_changes', 0)),
            float(data.get('device_changes', 0)),
            float(data.get('geo_location_change', 0)),
            float(data.get('session_duration', 0)),
            float(data.get('page_views', 0)),
            float(data.get('downloads', 0)),
            float(data.get('errors', 0))
        ]
    
    def _classify_threat(self, features: List) -> str:
        """Classifica o nível da ameaça"""
        score = sum(features) / (len(features) * 10)
        if score > 0.8:
            return 'critical'
        elif score > 0.6:
            return 'high'
        elif score > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _generate_insights(self, data: Dict, is_anomaly: bool) -> List:
        """Gera insights"""
        insights = []
        
        if is_anomaly:
            insights.append("⚠️ Comportamento anômalo detectado")
            
            if data.get('login_attempts', 0) > 5:
                insights.append("🔑 Múltiplas tentativas de login")
            
            if data.get('ip_changes', 0) > 2:
                insights.append("🌍 Mudança suspeita de localização")
            
            if data.get('failed_login', 0) > 3:
                insights.append("❌ Alto número de falhas de autenticação")
        
        return insights
    
    def _calculate_confidence(self, features: List) -> float:
        """Calcula confiança"""
        return min(0.95, 0.5 + (len(features) / 40))
    
    def _get_default_behavior_analysis(self, features: List) -> Dict:
        """Retorna análise padrão quando não treinado"""
        return {
            'is_anomaly': False,
            'anomaly_score': 0.0,
            'threat_level': 'low',
            'insights': ['ℹ️ Modelo em treinamento - análise básica'],
            'confidence': 0.5
        }


class DeepLearningModel:
    """Modelo Deep Learning para detecção avançada"""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self._init_model()
    
    def _init_model(self):
        class SecurityNN(nn.Module):
            def __init__(self, input_size=10, hidden_size=64, output_size=2):
                super().__init__()
                self.fc1 = nn.Linear(input_size, hidden_size)
                self.fc2 = nn.Linear(hidden_size, hidden_size // 2)
                self.fc3 = nn.Linear(hidden_size // 2, output_size)
                self.dropout = nn.Dropout(0.3)
                self.relu = nn.ReLU()
            
            def forward(self, x):
                x = self.relu(self.fc1(x))
                x = self.dropout(x)
                x = self.relu(self.fc2(x))
                x = self.dropout(x)
                x = self.fc3(x)
                return x
        
        self.model = SecurityNN()
        self.model.to(self.device)
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.CrossEntropyLoss()
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            return np.array([0])
        
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X).to(self.device)
            output = self.model(X_tensor)
            return np.argmax(output.cpu().numpy(), axis=1)
    
    def train(self, X: np.ndarray, y: np.ndarray):
        if self.model is None:
            return
        
        self.model.train()
        X_tensor = torch.FloatTensor(X).to(self.device)
        y_tensor = torch.LongTensor(y).to(self.device)
        
        self.optimizer.zero_grad()
        output = self.model(X_tensor)
        loss = self.criterion(output, y_tensor)
        loss.backward()
        self.optimizer.step()
    
    def save(self, path: str):
        torch.save(self.model.state_dict(), path)
    
    def load(self, path: str):
        self.model.load_state_dict(torch.load(path))
        self.model.to(self.device)


# Singleton
_ai_instance = None

def get_ai():
    """Retorna a instância singleton da IA"""
    global _ai_instance
    if _ai_instance is None:
        _ai_instance = AdvancedSecurityAI()
    return _ai_instance
