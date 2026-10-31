'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { alerts } from '@/lib/api';
import {
  BellIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AlertMetadata {
  source?: unknown;
  agent_id?: unknown;
  agent_hostname?: unknown;
  event_type?: unknown;
  rule_key?: unknown;
  current_value?: unknown;
  threshold?: unknown;
  value?: unknown;
  observed_value?: unknown;
  usage_percent?: unknown;
  unit?: unknown;
  mount?: unknown;
  description?: unknown;
  [key: string]: unknown;
}

interface AlertItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  source_ip?: string | null;
  message?: string | null;
  description?: string | null;
  metadata?: AlertMetadata | null;
  agent_hostname?: string | null;
  created_at?: string;
  updated_at?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

interface AgentOption {
  id: string;
  label: string;
}

const emptyForm = {
  title: '',
  priority: 'high',
  source_ip: '',
  message: '',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const statusLabels: Record<string, string> = {
  new: 'Novo',
  investigating: 'Em investigação',
  escalated: 'Escalonado',
  resolved: 'Resolvido',
  false_positive: 'Falso positivo',
};

const ruleLabels: Record<string, string> = {
  cpu_high: 'Uso elevado de CPU',
  memory_high: 'Uso elevado de memória',
  agent_offline: 'Agente sem comunicação',
};

function priorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return colors[priority] || colors.medium;
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    new: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900',
    investigating: 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:ring-yellow-900',
    escalated: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
    resolved: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900',
    false_positive: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600',
  };

  return colors[status] || colors.new;
}

function dateLabel(value?: string | null) {
  if (!value) return 'Não informado';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('pt-BR');
}

function metadataText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function metadataNumber(
  metadata: AlertMetadata | null | undefined,
  keys: string[],
): number | null {
  if (!metadata) return null;

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function getSource(item: AlertItem): string {
  return metadataText(item.metadata?.source);
}

function sourceLabel(source: string): string {
  if (source === 'rust_detection_engine') {
    return 'Motor de detecção Rust';
  }

  if (source === 'rust_agent') {
    return 'Agente Rust · Evento de log';
  }

  if (!source) {
    return 'Registro manual / sistema';
  }

  return source;
}

function sourceBadgeColor(source: string): string {
  if (source === 'rust_detection_engine') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  }

  if (source === 'rust_agent') {
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300';
  }

  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

function getRuleKey(item: AlertItem): string {
  return (
    metadataText(item.metadata?.rule_key) ||
    metadataText(item.metadata?.event_type)
  );
}

function ruleLabel(item: AlertItem): string {
  const key = getRuleKey(item);

  if (ruleLabels[key]) return ruleLabels[key];

  if (key.startsWith('disk_high')) {
    return 'Armazenamento elevado';
  }

  if (key === 'SYSTEM_LOG') {
    return 'Evento de log do sistema';
  }

  return key || 'Regra não informada';
}

function metricDetails(item: AlertItem): string | null {
  const metadata = item.metadata;
  if (!metadata) return null;

  const current = metadataNumber(metadata, [
    'current_value',
    'observed_value',
    'usage_percent',
    'value',
  ]);

  const threshold = metadataNumber(metadata, ['threshold']);

  if (current === null && threshold === null) return null;

  const rule = getRuleKey(item);
  const isOffline = rule === 'agent_offline';
  const unit = metadataText(metadata.unit) || (isOffline ? 'segundos' : '%');

  const parts: string[] = [];

  if (current !== null) {
    parts.push(`Valor detectado: ${current}${unit === '%' ? '%' : ` ${unit}`}`);
  }

  if (threshold !== null) {
    parts.push(`Limite: ${threshold}${unit === '%' ? '%' : ` ${unit}`}`);
  }

  return parts.join(' · ');
}

function dateShort(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('pt-BR');
}

export default function AlertsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [items, setItems] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sourceFilter, setSourceFilter] = useState('Todos');
  const [agentFilter, setAgentFilter] = useState('Todos');

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchAlerts = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);

    setLoadError('');

    try {
      const response = await alerts.list();
      const data = response.data?.alerts;

      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const message =
        error?.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente.'
          : 'Não foi possível carregar os alertas.';

      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    void fetchAlerts();

    const interval = window.setInterval(() => {
      void fetchAlerts(false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, fetchAlerts]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      await alerts.create({
        title: form.title.trim(),
        priority: form.priority,
        source_ip: form.source_ip.trim() || null,
        message: form.message.trim() || null,
      });

      toast.success('Alerta salvo no PostgreSQL.');
      setForm(emptyForm);
      setFormOpen(false);

      await fetchAlerts(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        'Não foi possível registrar o alerta.';

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const agents = useMemo<AgentOption[]>(() => {
    const unique = new Map<string, AgentOption>();

    for (const item of items) {
      const agentId = metadataText(item.metadata?.agent_id);

      if (!agentId) continue;

      const hostname =
        item.agent_hostname ||
        metadataText(item.metadata?.agent_hostname) ||
        agentId;

      if (!unique.has(agentId)) {
        unique.set(agentId, {
          id: agentId,
          label: hostname,
        });
      }
    }

    return Array.from(unique.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR'),
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const metadata = item.metadata || {};
      const source = getSource(item);
      const agentId = metadataText(metadata.agent_id);
      const hostname =
        item.agent_hostname ||
        metadataText(metadata.agent_hostname) ||
        '';
      const rule = ruleLabel(item);
      const eventType = metadataText(metadata.event_type);

      const searchable = [
        item.title,
        item.source_ip,
        item.message,
        item.description,
        hostname,
        agentId,
        source,
        rule,
        eventType,
        JSON.stringify(metadata),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);
      const matchesPriority =
        priorityFilter === 'Todos' || item.priority === priorityFilter;
      const matchesStatus =
        statusFilter === 'Todos' || item.status === statusFilter;

      const matchesSource =
        sourceFilter === 'Todos' ||
        (sourceFilter === 'manual'
          ? !source || (source !== 'rust_agent' && source !== 'rust_detection_engine')
          : source === sourceFilter);

      const matchesAgent =
        agentFilter === 'Todos' || agentId === agentFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesSource &&
        matchesAgent
      );
    });
  }, [
    items,
    searchTerm,
    priorityFilter,
    statusFilter,
    sourceFilter,
    agentFilter,
  ]);

  const criticalCount = items.filter(
    (item) => item.priority === 'critical' && item.status !== 'resolved',
  ).length;

  const openCount = items.filter(
    (item) =>
      item.status === 'new' ||
      item.status === 'investigating' ||
      item.status === 'escalated',
  ).length;

  const resolvedCount = items.filter(
    (item) =>
      item.status === 'resolved' ||
      item.status === 'false_positive',
  ).length;

  const engineCount = items.filter(
    (item) => getSource(item) === 'rust_detection_engine',
  ).length;

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900';

  if (loading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Carregando alertas...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <BellIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Central de Alertas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monitoramento de segurança e eventos dos agentes.
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Atualização automática a cada 30 segundos
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchAlerts()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Atualizar
            </button>

            <button
              type="button"
              onClick={() => setFormOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {formOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
              {formOpen ? 'Fechar' : 'Novo alerta'}
            </button>
          </div>
        </header>

        {/* Indicadores */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de alertas
              </p>
              <BellIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              {items.length}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Registros encontrados
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/60 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Críticos abertos
              </p>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-red-600 dark:text-red-400">
              {criticalCount}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Prioridade crítica
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm dark:border-orange-900/60 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Em aberto
              </p>
              <ClockIcon className="h-6 w-6 text-orange-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-orange-600 dark:text-orange-400">
              {openCount}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Aguardando tratamento
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm dark:border-green-900/60 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Resolvidos
              </p>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400">
              {resolvedCount}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Resolvidos ou falsos positivos
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm dark:border-purple-900/60 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Motor Rust
              </p>
              <ShieldCheckIcon className="h-6 w-6 text-purple-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {engineCount}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Alertas de regras automáticas
            </p>
          </div>
        </section>

        {/* Cadastro manual */}
        {formOpen && (
          <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900/60 dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registrar novo alerta
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Cadastro manual de um evento de segurança.
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Título *
                  <input
                    required
                    maxLength={255}
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: Tentativas de acesso suspeitas"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Prioridade *
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  IP de origem
                  <input
                    maxLength={45}
                    value={form.source_ip}
                    onChange={(event) =>
                      setForm({ ...form, source_ip: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: 192.168.1.100"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Detalhes
                  <input
                    value={form.message}
                    onChange={(event) =>
                      setForm({ ...form, message: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                    placeholder="Descrição do alerta"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar alerta'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filtros */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Pesquisa e filtros
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar alertas..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className={inputClass}
              aria-label="Filtrar prioridade"
            >
              <option value="Todos">Todas as prioridades</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
              aria-label="Filtrar situação"
            >
              <option value="Todos">Todas as situações</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className={inputClass}
              aria-label="Filtrar origem"
            >
              <option value="Todos">Todas as origens</option>
              <option value="rust_detection_engine">Motor de detecção Rust</option>
              <option value="rust_agent">Agente Rust</option>
              <option value="manual">Manual / outros</option>
            </select>

            <select
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value)}
              className={inputClass}
              aria-label="Filtrar agente"
            >
              <option value="Todos">Todos os agentes</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Exibindo {filteredItems.length} de {items.length} alertas.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('Todos');
                setStatusFilter('Todos');
                setSourceFilter('Todos');
                setAgentFilter('Todos');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Limpar filtros
            </button>
          </div>
        </section>

        {/* Erro de carregamento */}
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {loadError}
            <button
              onClick={() => void fetchAlerts()}
              className="ml-2 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista de alertas */}
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />

            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {items.length === 0
                ? 'Nenhum alerta registrado'
                : 'Nenhum resultado encontrado'}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? 'Os alertas aparecerão aqui quando forem registrados no sistema.'
                : 'Altere os filtros ou a pesquisa para encontrar outros alertas.'}
            </p>

            {items.length === 0 && (
              <button
                onClick={() => setFormOpen(true)}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Registrar primeiro alerta
              </button>
            )}
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eventos registrados
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {filteredItems.length} registros
              </span>
            </div>

            {filteredItems.map((item) => {
              const metadata = item.metadata || {};
              const source = getSource(item);
              const agentId = metadataText(metadata.agent_id);
              const hostname =
                item.agent_hostname ||
                metadataText(metadata.agent_hostname);
              const eventType = metadataText(metadata.event_type);
              const rule = ruleLabel(item);
              const metric = metricDetails(item);
              const isResolved =
                item.status === 'resolved' ||
                item.status === 'false_positive';

              return (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md dark:bg-gray-800 ${
                    item.priority === 'critical' && !isResolved
                      ? 'border-red-200 dark:border-red-900/60'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div
                    className={`h-1 ${
                      item.priority === 'critical'
                        ? 'bg-red-500'
                        : item.priority === 'high'
                          ? 'bg-orange-500'
                          : item.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                    }`}
                  />

                  <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-700">
                          {source === 'rust_detection_engine' ? (
                            <CpuChipIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                          ) : agentId ? (
                            <ServerIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                          ) : (
                            <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words font-semibold text-gray-900 dark:text-white">
                            {item.title}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityColor(item.priority)}`}
                            >
                              {priorityLabels[item.priority] || item.priority}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusColor(item.status)}`}
                            >
                              {statusLabels[item.status] || item.status}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${sourceBadgeColor(source)}`}
                            >
                              {sourceLabel(source)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-left lg:text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Registrado em
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                          {dateShort(item.created_at)}
                        </p>
                      </div>
                    </div>

                    {(item.message || item.description) && (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {item.message || item.description}
                      </p>
                    )}

                    {/* Informações do agente */}
                    {(hostname || agentId) && (
                      <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-900/50 dark:bg-cyan-950/20">
                        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900 dark:text-cyan-200">
                          <ServerIcon className="h-4 w-4" />
                          Computador monitorado
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Hostname
                            </span>
                            <p className="break-all font-medium text-gray-800 dark:text-gray-200">
                              {hostname || 'Não informado'}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Identificação do agente
                            </span>
                            <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                              {agentId || 'Não informado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detalhes da regra */}
                    {(source === 'rust_detection_engine' || eventType || rule !== 'Regra não informada') && (
                      <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50/60 p-3 dark:border-purple-900/50 dark:bg-purple-950/20">
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          <ShieldCheckIcon className="h-4 w-4" />
                          Detalhes da detecção
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Regra / evento
                            </span>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {rule}
                            </p>
                          </div>

                          {eventType && (
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Tipo do evento
                              </span>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {eventType}
                              </p>
                            </div>
                          )}

                          {metric && (
                            <div className="sm:col-span-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Métrica
                              </span>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {metric}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Origem e recuperação */}
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-gray-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                        {item.source_ip && (
                          <span>
                            IP de origem:{' '}
                            <strong className="font-medium text-gray-700 dark:text-gray-300">
                              {item.source_ip}
                            </strong>
                          </span>
                        )}

                        {item.updated_at && (
                          <span>
                            Atualizado: {dateShort(item.updated_at)}
                          </span>
                        )}

                        {metadataText(metadata.mount) && (
                          <span>
                            Unidade:{' '}
                            <strong className="font-medium text-gray-700 dark:text-gray-300">
                              {metadataText(metadata.mount)}
                            </strong>
                          </span>
                        )}
                      </div>

                      {isResolved && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                          <CheckCircleIcon className="h-4 w-4" />
                          {item.status === 'false_positive'
                            ? 'Marcado como falso positivo'
                            : 'Alerta recuperado / resolvido'}
                        </span>
                      )}
                    </div>

                    {item.resolved_at && (
                      <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950/20">
                        <p className="font-semibold text-green-800 dark:text-green-300">
                          Data da resolução
                        </p>
                        <p className="mt-1 text-green-700 dark:text-green-400">
                          {dateShort(item.resolved_at)}
                        </p>

                        {item.resolution_notes && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            {item.resolution_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </Layout>
  );
}
