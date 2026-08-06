from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.security_ai import get_ai

router = APIRouter()
ai = get_ai()

@router.get("/status")
async def get_status():
    """Status da IA"""
    return {
        "status": "online",
        "models": list(ai.models.keys()),
        "is_trained": ai.is_trained
    }

@router.post("/analyze/behavior")
async def analyze_behavior(data: Dict[str, Any]):
    """Analisa comportamento do usuário"""
    try:
        result = ai.analyze_behavior(data)
        return {
            'status': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/malware")
async def analyze_malware(data: Dict[str, Any]):
    """Analisa arquivo para malware"""
    try:
        result = ai.detect_malware(data)
        return {
            'status': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/attack")
async def predict_attack(data: Dict[str, Any]):
    """Prediz possíveis ataques"""
    try:
        result = ai.predict_attack(data)
        return {
            'status': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insights")
async def get_insights(data: Dict[str, Any]):
    """Gera insights"""
    try:
        result = ai.get_insights(data)
        return {
            'status': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train")
async def train_model(data: Dict[str, Any]):
    """Treina os modelos"""
    try:
        # TODO: Implementar treinamento com dados reais
        return {
            'status': 'success',
            'message': 'Model training started'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """Lista modelos disponíveis"""
    return {
        'models': list(ai.models.keys()),
        'trained': ai.is_trained
    }
