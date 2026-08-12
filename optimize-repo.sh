#!/bin/bash

echo "🚀 OTIMIZANDO REPOSITÓRIO"
echo "=========================="

# 1. Entrar no web-dashboard e commit
echo "📂 Commitando web-dashboard..."
cd web-dashboard
git add .
git commit -m "feat: Atualizar CKAEW Copilot" || echo "Nada para commit"
cd ..

# 2. Subir submódulo
git add web-dashboard

# 3. Configurar Git LFS
echo "🔧 Configurando Git LFS..."
git lfs install
git lfs track "*.a" "*.dll" "*.pack" "*.xcframework"
git add .gitattributes

# 4. Commit principal
echo "📝 Commit principal..."
git add .
git commit -m "chore: Otimizar repositório e atualizar submódulo"

# 5. Push
echo "🚀 Enviando para GitHub..."
git push origin main

echo "✅ Repositório otimizado!"
