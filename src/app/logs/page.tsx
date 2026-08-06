'use client';

import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';

export default function LogsPage() {
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) window.location.href = '/login';
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Segurança</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Visualização de logs</p>
      </div>
    </Layout>
  );
}
