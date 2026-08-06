'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  ServerIcon, 
  ShieldCheckIcon, 
  BellIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BeakerIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Incidentes', href: '/incidentes', icon: ExclamationTriangleIcon },
  { name: 'Ativos', href: '/ativos', icon: ServerIcon },
  { name: 'Vulnerabilidades', href: '/vulnerabilidades', icon: ShieldCheckIcon },
  { name: 'Monitoramento', href: '/monitoramento', icon: ComputerDesktopIcon },
  { name: 'Relatórios', href: '/relatorios', icon: DocumentTextIcon },
  { name: 'IA Analyst', href: '/ai', icon: CpuChipIcon },
  { name: 'Configurações', href: '/configuracoes', icon: Cog6ToothIcon },
  { name: 'Simulação', href: '/simulacao', icon: BeakerIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('Admin');
  const [userRole, setUserRole] = useState('Security Analyst');

  useEffect(() => {
    if (user) {
      setUsername(user.username || 'Admin');
      setUserRole(user.role || 'Security Analyst');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <Logo />
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userRole}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
