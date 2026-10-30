'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { assets } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ServerIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Asset {
  id: string;
  name: string;
  ip_address: string;
  asset_type: string;
  status: string;
  criticality: string;
  location?: string | null;
  department?: string | null;
  description?: string | null;
  created_at?: string;
}

const initialForm = {
  name: '',
  ip_address: '',
  asset_type: 'server',
  status: 'active',
  criticality: 'medium',
  location: '',
  department: '',
  description: '',
};

const typeLabels: Record<string, string> = {
  server: 'Servidor',
  workstation: 'Estação de trabalho',
  network_device: 'Dispositivo de rede',
  database: 'Banco de dados',
  cloud_instance: 'Instância em nuvem',
  container: 'Container',
  iot_device: 'Dispositivo IoT',
  firewall: 'Firewall',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  maintenance: 'Em manutenção',
  compromised: 'Comprometido',
  decommissioned: 'Desativado',
};

const criticalityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

function statusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    compromised: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    decommissioned: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return colors[status] || colors.inactive;
}

function criticalityColor(value: string) {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return colors[value] || colors.low;
}

export default function AtivosPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [ativos, setAtivos] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchAtivos = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setLoadError('');

    try {
      const response = await assets.list({ limit: 100 });
      const data = response.data?.assets;
      setAtivos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const message =
        error?.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente.'
          : 'Não foi possível carregar os ativos do banco de dados.';

      setLoadError(message);
      toast.error(message);
    } finally {
      if (showSpinner) setIsLoading(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchAtivos();
    }
  }, [isAuthenticated, fetchAtivos]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      await assets.create({
        name: form.name.trim(),
        ip_address: form.ip_address.trim(),
        asset_type: form.asset_type,
        status: form.status,
        criticality: form.criticality,
        location: form.location.trim() || null,
        department: form.department.trim() || null,
        description: form.description.trim() || null,
      });

      toast.success('Ativo cadastrado no PostgreSQL.');
      setForm(initialForm);
      setFormOpen(false);
      await fetchAtivos(false);
    } catch (error: any) {
      const message =
        error?.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente.'
          : error?.response?.data?.error || 'Não foi possível cadastrar o ativo.';

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">
          Carregando ativos...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredAtivos = ativos.filter((ativo) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      ativo.name.toLowerCase().includes(search) ||
      ativo.ip_address.toLowerCase().includes(search) ||
      (ativo.location || '').toLowerCase().includes(search) ||
      (ativo.department || '').toLowerCase().includes(search);

    const matchesStatus =
      filterStatus === 'Todos' || ativo.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ativos
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gerencie servidores, computadores, bancos de dados e dispositivos.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchAtivos()}
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
              {formOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
              {formOpen ? 'Cancelar' : 'Novo ativo'}
            </button>
          </div>
        </div>

        {formOpen && (
          <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900 dark:bg-gray-800">
            <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
              Cadastrar ativo
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nome do ativo *
                  <input
                    required
                    maxLength={255}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: Servidor principal"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Endereço IP *
                  <input
                    required
                    maxLength={45}
                    value={form.ip_address}
                    onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: 192.168.1.10"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tipo *
                  <select
                    value={form.asset_type}
                    onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Situação
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="maintenance">Em manutenção</option>
                    <option value="compromised">Comprometido</option>
                    <option value="decommissioned">Desativado</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Criticidade
                  <select
                    value={form.criticality}
                    onChange={(e) => setForm({ ...form, criticality: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Localização
                  <input
                    maxLength={255}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: Data Center"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 md:col-span-2">
                  Departamento
                  <input
                    maxLength={100}
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Ex.: Tecnologia da Informação"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 md:col-span-2">
                  Descrição
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputClass} mt-1`}
                    placeholder="Informações adicionais sobre o ativo"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar ativo'}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de ativos</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{ativos.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Ativos em operação</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{ativos.filter((a) => a.status === 'active').length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Críticos</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{ativos.filter((a) => a.criticality === 'critical').length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nome, IP, localização ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`${inputClass} sm:max-w-56`}
            aria-label="Filtrar situação"
          >
            <option value="Todos">Todas as situações</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {loadError}
            <button onClick={() => void fetchAtivos()} className="ml-2 font-semibold underline">
              Tentar novamente
            </button>
          </div>
        )}

        {filteredAtivos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800">
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {ativos.length === 0 ? 'Nenhum ativo cadastrado' : 'Nenhum resultado encontrado'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              {ativos.length === 0
                ? 'Cadastre o primeiro ativo. Os dados serão gravados no PostgreSQL e continuarão disponíveis após reiniciar o backend.'
                : 'Tente alterar o texto da busca ou o filtro de situação.'}
            </p>
            {ativos.length === 0 && (
              <button
                onClick={() => setFormOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Cadastrar primeiro ativo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAtivos.map((ativo) => (
              <article key={ativo.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/40">
                    <ServerIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-semibold text-gray-900 dark:text-white">{ativo.name}</h2>
                    <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{ativo.ip_address}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{typeLabels[ativo.asset_type] || ativo.asset_type}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(ativo.status)}`}>
                    {statusLabels[ativo.status] || ativo.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${criticalityColor(ativo.criticality)}`}>
                    Criticidade: {criticalityLabels[ativo.criticality] || ativo.criticality}
                  </span>
                </div>

                <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <p>Localização: {ativo.location || 'Não informada'}</p>
                  <p>Departamento: {ativo.department || 'Não informado'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
