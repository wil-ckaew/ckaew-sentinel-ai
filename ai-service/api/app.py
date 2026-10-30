"""
CKAEW Sentinel AI - Serviço de Inteligência Artificial.

Expõe endpoints para:
- Detecção de anomalias em métricas.
- Análise explicável de logs.
- Classificação de incidentes.
- Treinamento, persistência e carregamento de modelos.

A aplicação diferencia modelos treinados de análises por regras.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Permite importar os modelos a partir do diretório ai-service.
SERVICE_DIR = Path(__file__).resolve().parent.parent
import sys
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

from models.security_ai import (
    AnomalyDetector,
    IncidentClassifier,
    LogAnomalyDetector,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ckaew-sentinel-ai")

MODEL_DIR = Path(
    os.getenv(
        "MODEL_PATH",
        str(SERVICE_DIR / "models" / "saved"),
    )
)

ANOMALY_MODEL_PATH = MODEL_DIR / "anomaly_model.joblib"
CLASSIFIER_MODEL_PATH = MODEL_DIR / "classifier_model.joblib"

app = FastAPI(
    title="CKAEW Sentinel AI - ML Service",
    description=(
        "Serviço de detecção de anomalias, análise de logs "
        "e classificação de incidentes de segurança."
    ),
    version="1.1.0",
)

# Por padrão, permite apenas origens locais comuns.
# Em produção, configure ALLOWED_ORIGINS com as origens autorizadas.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Instâncias compartilhadas durante a execução do serviço.
anomaly_detector = AnomalyDetector()
log_anomaly_detector = LogAnomalyDetector()
incident_classifier = IncidentClassifier()


# ---------------------------------------------------------------------
# Schemas da API
# ---------------------------------------------------------------------

class MetricsData(BaseModel):
    cpu_usage: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0, le=100)
    disk_usage: float = Field(ge=0, le=100)
    network_rx: float = Field(ge=0)
    network_tx: float = Field(ge=0)
    process_count: int = Field(ge=0)
    load_avg_1: float = Field(ge=0)
    load_avg_5: float = Field(ge=0)
    load_avg_15: float = Field(ge=0)


class LogData(BaseModel):
    event_type: str
    severity: str
    message: str
    source_ip: Optional[str] = None
    asset_id: Optional[str] = None
    timestamp: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class BatchMetrics(BaseModel):
    data: List[MetricsData] = Field(min_length=1)


class BatchLogs(BaseModel):
    data: List[LogData] = Field(min_length=1)


class TrainingData(BaseModel):
    metrics: Optional[List[MetricsData]] = None
    logs: Optional[List[LogData]] = None
    labels: Optional[List[str]] = None


def model_to_dict(model: BaseModel) -> Dict[str, Any]:
    """Compatibilidade com Pydantic 1 e Pydantic 2."""
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def load_saved_models() -> Dict[str, bool]:
    """Carrega modelos disponíveis sem impedir a inicialização da API."""
    result = {
        "anomaly_detector": False,
        "incident_classifier": False,
    }

    try:
        result["anomaly_detector"] = anomaly_detector.load_model(
            str(ANOMALY_MODEL_PATH)
        )
    except Exception:
        logger.exception("Não foi possível carregar o modelo de anomalias")

    try:
        result["incident_classifier"] = incident_classifier.load_model(
            str(CLASSIFIER_MODEL_PATH)
        )
    except Exception:
        logger.exception("Não foi possível carregar o classificador")

    return result


@app.on_event("startup")
async def startup_event():
    """Prepara o diretório e tenta carregar modelos persistidos."""
    try:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        logger.exception("Não foi possível preparar o diretório de modelos")

    loaded = load_saved_models()
    logger.info("Estado inicial dos modelos: %s", loaded)


# ---------------------------------------------------------------------
# Estado e saúde
# ---------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "service": "CKAEW Sentinel AI - ML Service",
        "status": "running",
        "version": "1.1.0",
        "models_loaded": {
            "anomaly_detector": anomaly_detector.is_trained,
            "log_anomaly_detector": True,
            "incident_classifier": incident_classifier.is_trained,
        },
        "model_directory": str(MODEL_DIR),
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "AI Service",
    }


# ---------------------------------------------------------------------
# Detecção de anomalias
# ---------------------------------------------------------------------

@app.post("/detect/anomalies/metrics")
async def detect_anomalies_metrics(data: BatchMetrics):
    try:
        metrics = [
            model_to_dict(item)
            for item in data.data
        ]

        results = anomaly_detector.detect(metrics)

        return {
            "status": "success",
            "results": results,
            "model_trained": anomaly_detector.is_trained,
            "detection_method": (
                "isolation_forest"
                if anomaly_detector.is_trained
                else "heuristic"
            ),
            "total_metrics": len(metrics),
        }

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    except Exception as exc:
        logger.exception("Erro na detecção de anomalias em métricas")
        raise HTTPException(
            status_code=500,
            detail="Falha interna na análise das métricas",
        ) from exc


@app.post("/detect/anomalies/logs")
async def detect_anomalies_logs(data: BatchLogs):
    try:
        logs = [
            model_to_dict(item)
            for item in data.data
        ]

        results = log_anomaly_detector.analyze_log_patterns(logs)

        return {
            "status": "success",
            "results": results,
            "total_logs": len(logs),
            "detection_method": "explainable_rules",
        }

    except Exception as exc:
        logger.exception("Erro na análise de logs")
        raise HTTPException(
            status_code=500,
            detail="Falha interna na análise dos logs",
        ) from exc


# ---------------------------------------------------------------------
# Classificação de incidentes
# ---------------------------------------------------------------------

@app.post("/classify/incident")
async def classify_incident(log: LogData):
    try:
        classification = incident_classifier.classify(
            model_to_dict(log)
        )

        return {
            "status": "success",
            "classification": classification,
            "model_trained": incident_classifier.is_trained,
        }

    except Exception as exc:
        logger.exception("Erro na classificação do incidente")
        raise HTTPException(
            status_code=500,
            detail="Falha interna na classificação do incidente",
        ) from exc


# ---------------------------------------------------------------------
# Treinamento de modelos
# ---------------------------------------------------------------------

@app.post("/train/anomaly")
async def train_anomaly_model(data: TrainingData):
    if not data.metrics:
        raise HTTPException(
            status_code=400,
            detail="Envie uma lista de métricas para treinamento",
        )

    try:
        metrics = [
            model_to_dict(item)
            for item in data.metrics
        ]

        result = anomaly_detector.train(metrics)

        # Persiste o modelo após o treinamento bem-sucedido.
        anomaly_detector.save_model(str(ANOMALY_MODEL_PATH))

        logger.info(
            "Modelo de anomalias treinado com %d amostras",
            len(metrics),
        )

        return {
            "status": "success",
            "result": result,
            "model_saved": True,
        }

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    except Exception as exc:
        logger.exception("Erro ao treinar o modelo de anomalias")
        raise HTTPException(
            status_code=500,
            detail="Falha no treinamento do modelo de anomalias",
        ) from exc


@app.post("/train/classifier")
async def train_classifier(data: TrainingData):
    if not data.logs or not data.labels:
        raise HTTPException(
            status_code=400,
            detail="Envie logs e seus respectivos rótulos",
        )

    if len(data.logs) != len(data.labels):
        raise HTTPException(
            status_code=400,
            detail="A quantidade de logs deve ser igual à de rótulos",
        )

    try:
        training_data = []

        for log, label in zip(data.logs, data.labels):
            log_dict = model_to_dict(log)
            log_dict["incident_type"] = label
            training_data.append(log_dict)

        result = incident_classifier.train(training_data)

        incident_classifier.save_model(str(CLASSIFIER_MODEL_PATH))

        logger.info(
            "Classificador treinado com %d amostras",
            len(training_data),
        )

        return {
            "status": "success",
            "result": result,
            "model_saved": True,
        }

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    except Exception as exc:
        logger.exception("Erro ao treinar o classificador")
        raise HTTPException(
            status_code=500,
            detail="Falha no treinamento do classificador",
        ) from exc


# ---------------------------------------------------------------------
# Estado e carregamento dos modelos
# ---------------------------------------------------------------------

@app.get("/models/status")
async def models_status():
    return {
        "anomaly_detector": {
            "trained": anomaly_detector.is_trained,
            "algorithm": (
                "IsolationForest"
                if anomaly_detector.is_trained
                else None
            ),
            "features": (
                anomaly_detector.feature_names
                if anomaly_detector.is_trained
                else []
            ),
        },
        "log_anomaly_detector": {
            "trained": False,
            "method": "explainable_rules",
            "threshold": log_anomaly_detector.threshold,
        },
        "incident_classifier": {
            "trained": incident_classifier.is_trained,
            "algorithm": (
                "TF-IDF + LogisticRegression"
                if incident_classifier.is_trained
                else None
            ),
            "classes": (
                incident_classifier.incident_types
                if incident_classifier.is_trained
                else []
            ),
        },
    }


@app.post("/models/load")
async def load_models():
    loaded = load_saved_models()

    return {
        "status": "success",
        "models_loaded": loaded,
    }
