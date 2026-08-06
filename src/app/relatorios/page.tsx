'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const initialReports = [
  { id: 1, name: 'Relatório de Incidentes - Janeiro 2024', type: 'Incidentes', date: '2024-01-31', size: '2.4 MB', status: 'Pronto' },
  { id: 2, name: 'Análise de Vulnerabilidades - Q1 2024', type: 'Vulnerabilidades', date: '2024-01-28', size: '4.1 MB', status: 'Processando' },
  { id: 3, name: 'Resumo de Segurança - Semana 4', type: 'Resumo', date: '2024-01-25', size: '1.2 MB', status: 'Pronto' },
  { id: 4, name: 'Relatório de Ativos - Dezembro 2023', type: 'Ativos', date: '2024-01-01', size: '3.8 MB', status: 'Pronto' },
];

export default function RelatoriosPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [reports, setReports] = useState(initialReports);
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [newReportType, setNewReportType] = useState<'Incidentes' | 'Vulnerabilidades' | 'Resumo' | 'Ativos' | 'Conformidade' | 'Usuários'>('Incidentes');
  const [newReportName, setNewReportName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingReportId, setPendingReportId] = useState<number | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleCreateReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reportName = newReportName.trim();

    if (!reportName) {
      setErrorMessage('Informe um nome de relatório.');
      return;
    }

    const newReport = {
      id: reports.length + 1,
      name: reportName,
      type: newReportType,
      date: new Date().toISOString().split('T')[0],
      size: '0.0 MB',
      status: 'Processando',
    };

    setReports([newReport, ...reports]);
    setPendingReportId(newReport.id);
    setHighlightedReportId(newReport.id);
    setNewReportName('');
    setNewReportType('Incidentes');
    setErrorMessage('');
    setIsNewReportOpen(false);
  };

  useEffect(() => {
    if (highlightedReportId === null) return;

    const reportRow = document.getElementById(`report-row-${highlightedReportId}`);
    reportRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearHighlight = window.setTimeout(() => {
      setHighlightedReportId(null);
    }, 4500);

    return () => window.clearTimeout(clearHighlight);
  }, [highlightedReportId]);

  useEffect(() => {
    if (pendingReportId === null) return;

    const timer = window.setTimeout(() => {
      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === pendingReportId
            ? { ...report, status: 'Pronto', size: '2.4 MB' }
            : report,
        ),
      );
      setPendingReportId(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [pendingReportId]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Relatórios
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie e visualize relatórios de segurança
            </p>
          </div>
          <button
            onClick={() => setIsNewReportOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Novo Relatório
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Resumo Diário</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Análise Mensal</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Relatório de Conformidade</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Relatório de Usuários</p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr
                    id={`report-row-${report.id}`}
                    key={report.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300 ${
                      highlightedReportId === report.id
                        ? 'ring-1 ring-blue-400/70 bg-blue-50 dark:bg-slate-700'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                      {report.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                      {report.size}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'Pronto' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {isNewReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Novo Relatório</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Crie um novo relatório de segurança</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewReportOpen(false);
                    setErrorMessage('');
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateReport} className="p-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <label className="block text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Nome do relatório</label>
                  <input
                    value={newReportName}
                    onChange={(event) => {
                      setNewReportName(event.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Ex: Relatório de Compliance - Maio 2024"
                    className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Tipo de relatório</label>
                  <select
                    value={newReportType}
                    onChange={(event) => setNewReportType(event.target.value as any)}
                    className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option>Incidentes</option>
                    <option>Vulnerabilidades</option>
                    <option>Resumo</option>
                    <option>Ativos</option>
                    <option>Conformidade</option>
                    <option>Usuários</option>
                  </select>
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewReportOpen(false);
                      setErrorMessage('');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newReportName.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Criar Relatório
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
