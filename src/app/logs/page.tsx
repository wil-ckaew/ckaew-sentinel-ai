'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { logs } from '@/lib/api';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  source_ip?: string | null;
  created_at?: string;
}

interface LogStats {
  total_logs_24h: number;
  critical: number;
  error: number;
  warning: number;
  info: number;
}

const emptyForm = {
  event_type: '',
  severity: 'info',
  message: '',
  source_ip: '',
};

const severityLabels: Record<string, string> = {
  info: 'Informativo',
  warning: 'Aviso',
  error: 'Erro',
  critical: 'Crítico',
};

function severityColor(severity: string) {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return colors[severity] || colors.info;
}

function dateLabel(value?: string) {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

export default function LogsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [items, setItems] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    total_logs_24h: 0,
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('Todos');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  const fetchLogs = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setLoadError('');

    try {
      const [listResponse, statsResponse] = await Promise.all([
        logs.list(),
        logs.stats(),
      ]);

      const list = listResponse.data?.logs;
      setItems(Array.isArray(list) ? list : []);
      setStats({
        total_logs_24h: Number(statsResponse.data?.total_logs_24h || 0),
        critical: Number(statsResponse.data?.critical || 0),
        error: Number(statsResponse.data?.error || 0),
        warning: Number(statsResponse.data?.warning || 0),
        info: Number(statsResponse.data?.info || 0),
      });
    } catch (error: any) {
      const message =
        error?.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente.'
          : 'Não foi possível carregar os logs de segurança.';

      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void fetchLogs();
  }, [isAuthenticated, fetchLogs]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);

    try {
      await logs.create({
        event_type: form.event_type.trim(),
        severity: form.severity,
        message: form.message.trim(),
        source_ip: form.source_ip.trim() || null,
      });

      toast.success(
        form.severity === 'critical' || form.severity === 'error'
          ? 'Evento salvo. O backend também gerou um alerta.'
          : 'Evento de segurança registrado.'
      );

      setForm(emptyForm);
      setFormOpen(false);
      await fetchLogs(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.error || 'Não foi possível registrar o evento.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Carregando logs...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      item.event_type.toLowerCase().includes(term) ||
      item.message.toLowerCase().includes(term) ||
      (item.source_ip || '').toLowerCase().includes(term);

    return matchesSearch &&
      (severityFilter === 'Todos' || item.severity === severityFilter);
  });

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Logs de Segurança
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Eventos registrados no PostgreSQL nas últimas 24 horas e no histórico recente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchLogs()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setFormOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              {formOpen ? 'Fechar formulário' : 'Novo registro'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Eventos em 24h', value: stats.total_logs_24h, color: 'text-gray-900 dark:text-white' },
            { label: 'Críticos', value: stats.critical, color: 'text-red-600' },
            { label: 'Erros', value: stats.error, color: 'text-orange-600' },
            { label: 'Avisos', value: stats.warning, color: 'text-yellow-600' },
            { label: 'Informativos', value: stats.info, color: 'text-blue-600' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {formOpen && (
          <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Registrar evento de segurança
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tipo de evento *
                  <input
                    required
                    maxLength={100}
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: LOGIN_FAILED"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Severidade *
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="info">Informativo</option>
                    <option value="warning">Aviso</option>
                    <option value="error">Erro</option>
                    <option value="critical">Crítico</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 md:col-span-2">
                  Mensagem *
                  <textarea
                    required
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Descreva o evento detectado"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  IP de origem
                  <input
                    maxLength={45}
                    value={form.source_ip}
                    onChange={(e) => setForm({ ...form, source_ip: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: 192.168.1.100"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Registrar evento'}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tipo, mensagem ou IP..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={`${inputClass} sm:max-w-56`}
            aria-label="Filtrar severidade"
          >
            <option value="Todos">Todas as severidades</option>
            {Object.entries(severityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {loadError}
            <button onClick={() => void fetchLogs()} className="ml-2 font-semibold underline">
              Tentar novamente
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {items.length === 0 ? 'Nenhum evento registrado' : 'Nenhum resultado encontrado'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? 'Registre um evento para começar a acompanhar os logs de segurança.'
                : 'Altere os filtros e tente novamente.'}
            </p>
            {items.length === 0 && (
              <button onClick={() => setFormOpen(true)} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Registrar primeiro evento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredItems.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{item.event_type}</h2>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-300">{item.message}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Origem: {item.source_ip || 'Não informada'} · {dateLabel(item.created_at)}
                      </p>
                    </div>
                    <span className={`self-start rounded-full px-2.5 py-1 text-xs font-medium ${severityColor(item.severity)}`}>
                      {severityLabels[item.severity] || item.severity}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
