import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import AlertSystem from '@/components/ui/AlertSystem';
import AudioManager from '@/components/ui/AudioManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CKAEW Sentinel AI - Segurança Cibernética',
  description: 'Sistema de Segurança Cibernética com Inteligência Artificial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AlertSystem />
          <AudioManager />
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
