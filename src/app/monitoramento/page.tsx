'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { 
  ChartBarIcon, 
  ServerIcon,
  ComputerDesktopIcon,
  CloudIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dados mockados
const cpuData = [
  { time: '00:00', cpu: 45, memory: 60 },
  { time: '04:00', cpu: 30, memory: 55 },
  { time: '08:00', cpu: 75, memory: 70 },
  { time: '12:00', cpu: 85, memory: 80 },
  { time: '16:00', cpu: 65, memory: 65 },
  { time: '20:00', cpu: 50, memory: 58 },
  { time: '23:00', cpu: 40, memory: 50 },
];

const servers = [
  { name: 'SRV-PRODUCAO-01', status: 'online', cpu: 45, memory: 60, disk: 72, uptime: '15d 4h' },
  { name: 'SRV-D6-01', status: 'online', cpu: 30, memory: 55, disk: 45, uptime: '8d 2h' },
  { name: 'FIREWALL-01', status: 'online', cpu: 15, memory: 40, disk: 30, uptime: '30d 12h' },
  { name: 'SRV-WEB-01', status: 'warning', cpu: 85, memory: 80, disk: 90, uptime: '2d 5h' },
  { name: 'DATABASE-01', status: 'online', cpu: 55, memory: 70, disk: 65, uptime: '22d 8h' },
];

export default function MonitoramentoPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Monitoramento
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitore a saúde da sua infraestrutura em tempo real
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Servidores</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
            <p className="text-xs text-green-600 dark:text-green-400">10 online</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">CPU Média</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">42%</p>
            <p className="text-xs text-green-600 dark:text-green-400">↓ 5% esta hora</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Disco Média</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">58%</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">↑ 8% esta hora</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">99.97%</p>
            <p className="text-xs text-green-600 dark:text-green-400">30 dias</p>
          </div>
        </div>

        {/* CPU/Memory Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            CPU e Memória
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuData}>
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
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Servers Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Status dos Servidores
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {servers.map((server) => (
              <div key={server.name} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  {server.status === 'online' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : server.status === 'warning' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">{server.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    CPU: <span className="font-medium text-gray-900 dark:text-white">{server.cpu}%</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Mem: <span className="font-medium text-gray-900 dark:text-white">{server.memory}%</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Disk: <span className="font-medium text-gray-900 dark:text-white">{server.disk}%</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {server.uptime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
