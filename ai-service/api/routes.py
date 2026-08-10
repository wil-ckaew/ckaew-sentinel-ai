from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.security_ai import AnomalyDetector, LogAnomalyDetector, IncidentClassifier

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
    return {"status": "healthy", "service": "AI Service"}

@app.post("/detect/anomalies/metrics")
async def detect_anomalies_metrics(data: BatchMetrics):
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
    try:
        if not data.metrics:
            raise HTTPException(status_code=400, detail="Dados de métricas necessários")
        
        metrics_list = [m.dict() for m in data.metrics]
        result = anomaly_detector.train(metrics_list)
        
        anomaly_detector.save_model("/app/models/saved/anomaly_model.joblib")
        
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Erro ao treinar modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/classifier")
async def train_classifier(data: TrainingData):
    try:
        if not data.logs or not data.labels:
            raise HTTPException(status_code=400, detail="Dados de logs e labels necessários")
        
        training_data = []
        for log, label in zip(data.logs, data.labels):
            log_dict = log.dict()
            log_dict['incident_type'] = label
            training_data.append(log_dict)
        
        result = incident_classifier.train(training_data)
        
        incident_classifier.save_model("/app/models/saved/classifier_model.joblib")
        
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Erro ao treinar classificador: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/status")
async def models_status():
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
    try:
        anomaly_loaded = anomaly_detector.load_model("/app/models/saved/anomaly_model.joblib")
        classifier_loaded = incident_classifier.load_model("/app/models/saved/classifier_model.joblib")
        
        return {
            "status": "success",
            "anomaly_detector": anomaly_loaded,
            "incident_classifier": classifier_loaded
        }
    except Exception as e:
        logger.error(f"Erro ao carregar modelos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from models.security_chat import SecurityChatbot

# Inicializar chatbot
chatbot = SecurityChatbot()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    """Endpoint do chatbot de segurança"""
    try:
        response = chatbot.chat(request.message)
        return {
            "status": "success",
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro no chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/health")
async def chat_health():
    return {"status": "healthy", "service": "CKAEW Copilot"}

# Análise de incidentes com IA
@app.post("/analyze/incident")
async def analyze_incident(data: Dict):
    try:
        analysis = chatbot.analyze_incident(data)
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        logger.error(f"Erro na análise: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from models.attack_prediction import AttackPredictor

# Inicializar preditor
attack_predictor = AttackPredictor()

@app.get("/predict/attacks")
async def predict_attacks():
    """Previsão de ataques para a próxima hora"""
    try:
        # Buscar dados recentes do backend
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("http://backend:8080/api/alerts?limit=100")
            alerts = response.json().get('alerts', [])
        
        # Preparar dados para predição
        recent_data = []
        for alert in alerts[:50]:
            recent_data.append({
                'type': alert.get('priority', 'other'),
                'timestamp': alert.get('created_at', ''),
                'source': alert.get('source_ip', '')
            })
        
        # Fazer predição
        prediction = attack_predictor.predict_next_hour(recent_data)
        
        return {
            "status": "success",
            "data": prediction
        }
    except Exception as e:
        logger.error(f"Erro na previsão: {e}")
        # Retornar previsão padrão
        return {
            "status": "success",
            "data": attack_predictor._get_default_prediction()
        }

@app.get("/predict/history")
async def get_prediction_history():
    """Histórico de previsões"""
    # Simular histórico
    history = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        history.append({
            'date': date.strftime('%Y-%m-%d'),
            'risk_level': random.choice(['low', 'medium', 'high', 'critical']),
            'score': round(random.uniform(0.1, 0.9), 2)
        })
    return {"status": "success", "history": history}
