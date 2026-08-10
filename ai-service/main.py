import uvicorn
import sys
import os
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

# Verificar se o arquivo api/app.py existe
if not os.path.exists("api/app.py"):
    print("❌ Erro: api/app.py não encontrado!")
    sys.exit(1)

print("🚀 CKAEW Sentinel AI - AI Service")
print("📡 Servidor rodando em http://0.0.0.0:8000")
print("📂 Diretório:", os.getcwd())
print("📂 Conteúdo:", os.listdir("."))

try:
    from api.app import app
    print("✅ App importado com sucesso!")
except Exception as e:
    print(f"❌ Erro ao importar app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    uvicorn.run(
        "api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        log_level="info"
    )
