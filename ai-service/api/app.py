from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

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

# Rotas
@app.get("/")
async def root():
    return {
        "service": "CKAEW Sentinel AI - ML Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "AI Service"}

@app.post("/detect/anomalies/metrics")
async def detect_anomalies_metrics(data: BatchMetrics):
    return {
        "status": "success",
        "results": [{"anomaly": False, "score": 0.5} for _ in data.data],
        "model_trained": False
    }

@app.post("/detect/anomalies/logs")
async def detect_anomalies_logs(data: BatchLogs):
    return {
        "status": "success",
        "results": [{"anomaly": False, "score": 0.5} for _ in data.data],
        "total_logs": len(data.data)
    }

@app.post("/classify/incident")
async def classify_incident(log: LogData):
    return {
        "status": "success",
        "classification": {
            "incident_type": "suspicious_activity",
            "confidence": 0.5
        },
        "model_trained": False
    }

@app.get("/models/status")
async def models_status():
    return {
        "anomaly_detector": {"trained": False, "features": []},
        "log_anomaly_detector": {"trained": True, "threshold": 3.0},
        "incident_classifier": {"trained": False, "classes": []}
    }
