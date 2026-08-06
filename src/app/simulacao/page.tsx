'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import MatrixPanelEffect from '@/components/effects/MatrixPanelEffect';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  BoltIcon,
  ComputerDesktopIcon,
  ServerIcon,
  GlobeAltIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

// Tipos de ataque
const ATTACK_TYPES = [
  { id: 'brute_force', name: 'Força Bruta', icon: '🔓', severity: 'critical', color: '#EF4444' },
  { id: 'malware', name: 'Malware', icon: '🦠', severity: 'critical', color: '#DC2626' },
  { id: 'ddos', name: 'DDoS', icon: '🌊', severity: 'critical', color: '#F59E0B' },
  { id: 'phishing', name: 'Phishing', icon: '🎣', severity: 'high', color: '#F97316' },
  { id: 'ransomware', name: 'Ransomware', icon: '💰', severity: 'critical', color: '#EF4444' },
  { id: 'sql_injection', name: 'SQL Injection', icon: '💉', severity: 'high', color: '#8B5CF6' },
  { id: 'xss', name: 'XSS Attack', icon: '🌐', severity: 'medium', color: '#F59E0B' },
  { id: 'zero_day', name: 'Zero Day', icon: '💥', severity: 'critical', color: '#DC2626' },
];

const TARGETS = [
  '10.0.1.10 - Web Server',
  '10.0.1.20 - Database',
  '10.0.0.1 - Firewall',
  '10.0.2.10 - Workstation-01',
  '10.0.3.20 - Cloud Instance',
  '192.168.1.1 - Gateway',
  '10.0.4.10 - Mail Server',
  '10.0.5.20 - DNS Server',
];

export default function SimulacaoPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{time: string, message: string, type: string}>>([]);
  const [attackCount, setAttackCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [currentAttack, setCurrentAttack] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [virusAnimation, setVirusAnimation] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const attackIndex = useRef(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const addLog = (message: string, type: string = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const simulateSingleAttack = async (attackType: any) => {
    const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const ip = target.split(' ')[0];
    
    setCurrentAttack(attackType);
    setAttackCount(prev => prev + 1);
    setShowMatrix(false);
    
    addLog(`🚨 ATACANDO: ${attackType.icon} ${attackType.name} em ${target}`, 'attack');
    
    setScanProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    const isBlocked = Math.random() < 0.3;
    
    if (isBlocked) {
      setBlockedCount(prev => prev + 1);
      addLog(`🛡️ ATAQUE BLOQUEADO! Firewall neutralizou ${attackType.name} de ${ip}`, 'blocked');
      setVirusAnimation(false);
    } else {
      setVirusAnimation(true);
      addLog(`💀 ATAQUE BEM SUCEDIDO! ${attackType.name} comprometeu ${target}`, 'success');
      
      try {
        await fetch('http://localhost:8080/api/security/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: attackType.id.toUpperCase(),
            severity: attackType.severity,
            message: `🚨 ${attackType.name} detectado em ${target}`,
            source_ip: ip,
          }),
        });
      } catch (error) {
        console.error('Erro ao enviar alerta:', error);
      }
      
      setTimeout(() => {
        setVirusAnimation(false);
      }, 3000);
    }
    
    setCurrentAttack(null);
    setScanProgress(0);
  };

  const startSimulation = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    setIsRunning(true);
    setShowMatrix(false);
    setLogs([]);
    setAttackCount(0);
    setBlockedCount(0);
    attackIndex.current = 0;
    
    addLog('🚀 INICIANDO SIMULAÇÃO DE ATAQUE...', 'system');
    addLog('🛡️ Sistema de defesa ativado', 'system');
    addLog('🔍 Detectando vulnerabilidades...', 'system');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    while (attackIndex.current < ATTACK_TYPES.length) {
      const attack = ATTACK_TYPES[attackIndex.current];
      await simulateSingleAttack(attack);
      attackIndex.current++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    addLog('✅ SIMULAÇÃO CONCLUÍDA!', 'system');
    addLog(`📊 Resumo: ${attackCount} ataques, ${blockedCount} bloqueados`, 'system');
    setIsRunning(false);
    setIsSimulating(false);
    setShowMatrix(true);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    setIsSimulating(false);
    setShowMatrix(true);
    addLog('⏹️ SIMULAÇÃO INTERROMPIDA', 'system');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BeakerIcon className="w-8 h-8 text-purple-600" />
              Simulação de Ataque
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Teste a eficácia do sistema contra diferentes tipos de ataques
            </p>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <BoltIcon className="w-5 h-5" />
                Iniciar Simulação
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Parar
              </button>
            )}
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Limpar Logs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Ataques</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{attackCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Bloqueados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{blockedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRunning ? `${Math.round((attackIndex.current / ATTACK_TYPES.length) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRunning ? '🟢 Ativo' : '⏸️ Parado'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Ataque com Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative overflow-hidden min-h-[350px]">
            <MatrixPanelEffect isActive={showMatrix && !isRunning && !currentAttack} />
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 relative z-10">
              Ataque em Andamento
            </h2>
            
            {currentAttack ? (
              <div className="space-y-4 relative z-10">
                <div className={`text-6xl text-center ${virusAnimation ? 'animate-bounce' : ''}`}>
                  {currentAttack.icon}
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {currentAttack.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Severidade: {currentAttack.severity}
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${scanProgress}%`,
                      backgroundColor: currentAttack.color 
                    }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500">
                  {scanProgress}% concluído
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 relative z-10">
                {showMatrix ? (
                  <>
                    <div className="text-6xl mb-4 animate-pulse">💻</div>
                    <p className="text-lg font-semibold text-green-500 dark:text-green-400">
                      🔒 Sistema Protegido
                    </p>
                    <p className="text-sm">Aguardando ataques...</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Clique em "Iniciar Simulação" para testar
                    </p>
                  </>
                ) : (
                  <>
                    <ComputerDesktopIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aguardando ataques...</p>
                  </>
                )}
              </div>
            )}

            {virusAnimation && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl font-bold text-red-500 animate-bounce"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  >
                    💀
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Log de Eventos
            </h2>
            <div className="h-64 overflow-y-auto font-mono text-sm space-y-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BeakerIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum evento registrado</p>
                  <p className="text-xs text-green-500">Clique em "Iniciar Simulação"</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index}
                    className={`py-1 px-2 rounded ${
                      log.type === 'attack' ? 'text-red-600 dark:text-red-400' :
                      log.type === 'blocked' ? 'text-green-600 dark:text-green-400' :
                      log.type === 'success' ? 'text-red-800 dark:text-red-300 font-bold' :
                      log.type === 'system' ? 'text-blue-600 dark:text-blue-400 font-bold' :
                      'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span className="text-gray-400">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tipos de Ataque Simulados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ATTACK_TYPES.map((attack) => (
              <div 
                key={attack.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  currentAttack?.id === attack.id 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-500'
                }`}
              >
                <div className="text-2xl">{attack.icon}</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{attack.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{attack.severity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
