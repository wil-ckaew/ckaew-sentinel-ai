"""
Modelos de análise de segurança do CKAEW Sentinel AI.

Componentes:
- AnomalyDetector: Isolation Forest para métricas de infraestrutura.
- LogAnomalyDetector: análise explicável de padrões em logs.
- IncidentClassifier: classificação supervisionada de incidentes.

Importante:
A análise por regras não é apresentada como modelo de machine learning treinado.
"""

from collections import Counter
from pathlib import Path
from typing import Any, Dict, List
import logging
import math

import joblib
import numpy as np

from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detecta métricas anormais usando Isolation Forest."""

    MODEL_VERSION = 1

    def __init__(self):
        self.is_trained = False
        self.model = None

        self.feature_names = [
            "cpu_usage",
            "memory_usage",
            "disk_usage",
            "network_rx",
            "network_tx",
            "process_count",
            "load_avg_1",
            "load_avg_5",
            "load_avg_15",
        ]

    def _extract_features(self, item: Dict[str, Any]) -> List[float]:
        """Valida e converte uma amostra para o formato numérico do modelo."""
        values = []

        for feature in self.feature_names:
            if feature not in item:
                raise ValueError(
                    f"Métrica obrigatória ausente: {feature}"
                )

            value = float(item[feature])

            if not math.isfinite(value):
                raise ValueError(
                    f"Métrica contém valor inválido: {feature}"
                )

            values.append(value)

        # Percentuais não devem ultrapassar os limites esperados.
        for feature in ("cpu_usage", "memory_usage", "disk_usage"):
            value = float(item[feature])

            if not 0 <= value <= 100:
                raise ValueError(
                    f"{feature} deve estar entre 0 e 100"
                )

        if float(item["process_count"]) < 0:
            raise ValueError("process_count não pode ser negativo")

        return values

    def _heuristic_detection(
        self,
        item: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Análise preliminar por regras, sem alegar treinamento de ML."""
        reasons = []
        risk_scores = []

        checks = [
            ("cpu_usage", 90.0, "Utilização de CPU muito elevada"),
            ("memory_usage", 90.0, "Utilização de memória muito elevada"),
            ("disk_usage", 95.0, "Utilização de disco muito elevada"),
        ]

        for field, limit, description in checks:
            value = float(item[field])

            if value >= limit:
                reasons.append(description)

            risk_scores.append(min(value / 100.0, 1.0))

        process_count = int(item["process_count"])

        if process_count >= 2000:
            reasons.append("Quantidade de processos excepcionalmente elevada")

        process_score = min(process_count / 2000.0, 1.0)
        score = max(risk_scores + [process_score * 0.7])

        anomaly = bool(reasons)

        return {
            "anomaly": anomaly,
            "score": round(float(score), 4),
            "detection_method": "heuristic",
            "reasons": reasons or [
                "Nenhuma regra de anomalia foi acionada"
            ],
        }

    def detect(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analisa um lote de métricas."""
        if not data:
            return []

        if not self.is_trained or self.model is None:
            return [
                self._heuristic_detection(item)
                for item in data
            ]

        features = np.asarray(
            [self._extract_features(item) for item in data],
            dtype=float,
        )

        predictions = self.model.predict(features)
        decision_scores = self.model.decision_function(features)

        results = []

        for item, prediction, decision in zip(
            data,
            predictions,
            decision_scores,
        ):
            # Quanto menor a decisão do Isolation Forest,
            # maior a pontuação de anomalia.
            bounded_decision = float(np.clip(decision, -10.0, 10.0))
            score = 1.0 / (
                1.0 + math.exp(6.0 * bounded_decision)
            )

            reasons = []

            if prediction == -1:
                reasons.append(
                    "O padrão combinado das métricas foi identificado "
                    "como anômalo pelo modelo"
                )

            results.append({
                "anomaly": bool(prediction == -1),
                "score": round(float(score), 4),
                "detection_method": "isolation_forest",
                "reasons": reasons or [
                    "O modelo não classificou esta amostra como anômala"
                ],
            })

        return results

    def train(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Treina o Isolation Forest com métricas de referência."""
        if len(data) < 10:
            raise ValueError(
                "São necessárias pelo menos 10 amostras para treinamento"
            )

        features = np.asarray(
            [self._extract_features(item) for item in data],
            dtype=float,
        )

        model = IsolationForest(
            n_estimators=200,
            contamination="auto",
            random_state=42,
            n_jobs=-1,
        )

        model.fit(features)

        # Só atualiza o estado depois que o treinamento termina.
        self.model = model
        self.is_trained = True

        return {
            "status": "success",
            "algorithm": "IsolationForest",
            "samples": int(len(data)),
            "features": list(self.feature_names),
            "model_version": self.MODEL_VERSION,
        }

    def save_model(self, path: str) -> bool:
        """Persiste o modelo treinado em disco."""
        if not self.is_trained or self.model is None:
            raise ValueError("Não é possível salvar um modelo não treinado")

        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump({
            "version": self.MODEL_VERSION,
            "feature_names": self.feature_names,
            "model": self.model,
        }, destination)

        return True

    def load_model(self, path: str) -> bool:
        """Carrega um modelo persistido."""
        source = Path(path)

        if not source.is_file():
            logger.info("Modelo de anomalias ainda não existe: %s", source)
            return False

        saved = joblib.load(source)

        if not isinstance(saved, dict):
            raise ValueError("Formato de modelo inválido")

        if saved.get("version") != self.MODEL_VERSION:
            raise ValueError("Versão de modelo incompatível")

        if saved.get("feature_names") != self.feature_names:
            raise ValueError("As características do modelo são incompatíveis")

        model = saved.get("model")

        if not isinstance(model, IsolationForest):
            raise ValueError("O arquivo não contém um IsolationForest válido")

        self.model = model
        self.is_trained = True

        return True


class LogAnomalyDetector:
    """Identifica padrões suspeitos de logs com regras explicáveis."""

    def __init__(self):
        self.threshold = 3.0

        self.suspicious_terms = (
            "brute force",
            "brute-force",
            "credential stuffing",
            "privilege escalation",
            "privilege escalation attempt",
            "sql injection",
            "command injection",
            "malware",
            "ransomware",
            "unauthorized access",
            "multiple failed login",
            "tentativa de força bruta",
            "força bruta",
            "escalada de privilégio",
            "injeção sql",
            "acesso não autorizado",
            "acesso nao autorizado",
            "tentativas de login",
            "malware",
            "ransomware",
        )

    def analyze_log_patterns(
        self,
        logs: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Analisa logs e explica quais regras foram acionadas."""
        if not logs:
            return []

        source_counts = Counter(
            str(log.get("source_ip") or "")
            for log in logs
            if log.get("source_ip")
        )

        results = []

        for log in logs:
            message = str(log.get("message") or "").lower()
            event_type = str(log.get("event_type") or "").lower()
            severity = str(log.get("severity") or "").lower()
            source_ip = str(log.get("source_ip") or "")

            reasons = []
            score = 0.0

            if severity in ("critical", "crit", "fatal", "crítico", "critico"):
                score += 0.65
                reasons.append("Evento registrado com severidade crítica")

            elif severity in ("high", "error", "alto", "alta"):
                score += 0.35
                reasons.append("Evento registrado com severidade elevada")

            combined_text = f"{event_type} {message}"

            matched_terms = [
                term for term in self.suspicious_terms
                if term in combined_text
            ]

            if matched_terms:
                score += min(0.20 * len(matched_terms), 0.40)
                reasons.append(
                    "Termos suspeitos identificados: "
                    + ", ".join(matched_terms)
                )

            if source_ip and source_counts[source_ip] >= int(self.threshold):
                score += 0.25
                reasons.append(
                    f"Origem presente em {source_counts[source_ip]} "
                    "eventos deste lote"
                )

            score = min(score, 1.0)

            results.append({
                "anomaly": bool(score >= 0.50),
                "score": round(score, 4),
                "detection_method": "explainable_rules",
                "reasons": reasons or [
                    "Nenhuma regra de suspeita foi acionada"
                ],
            })

        return results


class IncidentClassifier:
    """Classifica incidentes com ML supervisionado e fallback por regras."""

    MODEL_VERSION = 1

    def __init__(self):
        self.is_trained = False
        self.model = None
        self.incident_types = [
            "suspicious_activity",
            "brute_force",
            "malware",
            "unauthorized_access",
            "privilege_escalation",
            "injection_attack",
            "other",
        ]

    @staticmethod
    def _to_text(log: Dict[str, Any]) -> str:
        """Converte campos relevantes em texto para classificação."""
        fields = [
            log.get("event_type", ""),
            log.get("severity", ""),
            log.get("message", ""),
        ]

        details = log.get("details")

        if isinstance(details, dict):
            fields.extend(
                f"{key}: {value}"
                for key, value in details.items()
            )

        return " ".join(str(value) for value in fields if value is not None)

    def _rule_based_classification(
        self,
        log: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Fallback transparente, não apresentado como ML treinado."""
        text = self._to_text(log).lower()

        rules = [
            (
                "brute_force",
                ("brute force", "brute-force", "força bruta",
                 "forca bruta", "multiple failed login"),
            ),
            (
                "malware",
                ("malware", "ransomware", "trojan", "vírus", "virus"),
            ),
            (
                "privilege_escalation",
                ("privilege escalation", "escalada de privilégio",
                 "escalada de privilegio"),
            ),
            (
                "injection_attack",
                ("sql injection", "command injection", "injeção sql",
                 "injecao sql"),
            ),
            (
                "unauthorized_access",
                ("unauthorized access", "acesso não autorizado",
                 "acesso nao autorizado"),
            ),
        ]

        for incident_type, terms in rules:
            if any(term in text for term in terms):
                return {
                    "incident_type": incident_type,
                    "confidence": 0.60,
                    "classification_method": "heuristic",
                    "explanation": (
                        "Classificação preliminar baseada em termos "
                        "encontrados no evento; requer validação"
                    ),
                }

        return {
            "incident_type": "suspicious_activity",
            "confidence": 0.30,
            "classification_method": "heuristic",
            "explanation": (
                "Não há evidências suficientes para uma categoria "
                "mais específica"
            ),
        }

    def classify(self, log: Dict[str, Any]) -> Dict[str, Any]:
        """Classifica um evento."""
        if not self.is_trained or self.model is None:
            return self._rule_based_classification(log)

        text = self._to_text(log)

        prediction = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]
        confidence = float(np.max(probabilities))

        return {
            "incident_type": str(prediction),
            "confidence": round(confidence, 4),
            "classification_method": "supervised_ml",
            "explanation": (
                "Categoria estimada por classificador supervisionado. "
                "A confiança não equivale à probabilidade de um ataque real."
            ),
        }

    def train(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Treina o classificador a partir de logs rotulados."""
        if len(data) < 4:
            raise ValueError(
                "São necessários pelo menos 4 exemplos rotulados"
            )

        texts = [self._to_text(item) for item in data]
        labels = [
            str(item.get("incident_type", "")).strip()
            for item in data
        ]

        if any(not label for label in labels):
            raise ValueError("Todos os exemplos precisam de um rótulo")

        classes = sorted(set(labels))

        if len(classes) < 2:
            raise ValueError(
                "O treinamento exige pelo menos duas categorias diferentes"
            )

        model = Pipeline([
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    max_features=5000,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ])

        model.fit(texts, labels)

        self.model = model
        self.is_trained = True
        self.incident_types = classes

        return {
            "status": "success",
            "algorithm": "TF-IDF + LogisticRegression",
            "samples": len(data),
            "classes": classes,
            "model_version": self.MODEL_VERSION,
        }

    def save_model(self, path: str) -> bool:
        """Persiste o classificador treinado."""
        if not self.is_trained or self.model is None:
            raise ValueError("Não é possível salvar um classificador não treinado")

        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump({
            "version": self.MODEL_VERSION,
            "model": self.model,
            "incident_types": self.incident_types,
        }, destination)

        return True

    def load_model(self, path: str) -> bool:
        """Carrega o classificador persistido."""
        source = Path(path)

        if not source.is_file():
            logger.info("Classificador ainda não existe: %s", source)
            return False

        saved = joblib.load(source)

        if not isinstance(saved, dict):
            raise ValueError("Formato de classificador inválido")

        if saved.get("version") != self.MODEL_VERSION:
            raise ValueError("Versão de classificador incompatível")

        model = saved.get("model")

        if not isinstance(model, Pipeline):
            raise ValueError("O arquivo não contém um Pipeline válido")

        self.model = model
        self.incident_types = list(saved.get("incident_types", []))
        self.is_trained = True

        return True
