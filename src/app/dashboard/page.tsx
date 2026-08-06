'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import LogoutButton from '@/components/ui/LogoutButton';
import { assets, logs } from '@/lib/api';
import {
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [stats, setStats] = useState({
    total_assets: 0,
    active_assets: 0,
    critical_assets: 0,
    total_alerts: 0,
    critical_alerts: 0,
    total_logs_24h: 0,
    critical_logs: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const assetsRes = await assets.list({ limit: 100 });
      const assetsList = assetsRes.data.assets || [];
      setRecentAssets(assetsList.slice(0, 5));
      
      const logsRes = await logs.list({ limit: 50 });
      setRecentLogs(logsRes.data.logs || []);
      
      const statsRes = await logs.stats();
      
      setStats({
        total_assets: assetsRes.data.total || 0,
        active_assets: assetsList.filter((a: any) => a.status === 'active').length,
        critical_assets: assetsList.filter((a: any) => a.criticality === 'critical').length,
        total_alerts: 0,
        critical_alerts: 0,
        total_logs_24h: statsRes.data.total_logs_24h || 0,
        critical_logs: statsRes.data.critical || 0,
      });
      
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando dados...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const threatData = [
    { time: '00:00', threats: 12 },
    { time: '04:00', threats: 8 },
    { time: '08:00', threats: 25 },
    { time: '12:00', threats: 18 },
    { time: '16:00', threats: 32 },
    { time: '20:00', threats: 15 },
    { time: '23:00', threats: 10 },
  ];

  const riskData = [
    { name: 'Críticos', value: stats.critical_assets || 5, color: '#EF4444' },
    { name: 'Altos', value: 56, color: '#F59E0B' },
    { name: 'Médios', value: 312, color: '#3B82F6' },
    { name: 'Baixos', value: 1247, color: '#10B981' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header com botão de logout */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Olá, {user?.username || 'Admin'}! 👋
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aqui está o resumo da segurança da sua organização.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.role || 'Administrador'}
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_assets}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <ServerIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos Críticos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical_assets}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Logs (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_logs_24h}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Logs Críticos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical_logs}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-lg">
                <BellIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline de Eventos
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={threatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="threats" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribuição de Riscos
            </h2>
            <div className="flex items-center justify-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ativos Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ativos Recentes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Nome</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">IP</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tipo</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Criticidade</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset: any) => (
                  <tr key={asset.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{asset.name}</td>
                    <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{asset.ip_address}</td>
                    <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{asset.asset_type}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.criticality === 'critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {asset.criticality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Últimos Logs de Segurança
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Evento</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Severidade</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Mensagem</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{log.event_type}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        log.severity === 'error' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                        log.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{log.message}</td>
                    <td className="py-2 px-4 text-sm text-gray-500 dark:text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
