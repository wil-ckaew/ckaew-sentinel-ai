'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { MagnifyingGlassIcon, ShieldCheckIcon, ExclamationTriangleIcon, ArrowPathIcon, BoltIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Dados mockados de vulnerabilidades
const initialVulnerabilidades = [
  { id: 1, titulo: 'CVE-2024-1234 - Log4j Vulnerability', severidade: 'Crítico', status: 'Aberto', asset: 'SRV-PRODUCAO-01', data: '2024-01-10', score: 9.8 },
  { id: 2, titulo: 'CVE-2024-5678 - SQL Injection', severidade: 'Alto', status: 'Em andamento', asset: 'SRV-WEB-01', data: '2024-01-12', score: 8.5 },
  { id: 3, titulo: 'CVE-2024-9012 - XSS Vulnerability', severidade: 'Médio', status: 'Pendente', asset: 'SRV-D6-01', data: '2024-01-14', score: 6.4 },
  { id: 4, titulo: 'CVE-2024-3456 - DoS Attack', severidade: 'Alto', status: 'Mitigado', asset: 'FIREWALL-01', data: '2024-01-15', score: 7.8 },
];

const getSeveridadeColor = (severidade: string) => {
  const colors = {
    'Crítico': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Alto': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Médio': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Baixo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  return colors[severidade as keyof typeof colors] || colors['Baixo'];
};

const getStatusColor = (status: string) => {
  const colors = {
    'Aberto': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Em andamento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Pendente': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Mitigado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Corrigido': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  return colors[status as keyof typeof colors] || colors['Pendente'];
};

export default function VulnerabilidadesPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Aberto' | 'Em andamento' | 'Pendente' | 'Mitigado'>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<'All' | 'Crítico' | 'Alto' | 'Médio' | 'Baixo'>('All');
  const [vulnerabilidades, setVulnerabilidades] = useState(initialVulnerabilidades);
  const [selectedVulnerability, setSelectedVulnerability] = useState<typeof initialVulnerabilidades[number] | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState('Nenhum escaneamento executado ainda.');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedVulnerability(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedVulnerability && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [selectedVulnerability]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  };

  const totalVulnerabilidades = vulnerabilidades.length;
  const affectedAssetsCount = useMemo(
    () => new Set(vulnerabilidades.map((vuln) => vuln.asset)).size,
    [vulnerabilidades],
  );
  const openVulnerabilidades = useMemo(
    () => vulnerabilidades.filter((vuln) => vuln.status.toLowerCase() === 'aberto').length,
    [vulnerabilidades],
  );
  const criticalVulnerabilidades = useMemo(
    () => vulnerabilidades.filter((vuln) => vuln.severidade.toLowerCase() === 'crítico').length,
    [vulnerabilidades],
  );
  const averageRisk = useMemo(
    () => (vulnerabilidades.reduce((sum, vuln) => sum + vuln.score, 0) / vulnerabilidades.length).toFixed(1),
    [vulnerabilidades],
  );

  const filteredVulnerabilidades = useMemo(
    () => vulnerabilidades.filter((vuln) => {
      const matchesSearch =
        vuln.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || vuln.status === selectedStatus;
      const matchesSeverity = selectedSeverity === 'All' || vuln.severidade === selectedSeverity;
      return matchesSearch && matchesStatus && matchesSeverity;
    }),
    [searchTerm, selectedStatus, selectedSeverity, vulnerabilidades],
  );

  const handleScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanMessage('Iniciando escaneamento de vulnerabilidades...');
    setScanResult('Escaneamento em andamento. Aguarde os resultados.');

    const steps = [
      { delay: 900, progress: 25, text: 'Verificando ativos e interfaces...' },
      { delay: 1200, progress: 50, text: 'Analisando CVEs e dependências...' },
      { delay: 1300, progress: 75, text: 'Identificando falhas de configuração...' },
      { delay: 1000, progress: 100, text: 'Finalizando escaneamento...' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      setScanProgress(step.progress);
      setScanMessage(step.text);
    }

    const newIssue = {
      id: vulnerabilidades.length + 1,
      titulo: 'CVE-2024-9999 - Remote Code Execution',
      severidade: 'Crítico',
      status: 'Aberto',
      asset: 'SRV-API-02',
      data: '2024-01-18',
      score: 9.2,
    };

    setVulnerabilidades((prev) => [newIssue, ...prev]);
    setScanMessage('Escaneamento concluído com sucesso! Vulnerabilidades atualizadas.');
    setScanResult(`1 nova vulnerabilidade detectada em ${newIssue.asset}`);
    setIsScanning(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setSelectedSeverity('All');
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
      <div className="space-y-6">
        {/* Header */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vulnerabilidades
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie vulnerabilidades da sua infraestrutura
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className="w-5 h-5" />
              {isScanning ? 'Escaneando...' : 'Escanear'}
            </button>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Último escaneamento</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{scanResult}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Total de vulnerabilidades</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{totalVulnerabilidades}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Em aberto</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{openVulnerabilidades}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <BoltIcon className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Críticas</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{criticalVulnerabilidades}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Risco médio</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{averageRisk}</p>
              </div>
            </div>
          </div>
        </div>

        {isScanning && (
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
              <span>{scanMessage}</span>
              <span className="font-semibold">{scanProgress}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar vulnerabilidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Aberto', 'Em andamento', 'Pendente', 'Mitigado'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status as any)}
              className={`px-3 py-2 rounded-full text-sm transition ${selectedStatus === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Crítico', 'Alto', 'Médio', 'Baixo'].map((severity) => (
            <button
              key={severity}
              onClick={() => setSelectedSeverity(severity as any)}
              className={`px-3 py-2 rounded-full text-sm transition ${selectedSeverity === severity ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              {severity}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vulnerabilidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Severidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Score CVSS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVulnerabilidades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma vulnerabilidade encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredVulnerabilidades.map((vuln) => (
                    <tr
                      key={vuln.id}
                      onClick={() => setSelectedVulnerability(vuln)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedVulnerability(vuln);
                        }
                      }}
                      tabIndex={0}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{vuln.titulo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeveridadeColor(vuln.severidade)}`}>
                          {vuln.severidade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(vuln.status)}`}>
                          {vuln.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {vuln.asset}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {vuln.score}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                        {vuln.data}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedVulnerability && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedVulnerability(null)}
            role="presentation"
          >
            <div
              ref={modalRef}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={trapFocus}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vulnerability-detail-title"
              aria-describedby="vulnerability-detail-description"
              tabIndex={-1}
              className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 id="vulnerability-detail-title" className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes da Vulnerabilidade</h2>
                  <p id="vulnerability-detail-description" className="text-sm text-gray-500 dark:text-gray-400">Clique fora ou use o botão para fechar.</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setSelectedVulnerability(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Título</span>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{selectedVulnerability.titulo}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Severidade</p>
                    <p className={`mt-2 font-semibold text-sm ${getSeveridadeColor(selectedVulnerability.severidade)}`}>
                      {selectedVulnerability.severidade}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Status</p>
                    <p className={`mt-2 font-semibold text-sm ${getStatusColor(selectedVulnerability.status)}`}>
                      {selectedVulnerability.status}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Score CVSS</p>
                    <p className="mt-2 font-semibold text-sm text-gray-900 dark:text-white">{selectedVulnerability.score}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Ativo</p>
                    <p className="mt-2 text-sm text-gray-900 dark:text-white">{selectedVulnerability.asset}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Data de identificação</p>
                    <p className="mt-2 text-sm text-gray-900 dark:text-white">{selectedVulnerability.data}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Descrição</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                    Esta vulnerabilidade representa um problema crítico que pode permitir execução remota de código, perda de confidencialidade e interrupção de serviços.
                    Recomenda-se priorizar correção e mitigação imediatamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
