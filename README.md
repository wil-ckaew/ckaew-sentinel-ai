# 🚀 CKAEW Sentinel AI - Sistema de Segurança Cibernética com IA

<div align="center">

![CKAEW Sentinel AI Logo](https://img.shields.io/badge/CKAEW-Sentinel%20AI-blue?style=for-the-badge&logo=rust)

**Sistema completo de Segurança Cibernética com Inteligência Artificial**

[![Rust](https://img.shields.io/badge/Rust-1.85-orange?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat&logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-darkblue?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-24.0-blue?style=flat&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Índice

- [Sobre o Sistema](#-sobre-o-sistema)
- [Finalidade](#-finalidade)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Como Executar](#-como-executar)
- [Telas do Sistema](#-telas-do-sistema)
- [Benefícios](#-benefícios)
- [Próximos Passos](#-próximos-passos)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🎯 Sobre o Sistema

O **CKAEW Sentinel AI** é uma plataforma avançada de segurança cibernética que combina **Inteligência Artificial**, **Monitoramento em Tempo Real** e **Gestão de Incidentes** para proteger organizações contra ameaças digitais.

### 🏆 Diferenciais

- ✅ **Detecção em Tempo Real** - Monitoramento contínuo 24/7
- ✅ **IA Avançada** - Análise comportamental e detecção de anomalias
- ✅ **Resposta Rápida** - Alertas automáticos e gestão de incidentes
- ✅ **Visibilidade Total** - Dashboard completo com métricas em tempo real
- ✅ **Escalável** - Arquitetura moderna pronta para crescer

---

## 🎯 Finalidade

O sistema foi projetado para:

### 🔒 **Proteger a Infraestrutura**
- Monitoramento de ativos e dispositivos
- Detecção de vulnerabilidades
- Prevenção de ataques

### 🧠 **Inteligência Artificial**
- Análise comportamental de usuários e entidades (UEBA)
- Detecção de anomalias em tempo real
- Classificação automática de incidentes

### 📊 **Gestão de Incidentes**
- Alertas automáticos para ameaças
- Workflow de resolução de incidentes
- Histórico e trilha de auditoria

### 📈 **Visibilidade e Relatórios**
- Dashboard com métricas em tempo real
- Relatórios automatizados
- Análise de tendências

---

## 🚀 Funcionalidades

### 1️⃣ **Dashboard em Tempo Real**
- Métricas de segurança atualizadas
- Gráficos de ameaças e incidentes
- Distribuição de riscos
- Timeline de eventos

![Dashboard](docs/images/dashboard.png)

### 2️⃣ **Gestão de Incidentes**
- Lista de todos os incidentes
- Filtros por severidade e status
- Ações rápidas (Visualizar, Resolver, Fechar)
- Priorização automática

![Incidentes](docs/images/incidentes.png)

### 3️⃣ **Inventário de Ativos**
- Lista completa de ativos
- Status e criticidade
- Localização e departamento
- Busca e filtros

![Ativos](docs/images/ativos.png)

### 4️⃣ **Monitoramento Contínuo**
- Status dos servidores em tempo real
- Métricas de CPU, Memória e Disco
- Uptime e disponibilidade
- Alertas automáticos

![Monitoramento](docs/images/monitoramento.png)

### 5️⃣ **IA Analyst**
- Detecção de anomalias com Machine Learning
- Classificação automática de incidentes
- Insights e recomendações
- Análise preditiva

![IA Analyst](docs/images/ia-analyst.png)

### 6️⃣ **Relatórios Automatizados**
- Geração automática de relatórios
- Exportação de dados
- Análise histórica
- Conformidade com LGPD e ISO

![Relatórios](docs/images/relatorios.png)

### 7️⃣ **Configurações**
- Preferências gerais
- Notificações
- Segurança e integrações
- Personalização

![Configurações](docs/images/configuracoes.png)

---

## 🏗️ Arquitetura

┌─────────────────────────────────────────────────────────────────────┐
│ CKAEW SENTINEL AI │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ FRONTEND │ │ BACKEND │ │ IA SERVICE │ │
│ │ Next.js │◄─┤ Rust/Actix │◄─┤ Python/ML │ │
│ │ React/TS │ │ Web API │ │ PyTorch │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ │ │ │ │
│ ▼ ▼ ▼ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ DATABASE │ │ AGENT │ │ REDIS │ │
│ │ PostgreSQL │ │ Coleta de │ │ Cache │ │
│ │ Dados Reais │ │ Dados │ │ Performance │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────┘
text


### Componentes Principais

| Componente | Tecnologia | Função |
|------------|------------|--------|
| **Frontend** | Next.js + React | Interface do usuário |
| **Backend** | Rust + Actix Web | API e lógica de negócio |
| **IA Service** | Python + PyTorch | Detecção de anomalias |
| **Database** | PostgreSQL | Armazenamento de dados |
| **Agent** | Rust | Coleta de dados |
| **Cache** | Redis | Performance |

---

## 💻 Tecnologias Utilizadas

### Backend
- **Linguagem**: Rust
- **Framework**: Actix Web
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Mensageria**: RabbitMQ

### Frontend
- **Framework**: Next.js 14
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **UI**: Heroicons, Headless UI
- **Gráficos**: Recharts

### IA/ML
- **Linguagem**: Python
- **Frameworks**: PyTorch, Scikit-learn
- **Análise**: Pandas, NumPy

### Infraestrutura
- **Containerização**: Docker
- **Orquestração**: Docker Compose / Kubernetes
- **Monitoramento**: Prometheus

---

## 📦 Instalação

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Rust 1.70+
- Node.js 18+
- Python 3.11+

### Passos para Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/ckaew-sentinel-ai.git
cd ckaew-sentinel-ai

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp web-dashboard/.env.local.example web-dashboard/.env.local

# 3. Iniciar o sistema
./start_dev.sh

# 4. Acessar o sistema
# Abra o navegador: http://localhost:3000
# Credenciais: admin / admin123

🚀 Como Executar
Modo Desenvolvimento
bash

# Iniciar todos os serviços
./start_dev.sh

# Parar todos os serviços
./stop_dev.sh

Modo Produção
bash

# Construir e iniciar
docker compose up -d --build

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f

Comandos Úteis
bash

# Auditoria do sistema
./audit_system.sh

# Teste rápido
./test_quick.sh

# Demonstração
./demo_system.sh

🖥️ Telas do Sistema
Página de Login

https://docs/images/login.png
Dashboard Principal

https://docs/images/dashboard.png
Gestão de Incidentes

https://docs/images/incidentes.png
Inventário de Ativos

https://docs/images/ativos.png
Monitoramento

https://docs/images/monitoramento.png
IA Analyst

https://docs/images/ia-analyst.png
Relatórios

https://docs/images/relatorios.png
Configurações

https://docs/images/configuracoes.png
🎯 Benefícios
Para Empresas
Benefício	Descrição
Proteção Proativa	Detecta ameaças antes que causem danos
Redução de Custos	Automatiza processos de segurança
Conformidade	Ajuda a atender LGPD, ISO 27001
Visibilidade	Visualização completa da infraestrutura
Resposta Rápida	Alertas e ação imediata
Escalabilidade	Cresce com a organização
Para Profissionais de Segurança

    ✅ Dashboard intuitivo

    ✅ Alertas em tempo real

    ✅ Gestão de incidentes eficiente

    ✅ Análise com IA

    ✅ Relatórios automatizados

    ✅ Redução de falso-positivos

🔮 Próximos Passos
Melhorias Planejadas

    □

    Integração com SIEMs (Splunk, ELK)
    □

    Aplicativo Mobile para notificações
    □

    Deep Learning para predição de ataques
    □

    SOAR (Resposta Automática a Incidentes)
    □

    Versão Cloud (SaaS)
    □

    API Pública para integrações
    □

    Dashboard Customizável
    □

    Suporte a Múltiplas Empresas (Multi-tenant)

Roadmap
Fase	Período	Objetivo
Fase 1	Concluído	MVP com funcionalidades básicas
Fase 2	Em Andamento	IA e detecção de anomalias
Fase 3	Futuro	Integrações e escalabilidade
🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

    Fork o projeto

    Crie sua branch (git checkout -b feature/AmazingFeature)

    Commit suas mudanças (git commit -m 'Add some AmazingFeature')

    Push para a branch (git push origin feature/AmazingFeature)

    Abra um Pull Request

Padrões de Código

    Rust: cargo fmt e cargo clippy

    Frontend: npm run lint e npm run format

    Python: black e flake8

📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.
👥 Equipe

    Desenvolvimento: [Seu Nome]

    IA/ML: [Seu Nome]

    Frontend: [Seu Nome]

📞 Contato

    Website: https://ckaew.com

    Email: contato@ckaew.com

    LinkedIn: CKAEW Security

🙏 Agradecimentos

    Comunidade Rust

    Next.js Team

    Python ML Community

    Todos os contribuidores

<div align="center">

Feito com ❤️ pela CKAEW Security

🌟 Sistema pronto para proteger sua organização! 🌟

⬆ Voltar ao topo
</div> EOF
echo "✅ README.md criado com sucesso!"
text


### 3. Criar um arquivo de exemplo para as imagens

```bash
cd ~/rust/ckaew-sentinel-ai/docs

cat > IMAGES_GUIDE.md << 'EOF'
# 📸 Guia para Capturar Imagens do Sistema

## Como Capturar Prints

### 1. Acesse o Sistema

http://localhost:3000
text


### 2. Faça Login

Usuário: admin
Senha: admin123
text


### 3. Capture as Telas

#### 📊 Dashboard
- Página inicial com todas as métricas
- Gráficos e estatísticas

#### 🚨 Incidentes
- Lista de incidentes
- Filtros e ações

#### 📦 Ativos
- Inventário de ativos
- Status e criticidade

#### 📊 Monitoramento
- Status dos servidores
- Gráficos de uso

#### 🧠 IA Analyst
- Detecção de anomalias
- Insights

#### 📋 Relatórios
- Lista de relatórios
- Opções de exportação

#### ⚙️ Configurações
- Configurações do sistema

### 4. Salve as Imagens

Coloque as imagens na pasta: `docs/images/`

Nomes sugeridos:
- `dashboard.png`
- `incidentes.png`
- `ativos.png`
- `monitoramento.png`
- `ia-analyst.png`
- `relatorios.png`
- `configuracoes.png`
- `login.png`

## Ferramentas para Captura

### Linux
```bash
# Usando gnome-screenshot
gnome-screenshot -a

# Usando shutter
shutter -s

Windows
text

Windows + Shift + S (Snipping Tool)

Mac
text

Cmd + Shift + 4

Dicas

    Use resolução 1920x1080

    Capture a tela inteira

    Mantenha o tema claro para melhor visibilidade

    Remova informações sensíveis

text


echo "✅ Guia de imagens criado!"

4. Criar um script para gerar o README com imagens
bash

cd ~/rust/ckaew-sentinel-ai

cat > generate_readme.sh << 'EOF'
#!/bin/bash

echo "📝 GERANDO README COMPLETO"
echo "=========================="
echo ""

# Verificar se a pasta de imagens existe
if [ ! -d "docs/images" ]; then
    echo "⚠️  Pasta docs/images não encontrada!"
    echo "📸 Por favor, tire prints do sistema e coloque em: docs/images/"
    echo ""
    echo "  1. Acesse: http://localhost:3000"
    echo "  2. Faça login: admin/admin123"
    echo "  3. Tire prints das páginas"
    echo "  4. Salve em: docs/images/"
    echo ""
    echo "📋 Páginas para capturar:"
    echo "  - Dashboard (dashboard.png)"
    echo "  - Incidentes (incidentes.png)"
    echo "  - Ativos (ativos.png)"
    echo "  - Monitoramento (monitoramento.png)"
    echo "  - IA Analyst (ia-analyst.png)"
    echo "  - Relatórios (relatorios.png)"
    echo "  - Configurações (configuracoes.png)"
    echo "  - Login (login.png)"
    echo ""
    
    read -p "Já capturou as imagens? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "📸 Por favor, capture as imagens primeiro!"
        exit 1
    fi
fi

# Verificar se o README existe
if [ -f "README.md" ]; then
    echo "✅ README.md já existe!"
else
    echo "❌ README.md não encontrado!"
    exit 1
fi

# Contar imagens
IMAGE_COUNT=$(ls -1 docs/images/*.png 2>/dev/null | wc -l)
echo ""
echo "📊 Imagens encontradas: $IMAGE_COUNT"

if [ "$IMAGE_COUNT" -gt "0" ]; then
    echo "✅ README com $IMAGE_COUNT imagens está pronto!"
else
    echo "⚠️  Nenhuma imagem encontrada!"
    echo "   Adicione imagens em: docs/images/"
fi

echo ""
echo "✅ README gerado com sucesso!"
echo "📖 Visualize: cat README.md | less"
echo "🌐 Acesse: http://localhost:3000 para capturar imagens"
