'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { assets } from '@/lib/api';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  ServerIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function AtivosPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [ativos, setAtivos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAtivos();
    }
  }, [isAuthenticated]);

  const fetchAtivos = async () => {
    try {
      setIsLoading(true);
      const response = await assets.list({ limit: 100 });
      setAtivos(response.data.assets || []);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
      toast.error('Erro ao carregar ativos');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'compromised': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'decommissioned': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status?.toLowerCase()] || colors['active'];
  };

  const getCriticidadeColor = (criticidade: string) => {
    const colors: any = {
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return colors[criticidade?.toLowerCase()] || colors['low'];
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredAtivos = ativos.filter((ativo: any) => {
    const matchSearch = ativo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ativo.ip_address?.includes(searchTerm);
    const matchStatus = filterStatus === 'Todos' || 
                       ativo.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ativos</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie todos os ativos da sua infraestrutura
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Ativo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ativos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="Todos">Todos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="maintenance">Manutenção</option>
            <option value="compromised">Comprometido</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAtivos.map((ativo: any) => (
            <div key={ativo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <ServerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{ativo.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ativo.asset_type} • {ativo.ip_address}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ativo.status)}`}>
                  {ativo.status}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCriticidadeColor(ativo.criticality)}`}>
                  {ativo.criticality}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>📍 {ativo.location || 'N/A'}</span>
                <span>{ativo.department || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
