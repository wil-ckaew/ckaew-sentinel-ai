'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se está no navegador
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('auth_token');
    const isLoginPage = pathname === '/login';
    
    // Se não tem token e não está na página de login, redirecionar
    if (!token && !isLoginPage) {
      router.push('/login');
      setLoading(false);
      return;
    }
    
    // Se tem token e está na página de login, redirecionar para dashboard
    if (token && isLoginPage) {
      router.push('/');
      setLoading(false);
      return;
    }
    
    setIsAuthenticated(!!token);
    setLoading(false);
  }, [pathname, router]);

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  // Se estiver na página de login ou autenticado, mostrar children
  if (pathname === '/login' || isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}
