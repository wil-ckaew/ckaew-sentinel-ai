import json
import random
from typing import List, Dict, Any
from datetime import datetime

class SecurityChatbot:
    """Chatbot de segurança para análise e recomendações"""
    
    def __init__(self):
        self.context = []
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self) -> Dict:
        return {
            "incidentes": {
                "tipos": ["Força Bruta", "Malware", "Phishing", "DDoS", "SQL Injection", "XSS", "Ransomware"],
                "recomendacoes": {
                    "Força Bruta": "Implementar 2FA, bloquear IPs suspeitos e usar senhas fortes",
                    "Malware": "Isolar o sistema, executar varredura antivírus e restaurar backups",
                    "Phishing": "Alertar usuários, bloquear domínio e educar sobre segurança",
                    "DDoS": "Ativar rate limiting, proteger com WAF e escalar infraestrutura",
                    "SQL Injection": "Implementar prepared statements e sanitizar inputs",
                    "XSS": "Validar e escapar outputs, usar CSP (Content Security Policy)",
                    "Ransomware": "Isolar imediatamente, não pagar resgate, restaurar backups"
                }
            },
            "vulnerabilidades": {
                "severidades": ["Crítico", "Alto", "Médio", "Baixo"],
                "prazos": {
                    "Crítico": "24 horas",
                    "Alto": "3 dias",
                    "Médio": "7 dias",
                    "Baixo": "30 dias"
                }
            },
            "boas_praticas": [
                "✅ Autenticação multifator (2FA) em todos os acessos",
                "✅ Backup regular e testado",
                "✅ Atualização constante de sistemas e patches",
                "✅ Monitoramento 24/7 de logs e eventos",
                "✅ Política de senhas fortes e renovação periódica",
                "✅ Segmentação de rede e controle de acesso",
                "✅ Treinamento contínuo de conscientização em segurança"
            ]
        }
    
    def analyze_incident(self, incident_data: Dict) -> Dict:
        tipo = incident_data.get('tipo', 'Desconhecido')
        severidade = incident_data.get('severidade', 'Médio')
        
        recomendacao = self.knowledge_base['incidentes']['recomendacoes'].get(
            tipo, "Analisar logs e investigar a origem do incidente"
        )
        
        return {
            "analise": f"🔍 Incidente do tipo '{tipo}' detectado com severidade {severidade}",
            "recomendacao": f"🛡️ {recomendacao}",
            "prazo": self.knowledge_base['vulnerabilidades']['prazos'].get(severidade, "7 dias"),
            "proximo_passo": self._get_next_step(tipo, severidade)
        }
    
    def _get_next_step(self, tipo: str, severidade: str) -> str:
        steps = {
            "Força Bruta": "Bloquear IP de origem e resetar credenciais comprometidas",
            "Malware": "Executar varredura completa e isolar arquivos infectados",
            "Phishing": "Bloquear domínio malicioso e educar usuários afetados",
            "DDoS": "Ativar proteção anti-DDoS e analisar padrões de tráfego",
            "SQL Injection": "Revisar queries SQL e aplicar patches imediatamente",
            "XSS": "Revisar código e implementar sanitização de inputs",
            "Ransomware": "Isolar sistema, não pagar resgate, restaurar de backup"
        }
        return steps.get(tipo, "Investigar e documentar o incidente detalhadamente")
    
    def chat(self, message: str) -> str:
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["ataque", "incidente", "alerta"]):
            return self._handle_incident_query(message)
        elif any(word in message_lower for word in ["vulnerabilidade", "cve", "patch"]):
            return self._handle_vulnerability_query(message)
        elif any(word in message_lower for word in ["ajuda", "como", "o que fazer", "dica"]):
            return self._handle_help_query(message)
        elif any(word in message_lower for word in ["pratica", "recomenda", "melhor"]):
            return self._handle_best_practices()
        else:
            return self._handle_general_query(message)
    
    def _handle_incident_query(self, message: str) -> str:
        return """🔍 **Análise de Incidentes - Guia Rápido**

📌 **Passos para lidar com incidentes:**

1️⃣ **Identifique o tipo** de ataque (Força Bruta, Malware, etc.)
2️⃣ **Avalie a severidade** (Crítico, Alto, Médio, Baixo)
3️⃣ **Isole o sistema** afetado imediatamente
4️⃣ **Documente todas as evidências** (logs, IPs, horários)
5️⃣ **Aplique a correção** adequada
6️⃣ **Monitore** para garantir que o problema foi resolvido

🛡️ **Recomendações gerais:**
- ✅ Use o módulo **Incidentes** para visualizar alertas em tempo real
- ✅ Configure alertas automáticos para detecção rápida
- ✅ Mantenha um plano de resposta a incidentes documentado

📊 **Acesse:** http://localhost:3000/incidentes
"""
    
    def _handle_vulnerability_query(self, message: str) -> str:
        return """🛡️ **Gestão de Vulnerabilidades - Guia Rápido**

📌 **Priorização de vulnerabilidades:**

| Severidade | Prazo | Ação |
|------------|-------|------|
| 🔴 **Crítico** | 24h | Corrigir imediatamente |
| 🟠 **Alto** | 3 dias | Corrigir com urgência |
| 🟡 **Médio** | 7 dias | Planejar correção |
| 🔵 **Baixo** | 30 dias | Correção agendada |

📌 **Boas práticas:**
1️⃣ **Priorize** vulnerabilidades com CVSS > 7.0
2️⃣ **Teste** correções em ambiente de homologação
3️⃣ **Documente** todas as correções aplicadas
4️⃣ **Reavalie** a segurança periodicamente

📊 **Acesse:** http://localhost:3000/vulnerabilidades
"""
    
    def _handle_help_query(self, message: str) -> str:
        return """🤖 **Como posso ajudar você?**

💡 **Posso auxiliar com:**

✅ **Analisar incidentes** - "Como lidar com ataque de força bruta?"
✅ **Recomendar correções** - "O que fazer com vulnerabilidade crítica?"
✅ **Explicar vulnerabilidades** - "O que é SQL Injection?"
✅ **Sugerir boas práticas** - "Quais são as melhores práticas?"
✅ **Guiar resposta a ataques** - "Como agir em um ataque DDoS?"

🔧 **Módulos disponíveis:**
- 📊 **Dashboard**: Visão geral da segurança
- 🚨 **Incidentes**: Gerenciamento de alertas
- 📦 **Ativos**: Inventário de dispositivos
- 🛡️ **Vulnerabilidades**: Gestão de riscos
- 📊 **Monitoramento**: Status em tempo real
- 📋 **Relatórios**: Documentação e análises
- 🧠 **IA Analyst**: Detecção de anomalias

💬 **Exemplos de perguntas:**
- "Como prevenir ataques de força bruta?"
- "Qual o prazo para corrigir vulnerabilidade alta?"
- "Como configurar alertas de segurança?"
- "O que fazer em caso de ransomware?"
"""
    
    def _handle_best_practices(self) -> str:
        boas = self.knowledge_base['boas_praticas']
        return f"""📋 **Melhores Práticas de Segurança**

🎯 **Recomendações essenciais:**

{chr(10).join(boas)}

📌 **Dicas adicionais:**
- 🔒 Realize auditorias de segurança regularmente
- 📊 Monitore logs e métricas diariamente
- 🧠 Treine equipes sobre conscientização em segurança
- 🚀 Mantenha-se atualizado sobre novas ameaças
- 🤝 Tenha um plano de resposta a incidentes

🛡️ **Lembre-se:** Segurança é um processo contínuo, não um destino!
"""
    
    def _handle_general_query(self, message: str) -> str:
        return f"""📊 **Análise da sua pergunta:**

> "{message}"

🤔 **Para melhor atendê-lo, por favor:**

1️⃣ Seja mais específico sobre o assunto
2️⃣ Mencione se é sobre incidentes, vulnerabilidades ou práticas
3️⃣ Informe se precisa de ajuda com alguma funcionalidade

🔐 **Sugestões de perguntas:**
- "Como lidar com um ataque de força bruta?"
- "Qual o prazo para corrigir vulnerabilidade crítica?"
- "Como prevenir ataques DDoS?"
- "Quais são as melhores práticas de segurança?"

💡 **Dica:** Use o módulo de **Incidentes** para ver alertas em tempo real!
"""
