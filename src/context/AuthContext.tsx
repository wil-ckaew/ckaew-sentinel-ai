'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação no cliente
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (e) {
          console.error('Erro ao parsear user data');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simular login - em produção, chamar a API
    if (username === 'admin' && password === 'admin123') {
      const userData: User = { 
        id: '1', 
        username: 'admin', 
        role: 'Administrador' 
      };
      localStorage.setItem('auth_token', 'fake-token-123');
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Limpar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
