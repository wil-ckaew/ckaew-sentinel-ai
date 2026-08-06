from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import uvicorn
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CKAEW Sentinel AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": "CKAEW Sentinel AI",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
