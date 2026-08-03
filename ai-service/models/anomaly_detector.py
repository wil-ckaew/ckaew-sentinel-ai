import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import joblib
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Detector de anomalias usando Isolation Forest
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)
        self.feature_names = [
            'cpu_usage', 'memory_usage', 'disk_usage',
            'network_rx', 'network_tx', 'process_count',
            'load_avg_1', 'load_avg_5', 'load_avg_15'
        ]
        self.threshold = 0.1
        self.is_trained = False
        
    def preprocess_data(self, data: List[Dict]) -> np.ndarray:
        features = []
        
        for entry in data:
            feature_vector = [
                entry.get('cpu_usage', 0),
                entry.get('memory_usage', 0),
                entry.get('disk_usage', 0),
                entry.get('network_rx', 0) / 1e6,
                entry.get('network_tx', 0) / 1e6,
                entry.get('process_count', 0),
                entry.get('load_avg_1', 0),
                entry.get('load_avg_5', 0),
                entry.get('load_avg_15', 0)
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def train(self, historical_data: List[Dict]) -> Dict[str, Any]:
        logger.info(f"Treinando modelo com {len(historical_data)} amostras")
        
        X = self.preprocess_data(historical_data)
        X_scaled = self.scaler.fit_transform(X)
        X_reduced = self.pca.fit_transform(X_scaled)
        
        self.model = IsolationForest(
            contamination=self.threshold,
            random_state=42,
            n_estimators=100
        )
        self.model.fit(X_reduced)
        
        self.is_trained = True
        
        predictions = self.model.predict(X_reduced)
        anomalies = sum(1 for p in predictions if p == -1)
        
        return {
            'status': 'success',
            'samples': len(historical_data),
            'anomalies_detected': anomalies,
            'anomaly_rate': anomalies / len(historical_data)
        }
    
    def detect(self, current_data: List[Dict]) -> List[Dict]:
        if not self.is_trained or self.model is None:
            return [{'anomaly': False, 'score': 0} for _ in current_data]
        
        X = self.preprocess_data(current_data)
        X_scaled = self.scaler.transform(X)
        X_reduced = self.pca.transform(X_scaled)
        
        predictions = self.model.predict(X_reduced)
        scores = self.model.score_samples(X_reduced)
        
        results = []
        for pred, score in zip(predictions, scores):
            is_anomaly = pred == -1
            normalized_score = float(1 / (1 + np.exp(-score)))
            results.append({
                'anomaly': bool(is_anomaly),
                'score': normalized_score,
                'confidence': float(abs(score) / 10) if score != 0 else 0
            })
        
        return results
    
    def save_model(self, path: str):
        if self.model is not None:
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'pca': self.pca,
                'feature_names': self.feature_names,
                'threshold': self.threshold
            }, path)
    
    def load_model(self, path: str):
        try:
            data = joblib.load(path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.pca = data['pca']
            self.feature_names = data['feature_names']
            self.threshold = data['threshold']
            self.is_trained = True
            return True
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {e}")
            return False


class LogAnomalyDetector:
    def __init__(self):
        self.patterns = {}
        self.threshold = 3.0
        
    def analyze_log_patterns(self, logs: List[Dict]) -> List[Dict]:
        results = []
        
        event_counts = {}
        for log in logs:
            event_type = log.get('event_type', 'unknown')
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        mean = np.mean(list(event_counts.values())) if event_counts else 0
        std = np.std(list(event_counts.values())) if event_counts else 1
        
        for log in logs:
            event_type = log.get('event_type', 'unknown')
            count = event_counts.get(event_type, 0)
            
            z_score = (count - mean) / std if std > 0 else 0
            is_anomaly = abs(z_score) > self.threshold
            
            severity_score = {
                'info': 0.1,
                'warning': 0.3,
                'error': 0.6,
                'critical': 1.0
            }.get(log.get('severity', 'info'), 0.1)
            
            anomaly_score = min(1.0, (abs(z_score) / 10) + severity_score)
            
            results.append({
                'anomaly': is_anomaly or severity_score > 0.8,
                'score': float(anomaly_score),
                'z_score': float(z_score),
                'event_frequency': count
            })
        
        return results
