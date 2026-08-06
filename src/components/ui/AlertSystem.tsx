'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Alert {
  id: string;
  title: string;
  priority: string;
  status: string;
  source_ip: string;
  created_at: string;
}

export default function AlertSystem() {
  const { isAuthenticated } = useAuth();
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:8080/api/alerts', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            const newAlerts = data.alerts;
            
            if (newAlerts.length > lastAlertCount && lastAlertCount > 0) {
              const latestAlert = newAlerts[newAlerts.length - 1];
              setCurrentAlert(latestAlert);
              setShowAlert(true);
              
              // Tocar som de alerta
              if (typeof window !== 'undefined' && (window as any).playAlertSound) {
                try {
                  (window as any).playAlertSound();
                } catch (e) {
                  console.error('Erro ao tocar som:', e);
                }
              }
              
              flashScreen();
              showNotification(latestAlert);
            }
            
            setAlerts(newAlerts);
            setLastAlertCount(newAlerts.length);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastAlertCount]);

  const flashScreen = () => {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.zIndex = '9999';
    flash.style.pointerEvents = 'none';
    flash.style.animation = 'flashEffect 1s ease-in-out';
    flash.style.animationIterationCount = '3';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flashEffect {
        0% { opacity: 0; }
        25% { opacity: 1; background-color: rgba(255, 0, 0, 0.5); }
        50% { opacity: 0; }
        75% { opacity: 1; background-color: rgba(255, 0, 0, 0.5); }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.remove();
      style.remove();
    }, 3000);
  };

  const showNotification = (alert: Alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 ALERTA DE SEGURANÇA!', {
        body: `${alert.title} - IP: ${alert.source_ip}`,
        icon: '🔴',
        tag: alert.id,
        requireInteraction: true,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const closeAlert = () => {
    setShowAlert(false);
    setCurrentAlert(null);
  };

  if (!isAuthenticated || !showAlert || !currentAlert) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'border-red-500 bg-red-50 dark:bg-red-900/20',
      'high': 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      'medium': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      'low': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    };
    return colors[priority?.toLowerCase()] || colors['medium'];
  };

  return (
    <div className="fixed top-4 right-4 z-[10000] max-w-md w-full animate-slideIn">
      <div className={`border-l-4 ${getPriorityColor(currentAlert.priority)} rounded-lg shadow-2xl p-6 bg-white dark:bg-gray-800`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-3xl animate-pulse">
              {currentAlert.priority === 'critical' ? '🔴' : '🟠'}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase animate-pulse">
                  🚨 ALERTA!
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(currentAlert.created_at).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                {currentAlert.title}
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Prioridade:</span>{' '}
                  <span className={`font-bold uppercase ${
                    currentAlert.priority === 'critical' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {currentAlert.priority}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">IP/Usuário:</span>{' '}
                  <span className="font-mono">{currentAlert.source_ip}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">{currentAlert.status}</span>
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={closeAlert}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  ✅ Confirmar
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={closeAlert}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
