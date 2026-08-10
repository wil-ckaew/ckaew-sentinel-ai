import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random

class AttackPredictor:
    """Predição de ataques baseado em padrões históricos"""
    
    def __init__(self):
        self.history = []
        self.patterns = {
            'brute_force': {'weight': 0.3, 'trend': 0.1},
            'malware': {'weight': 0.25, 'trend': 0.05},
            'ddos': {'weight': 0.2, 'trend': 0.15},
            'phishing': {'weight': 0.15, 'trend': 0.02},
            'other': {'weight': 0.1, 'trend': 0.01}
        }
    
    def predict_next_hour(self, recent_data: List[Dict]) -> Dict:
        """Previsão de ataques para a próxima hora"""
        if not recent_data:
            return self._get_default_prediction()
        
        # Analisar padrões
        predictions = {}
        total_score = 0
        
        for attack_type, data in self.patterns.items():
            # Calcular probabilidade baseada em histórico
            base_prob = data['weight']
            trend = data['trend']
            
            # Ajustar com dados recentes
            recent_count = sum(1 for d in recent_data if d.get('type') == attack_type)
            if recent_count > 0:
                base_prob = min(1.0, base_prob + (recent_count / 10))
            
            # Adicionar fator aleatório para realismo
            random_factor = random.uniform(-0.05, 0.05)
            probability = min(1.0, max(0.0, base_prob + trend + random_factor))
            
            predictions[attack_type] = {
                'probability': round(probability, 3),
                'risk_level': self._get_risk_level(probability),
                'expected_impact': self._get_impact(probability, attack_type)
            }
            total_score += probability
        
        # Calcular risco geral
        overall_risk = min(1.0, total_score / len(predictions))
        
        return {
            'timestamp': datetime.now().isoformat(),
            'predictions': predictions,
            'overall_risk': round(overall_risk, 3),
            'risk_level': self._get_risk_level(overall_risk),
            'recommendations': self._get_recommendations(predictions)
        }
    
    def _get_risk_level(self, probability: float) -> str:
        if probability > 0.7:
            return 'critical'
        elif probability > 0.5:
            return 'high'
        elif probability > 0.3:
            return 'medium'
        else:
            return 'low'
    
    def _get_impact(self, probability: float, attack_type: str) -> str:
        impacts = {
            'brute_force': 'Alto - Pode comprometer credenciais',
            'malware': 'Crítico - Pode infectar sistemas',
            'ddos': 'Alto - Pode derrubar serviços',
            'phishing': 'Médio - Pode comprometer dados',
            'other': 'Baixo - Impacto variável'
        }
        return impacts.get(attack_type, 'Impacto desconhecido')
    
    def _get_recommendations(self, predictions: Dict) -> List[str]:
        recommendations = []
        
        for attack_type, data in predictions.items():
            if data['probability'] > 0.5:
                if attack_type == 'brute_force':
                    recommendations.append("🔒 Reforçar autenticação e bloquear IPs suspeitos")
                elif attack_type == 'malware':
                    recommendations.append("🦠 Atualizar antivírus e isolar sistemas críticos")
                elif attack_type == 'ddos':
                    recommendations.append("🌊 Ativar proteção anti-DDoS e rate limiting")
                elif attack_type == 'phishing':
                    recommendations.append("🎣 Alertar usuários e bloquear domínios suspeitos")
                else:
                    recommendations.append("🔍 Monitorar logs e investigar atividades anômalas")
        
        if not recommendations:
            recommendations.append("✅ Sistema aparentemente seguro. Continue monitorando.")
        
        return recommendations
    
    def _get_default_prediction(self) -> Dict:
        return {
            'timestamp': datetime.now().isoformat(),
            'predictions': {
                'brute_force': {'probability': 0.2, 'risk_level': 'low', 'expected_impact': 'Baixo impacto'},
                'malware': {'probability': 0.15, 'risk_level': 'low', 'expected_impact': 'Baixo impacto'},
                'ddos': {'probability': 0.1, 'risk_level': 'low', 'expected_impact': 'Baixo impacto'},
                'phishing': {'probability': 0.1, 'risk_level': 'low', 'expected_impact': 'Baixo impacto'},
                'other': {'probability': 0.05, 'risk_level': 'low', 'expected_impact': 'Baixo impacto'}
            },
            'overall_risk': 0.12,
            'risk_level': 'low',
            'recommendations': ['✅ Sistema aparentemente seguro. Continue monitorando.']
        }
