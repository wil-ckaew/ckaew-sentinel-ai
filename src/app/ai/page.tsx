'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { 
  CpuChipIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const aiInsights = [
  {
    title: 'Análise de Comportamento',
    description: 'Padrão anômalo detectado no acesso de usuários',
    severity: 'Alto',
    time: '10:30',
    status: 'Investigando'
  },
  {
    title: 'Detecção de Malware',
    description: 'Arquivo suspeito identificado em SRV-WEB-01',
    severity: 'Crítico',
    time: '09:45',
    status: 'Em andamento'
  },
  {
    title: 'Predição de Ataque',
    description: 'Alta probabilidade de ataque DDoS identificada',
    severity: 'Médio',
    time: '08:20',
    status: 'Monitorando'
  }
];

export default function AIPage() {
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
            IA Analyst
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Análise inteligente com Inteligência Artificial
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anomalias Detectadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
              </div>
              <div className="p-3 bg-red-500 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Precisão do Modelo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">97%</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Análise</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2.4s</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Insights de IA
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {aiInsights.map((insight, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      insight.severity === 'Crítico' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : insight.severity === 'Alto'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {insight.severity}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.time}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Status: {insight.status}
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
