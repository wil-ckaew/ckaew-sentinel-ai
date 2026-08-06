'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Alert {
  id: string;
  title: string;
  priority: string;
  status: string;
  source_ip: string;
  created_at: string;
}

const mockIncidentes: Alert[] = [
  {
    id: '1',
    title: 'Tentativa de Força Bruta',
    priority: 'critical',
    status: 'new',
    source_ip: '192.168.1.45',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Login Suspeito',
    priority: 'high',
    status: 'investigating',
    source_ip: '10.0.1.100',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Escaneamento de Portas',
    priority: 'medium',
    status: 'new',
    source_ip: '10.0.0.55',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Arquivo Malicioso Detectado',
    priority: 'critical',
    status: 'new',
    source_ip: 'DESKTOP-7GHAB2',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Acesso fora do padrão',
    priority: 'high',
    status: 'investigating',
    source_ip: 'usuario@empresa.com',
    created_at: new Date().toISOString()
  }
];

export default function IncidentesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [incidentes, setIncidentes] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidentes();
    }
  }, [isAuthenticated]);

  const fetchIncidentes = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/alerts', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setIncidentes(data.alerts);
        } else {
          setIncidentes(mockIncidentes);
          toast('Usando dados de demonstração', { icon: '📊' });
        }
      } else {
        setIncidentes(mockIncidentes);
        toast('Usando dados de demonstração', { icon: '📊' });
      }
    } catch (error) {
      console.error('Erro ao carregar incidentes:', error);
      setIncidentes(mockIncidentes);
      toast.error('Erro ao carregar incidentes, usando dados de demonstração');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return colors[priority?.toLowerCase()] || colors['low'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'investigating': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'escalated': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'false_positive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status?.toLowerCase()] || colors['new'];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando incidentes...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredIncidentes = incidentes.filter((incidente) => {
    const matchSearch = incidente.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       incidente.source_ip?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPriority = filterPriority === 'Todos' || 
                         incidente.priority?.toLowerCase() === filterPriority.toLowerCase();
    return matchSearch && matchPriority;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Incidentes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie e acompanhe todos os incidentes de segurança
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Novo Incidente
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar incidentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Todos">Todos</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Médio</option>
              <option value="low">Baixo</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IP/Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIncidentes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Nenhum incidente encontrado
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIncidentes.map((incidente) => (
                    <tr key={incidente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {incidente.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(incidente.priority)}`}>
                          {incidente.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incidente.status)}`}>
                          {incidente.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {incidente.source_ip || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                        {new Date(incidente.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
