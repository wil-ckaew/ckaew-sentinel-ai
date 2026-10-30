'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  agents,
  type AgentDiskUsage,
  type AgentMetric,
  type AgentNetworkUsage,
  type AgentProcess,
  type AgentRecord,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
}

function formatPercent(value: number): string {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function formatDate(value?: string | null): string {
  if (!value) return 'Não disponível';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não disponível';

  return date.toLocaleString('pt-BR');
}

function formatTime(value?: string | null): string {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Não disponível';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}min`;
}

function usageColor(value: number): string {
  if (value >= 85) return 'bg-red-500';
  if (value >= 65) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function UsageBar({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${usageColor(normalized)}`}
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {children}
    </div>
  );
}

export default function AgentesPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [agentList, setAgentList] = useState<AgentRecord[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [history, setHistory] = useState<AgentMetric[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchAgents = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const response = await agents.list();
      const list = response.data.agents || [];

      setAgentList(list);
      setSelectedAgentId((current) => {
        if (current && list.some((agent) => agent.agent_id === current)) {
          return current;
        }
        return list[0]?.agent_id || '';
      });

      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      console.error('Erro ao consultar agentes:', err);
      setError(
        err?.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente no sistema.'
          : 'Não foi possível consultar os agentes. Verifique a conexão com o backend.'
      );
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    const load = async () => {
      try {
        const response = await agents.list();
        if (!active) return;

        const list = response.data.agents || [];
        setAgentList(list);

        setSelectedAgentId((current) => {
          if (current && list.some((agent) => agent.agent_id === current)) {
            return current;
          }
          return list[0]?.agent_id || '';
        });

        setLastRefresh(new Date());
        setError('');
      } catch (err: any) {
        if (!active) return;

        console.error('Erro ao consultar agentes:', err);
        setError(
          err?.response?.status === 401
            ? 'Sua sessão expirou. Entre novamente no sistema.'
            : 'Não foi possível consultar os agentes. Verifique a conexão com o backend.'
        );
      } finally {
        if (active) setPageLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedAgentId) {
      setHistory([]);
      return;
    }

    let active = true;

    const loadHistory = async (initial = false) => {
      if (initial) setHistoryLoading(true);

      try {
        const response = await agents.history(selectedAgentId, 120);
        if (!active) return;

        setHistory(response.data.metrics || []);
        setHistoryError('');
      } catch (err: any) {
        if (!active) return;

        console.error('Erro ao consultar histórico:', err);
        setHistoryError('Não foi possível carregar o histórico deste agente.');
      } finally {
        if (active && initial) setHistoryLoading(false);
      }
    };

    loadHistory(true);

    const timer = window.setInterval(() => {
      loadHistory(false);
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, selectedAgentId]);

  const selectedAgent = useMemo(
    () => agentList.find((agent) => agent.agent_id === selectedAgentId) || null,
    [agentList, selectedAgentId]
  );

  const latestMetric = selectedAgent?.latest_metric || history[0] || null;

  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((metric) => ({
        time: formatTime(metric.collected_at),
        cpu: Number(metric.cpu_usage) || 0,
        memory: Number(metric.memory_usage) || 0,
      }));
  }, [history]);

  const disks: AgentDiskUsage[] = Array.isArray(latestMetric?.disk_usage)
    ? latestMetric.disk_usage
    : [];

  const networks: AgentNetworkUsage[] = Array.isArray(latestMetric?.network_usage)
    ? latestMetric.network_usage
    : [];

  const processes: AgentProcess[] = Array.isArray(latestMetric?.processes)
    ? [...latestMetric.processes]
        .sort((a, b) => (Number(b.cpu_usage) || 0) - (Number(a.cpu_usage) || 0))
        .slice(0, 10)
    : [];

  const onlineAgents = agentList.filter((agent) => agent.status === 'online').length;
  const offlineAgents = agentList.length - onlineAgents;

  const averageCpu = agentList.length
    ? agentList.reduce(
        (sum, agent) => sum + (Number(agent.latest_metric?.cpu_usage) || 0),
        0
      ) / agentList.length
    : 0;

  const averageMemory = agentList.length
    ? agentList.reduce(
        (sum, agent) => sum + (Number(agent.latest_metric?.memory_usage) || 0),
        0
      ) / agentList.length
    : 0;

  const loadAverage = Array.isArray(latestMetric?.load_average)
    ? latestMetric.load_average
    : [];

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">
          Carregando monitoramento dos agentes...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CpuChipIcon className="h-7 w-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agentes de Monitoramento
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Telemetria real coletada pelo agente Rust CKAEW Sentinel AI.
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Atualização automática a cada 30 segundos
              {lastRefresh ? ` • Atualizado às ${lastRefresh.toLocaleTimeString('pt-BR')}` : ''}
            </p>
          </div>

          <button
            onClick={() => fetchAgents(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar agora
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Indicadores gerais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Agentes cadastrados</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {agentList.length}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/40">
                <ServerIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Agentes online</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{onlineAgents}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {offlineAgents} offline
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/40">
                <CheckCircleIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">CPU média</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPercent(averageCpu)}
                </p>
              </div>
              <div className="rounded-lg bg-violet-100 p-3 dark:bg-violet-900/40">
                <CpuChipIcon className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Memória média</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPercent(averageMemory)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/40">
                <ChartBarIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Máquinas monitoradas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione um agente para visualizar os detalhes.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {agentList.length} registrado(s)
            </span>
          </div>

          {agentList.length === 0 ? (
            <EmptyState>
              Nenhum agente foi registrado ainda. Verifique se o serviço Rust está ativo.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {agentList.map((agent) => {
                const active = agent.agent_id === selectedAgentId;
                const online = agent.status === 'online';

                return (
                  <button
                    key={agent.agent_id}
                    onClick={() => setSelectedAgentId(agent.agent_id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                          <ServerIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {agent.hostname}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.operating_system}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          online
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CPU</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPercent(agent.latest_metric?.cpu_usage || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Memória</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPercent(agent.latest_metric?.memory_usage || 0)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedAgent && (
          <>
            {/* Informações da máquina */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedAgent.hostname}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedAgent.operating_system} • {selectedAgent.kernel_version}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {selectedAgent.cpu_cores} núcleos
                  </span>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {formatBytes(selectedAgent.total_memory)} RAM
                  </span>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    Uptime: {formatUptime(selectedAgent.uptime)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-700 sm:grid-cols-2">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Último contato: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedAgent.last_seen)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Última métrica: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(latestMetric?.collected_at)}
                  </span>
                </div>
              </div>
            </section>

            {/* Indicadores da máquina */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Uso de CPU</h3>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPercent(latestMetric?.cpu_usage || 0)}
                  </span>
                </div>
                <UsageBar value={latestMetric?.cpu_usage || 0} />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Utilização atual do processador.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Uso de memória</h3>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPercent(latestMetric?.memory_usage || 0)}
                  </span>
                </div>
                <UsageBar value={latestMetric?.memory_usage || 0} />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(selectedAgent.total_memory)} de memória física total.
                </p>
              </section>
            </div>

            {/* Histórico */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Histórico de desempenho
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Últimas {history.length} coletas registradas.
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Valores em porcentagem
                </span>
              </div>

              {historyError && (
                <p className="mb-3 text-sm text-red-600 dark:text-red-400">{historyError}</p>
              )}

              {historyLoading ? (
                <EmptyState>Carregando histórico...</EmptyState>
              ) : chartData.length === 0 ? (
                <EmptyState>Ainda não existem métricas históricas para este agente.</EmptyState>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.35} />
                      <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        minTickGap={24}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid #374151',
                          borderRadius: 10,
                          color: '#fff',
                        }}
                        formatter={(value) => [
                          `${Number(value ?? 0).toFixed(2)}%`,
                        ]}
                      />
                      <Legend />
                      <Line
                        name="CPU"
                        type="monotone"
                        dataKey="cpu"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        name="Memória"
                        type="monotone"
                        dataKey="memory"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Load average e discos */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Carga do sistema
                  </h3>
                </div>

                {loadAverage.length >= 3 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {['1 min', '5 min', '15 min'].map((label, index) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700/60">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {Number(loadAverage[index]).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>Carga do sistema indisponível.</EmptyState>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Armazenamento e discos
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {disks.length} unidade(s)
                  </span>
                </div>

                {disks.length === 0 ? (
                  <EmptyState>Nenhum dado de disco disponível.</EmptyState>
                ) : (
                  <div className="space-y-4">
                    {disks.map((disk, index) => (
                      <div key={`${disk.mount_point}-${index}`}>
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {disk.mount_point}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatPercent(disk.usage_percent)}
                          </span>
                        </div>
                        <UsageBar value={disk.usage_percent} />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(disk.used)} usados de {formatBytes(disk.total)}
                          {' • '}
                          {formatBytes(disk.free)} livres
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Rede */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Interfaces de rede
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {networks.length} interface(s)
                </span>
              </div>

              {networks.length === 0 ? (
                <EmptyState>Nenhuma interface de rede disponível.</EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {networks.map((network, index) => (
                    <div
                      key={`${network.interface}-${index}`}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <p className="mb-3 font-semibold text-gray-900 dark:text-white">
                        {network.interface}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Recebidos</p>
                          <p className="font-medium text-emerald-600">
                            {formatBytes(network.bytes_received)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Enviados</p>
                          <p className="font-medium text-blue-600">
                            {formatBytes(network.bytes_sent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pacotes recebidos</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(network.packets_received || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pacotes enviados</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(network.packets_sent || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Processos */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Processos em execução
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Até 10 processos com maior uso de CPU.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {processes.length} processo(s)
                </span>
              </div>

              {processes.length === 0 ? (
                <div className="p-5">
                  <EmptyState>Não há informações de processos disponíveis.</EmptyState>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        {['PID', 'Processo', 'CPU', 'Memória', 'Estado'].map((heading) => (
                          <th
                            key={heading}
                            className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {processes.map((process, index) => (
                        <tr key={`${process.pid}-${index}`}>
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {process.pid}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {process.name || 'Processo sem nome'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {formatPercent(process.cpu_usage)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {formatBytes(process.memory_usage)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {process.status || 'N/D'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {!selectedAgent && agentList.length > 0 && (
          <EmptyState>Selecione um agente para consultar os detalhes.</EmptyState>
        )}

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            Coleta configurada pelo agente: 30 segundos.
          </span>
          <span>CKAEW Sentinel AI • Telemetria Rust</span>
        </div>
      </div>
    </Layout>
  );
}
