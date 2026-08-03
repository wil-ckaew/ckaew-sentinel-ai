from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import logging
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.anomaly_detector import AnomalyDetector, LogAnomalyDetector
from models.classifier import IncidentClassifier

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Criar app FastAPI
app = FastAPI(
    title="CKAEW Sentinel AI - ML Service",
    description="Serviço de Inteligência Artificial para detecção de anomalias",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar modelos
anomaly_detector = AnomalyDetector()
log_anomaly_detector = LogAnomalyDetector()
incident_classifier = IncidentClassifier()

# Modelos Pydantic
class MetricsData(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_rx: float
    network_tx: float
    process_count: int
    load_avg_1: float
    load_avg_5: float
    load_avg_15: float

class LogData(BaseModel):
    event_type: str
    severity: str
    message: str
    source_ip: Optional[str] = None
    asset_id: Optional[str] = None
    timestamp: Optional[str] = None
    details: Optional[Dict] = None

class BatchMetrics(BaseModel):
    data: List[MetricsData]

class BatchLogs(BaseModel):
    data: List[LogData]

class TrainingData(BaseModel):
    metrics: Optional[List[MetricsData]] = None
    logs: Optional[List[LogData]] = None
    labels: Optional[List[str]] = None

# Rotas
@app.get("/")
async def root():
    return {
        "service": "CKAEW Sentinel AI - ML Service",
        "status": "running",
        "version": "1.0.0",
        "models_loaded": {
            "anomaly_detector": anomaly_detector.is_trained,
            "log_anomaly_detector": True,
            "incident_classifier": incident_classifier.is_trained
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/detect/anomalies/metrics")
async def detect_anomalies_metrics(data: BatchMetrics):
    """
    Detecta anomalias em métricas de sistema
    """
    try:
        metrics_list = [m.dict() for m in data.data]
        results = anomaly_detector.detect(metrics_list)
        
        return {
            "status": "success",
            "results": results,
            "model_trained": anomaly_detector.is_trained
        }
    except Exception as e:
        logger.error(f"Erro ao detectar anomalias: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/anomalies/logs")
async def detect_anomalies_logs(data: BatchLogs):
    """
    Detecta anomalias em logs
    """
    try:
        logs_list = [log.dict() for log in data.data]
        results = log_anomaly_detector.analyze_log_patterns(logs_list)
        
        return {
            "status": "success",
            "results": results,
            "total_logs": len(logs_list)
        }
    except Exception as e:
        logger.error(f"Erro ao detectar anomalias em logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify/incident")
async def classify_incident(log: LogData):
    """
    Classifica um incidente de segurança
    """
    try:
        log_dict = log.dict()
        classification = incident_classifier.classify(log_dict)
        
        return {
            "status": "success",
            "classification": classification,
            "model_trained": incident_classifier.is_trained
        }
    except Exception as e:
        logger.error(f"Erro ao classificar incidente: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/anomaly")
async def train_anomaly_model(data: TrainingData):
    """
    Treina o modelo de detecção de anomalias
    """
    try:
        if not data.metrics:
            raise HTTPException(status_code=400, detail="Dados de métricas necessários")
        
        metrics_list = [m.dict() for m in data.metrics]
        result = anomaly_detector.train(metrics_list)
        
        anomaly_detector.save_model("/app/models/anomaly_model.joblib")
        
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Erro ao treinar modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/classifier")
async def train_classifier(data: TrainingData):
    """
    Treina o classificador de incidentes
    """
    try:
        if not data.logs or not data.labels:
            raise HTTPException(status_code=400, detail="Dados de logs e labels necessários")
        
        training_data = []
        for log, label in zip(data.logs, data.labels):
            log_dict = log.dict()
            log_dict['incident_type'] = label
            training_data.append(log_dict)
        
        result = incident_classifier.train(training_data)
        
        incident_classifier.save_model("/app/models/classifier_model.joblib")
        
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Erro ao treinar classificador: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/status")
async def models_status():
    """
    Retorna status dos modelos
    """
    return {
        "anomaly_detector": {
            "trained": anomaly_detector.is_trained,
            "features": anomaly_detector.feature_names if anomaly_detector.is_trained else []
        },
        "log_anomaly_detector": {
            "trained": True,
            "threshold": log_anomaly_detector.threshold
        },
        "incident_classifier": {
            "trained": incident_classifier.is_trained,
            "classes": incident_classifier.incident_types if incident_classifier.is_trained else []
        }
    }

@app.post("/models/load")
async def load_models():
    """
    Carrega modelos salvos
    """
    try:
        anomaly_loaded = anomaly_detector.load_model("/app/models/anomaly_model.joblib")
        classifier_loaded = incident_classifier.load_model("/app/models/classifier_model.joblib")
        
        return {
            "status": "success",
            "anomaly_detector": anomaly_loaded,
            "incident_classifier": classifier_loaded
        }
    except Exception as e:
        logger.error(f"Erro ao carregar modelos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
