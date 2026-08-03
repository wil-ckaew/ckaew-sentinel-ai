import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class IncidentClassifier:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.incident_types = [
            'unauthorized_access',
            'malware_detection',
            'data_breach',
            'dos_attack',
            'privilege_escalation',
            'suspicious_activity',
            'policy_violation',
            'system_failure'
        ]
    
    def extract_features(self, logs: List[Dict]) -> np.ndarray:
        features = []
        
        for log in logs:
            severity_map = {'info': 0.1, 'warning': 0.3, 'error': 0.6, 'critical': 1.0}
            severity_score = severity_map.get(log.get('severity', 'info'), 0.1)
            frequency = log.get('frequency', 1) / 100
            source_ip_count = min(log.get('source_ip_count', 0) / 10, 1.0)
            asset_count = min(log.get('asset_count', 0) / 20, 1.0)
            
            keywords_score = self._extract_keywords_score(log.get('message', ''))
            
            features.append([
                severity_score, frequency, source_ip_count,
                asset_count, 0.5, keywords_score
            ])
        
        return np.array(features)
    
    def _extract_keywords_score(self, message: str) -> float:
        keywords = {
            'attack': 1.0, 'exploit': 1.0, 'breach': 0.9,
            'malware': 0.9, 'virus': 0.9, 'trojan': 0.9,
            'unauthorized': 0.8, 'access': 0.7, 'failed': 0.6,
            'error': 0.5, 'warning': 0.4, 'suspicious': 0.8
        }
        
        score = 0.0
        message_lower = message.lower()
        
        for word, weight in keywords.items():
            if word in message_lower:
                score = max(score, weight)
        
        return score
    
    def train(self, data: List[Dict]) -> Dict[str, Any]:
        if len(data) < 10:
            return {
                'status': 'error',
                'message': 'Dados insuficientes para treinamento'
            }
        
        X = self.extract_features(data)
        y = [item.get('incident_type', 'suspicious_activity') for item in data]
        
        y_encoded = self.label_encoder.fit_transform(y)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X, y_encoded)
        self.is_trained = True
        
        return {
            'status': 'success',
            'samples': len(data),
            'classes': len(self.label_encoder.classes_)
        }
    
    def classify(self, log: Dict) -> Dict[str, Any]:
        if not self.is_trained or self.model is None:
            return {
                'incident_type': 'suspicious_activity',
                'confidence': 0.5,
                'probabilities': {t: 0.1 for t in self.incident_types}
            }
        
        X = self.extract_features([log])
        pred_encoded = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        incident_type = self.label_encoder.inverse_transform([pred_encoded])[0]
        confidence = float(max(probabilities))
        
        prob_dict = {}
        for i, cls in enumerate(self.label_encoder.classes_):
            prob_dict[cls] = float(probabilities[i])
        
        return {
            'incident_type': incident_type,
            'confidence': confidence,
            'probabilities': prob_dict
        }
    
    def save_model(self, path: str):
        if self.model is not None:
            joblib.dump({
                'model': self.model,
                'label_encoder': self.label_encoder
            }, path)
    
    def load_model(self, path: str):
        try:
            data = joblib.load(path)
            self.model = data['model']
            self.label_encoder = data['label_encoder']
            self.is_trained = True
            return True
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {e}")
            return False
