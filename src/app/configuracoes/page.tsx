'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { 
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  ServerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const settingsGroups = [
  {
    title: 'Preferências Gerais',
    icon: GlobeAltIcon,
    settings: [
      { label: 'Idioma', value: 'Português' },
      { label: 'Timezone', value: 'America/Sao_Paulo' },
      { label: 'Formato de Data', value: 'DD/MM/YYYY' },
    ]
  },
  {
    title: 'Notificações',
    icon: BellIcon,
    settings: [
      { label: 'Alertas por Email', value: 'Habilitado' },
      { label: 'Notificações Push', value: 'Habilitado' },
      { label: 'Relatórios Diários', value: 'Desabilitado' },
    ]
  },
  {
    title: 'Segurança',
    icon: ShieldCheckIcon,
    settings: [
      { label: 'Autenticação 2FA', value: 'Desabilitado' },
      { label: 'Política de Senhas', value: 'Forte' },
      { label: 'Sessão Expira em', value: '24 horas' },
    ]
  },
  {
    title: 'Integrações',
    icon: ServerIcon,
    settings: [
      { label: 'SIEM', value: 'Configurado' },
      { label: 'EDR', value: 'Configurado' },
      { label: 'SOAR', value: 'Pendente' },
    ]
  },
];

export default function ConfiguracoesPage() {
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
            Configurações
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie as configurações do sistema
          </p>
        </div>

        {/* Settings Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {group.settings.map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {setting.label}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {setting.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </Layout>
  );
}
