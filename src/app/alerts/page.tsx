'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { alerts } from '@/lib/api';
import {
  BellIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AlertItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  source_ip?: string | null;
  message?: string | null;
  description?: string | null;
  created_at?: string;
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

function priorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return colors[priority] || colors.medium;
}

function dateLabel(value?: string) {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

export default function AlertsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [items, setItems] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Todos');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
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
    if (isAuthenticated) void fetchAlerts();
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
        error?.response?.data?.error || 'Não foi possível registrar o alerta.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Carregando alertas...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(term) ||
      (item.source_ip || '').toLowerCase().includes(term) ||
      (item.message || item.description || '').toLowerCase().includes(term);

    return matchesSearch &&
      (priorityFilter === 'Todos' || item.priority === priorityFilter);
  });

  const criticalCount = items.filter((item) => item.priority === 'critical').length;
  const openCount = items.filter((item) => item.status !== 'resolved').length;

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Alertas de segurança registrados no PostgreSQL.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchAlerts()}
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
              {formOpen ? 'Fechar formulário' : 'Novo alerta'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de alertas</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Alertas críticos</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Não resolvidos</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{openCount}</p>
          </div>
        </div>

        {formOpen && (
          <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Registrar alerta
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Título *
                  <input
                    required
                    maxLength={255}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: Tentativas de acesso suspeitas"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Prioridade *
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, source_ip: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: 192.168.1.100"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Detalhes
                  <input
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Descrição do alerta"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar alerta'}
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
              placeholder="Buscar por título, IP ou detalhes..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`${inputClass} sm:max-w-48`}
            aria-label="Filtrar prioridade"
          >
            <option value="Todos">Todas as prioridades</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {loadError}
            <button onClick={() => void fetchAlerts()} className="ml-2 font-semibold underline">
              Tentar novamente
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {items.length === 0 ? 'Nenhum alerta registrado' : 'Nenhum resultado encontrado'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? 'Os alertas aparecerão aqui quando forem registrados no sistema.'
                : 'Altere a busca ou o filtro de prioridade.'}
            </p>
            {items.length === 0 && (
              <button onClick={() => setFormOpen(true)} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Registrar primeiro alerta
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                      <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Origem: {item.source_ip || 'Não informada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityColor(item.priority)}`}>
                      {priorityLabels[item.priority] || item.priority}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {statusLabels[item.status] || item.status}
                    </span>
                  </div>
                </div>
                {(item.message || item.description) && (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                    {item.message || item.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Registrado em {dateLabel(item.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
