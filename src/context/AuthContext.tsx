'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { auth } from '@/lib/api';

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

  // Valida o JWT com o backend ao carregar a aplicação.
  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await auth.getMe();

        if (!active) return;

        const data = response.data;

        const userData: User = {
          id: String(data.user_id ?? data.id ?? ''),
          username: String(data.username ?? ''),
          role: String(data.role ?? ''),
        };

        if (!userData.username || !userData.id) {
          throw new Error('Resposta de autenticação inválida.');
        }

        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        if (!active) return;

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  // Usa o endpoint real de autenticação, sem credenciais simuladas.
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await auth.login(username.trim(), password);
      const data = response.data;

      if (
        !data ||
        typeof data.token !== 'string' ||
        !data.token ||
        !data.username ||
        !data.user_id
      ) {
        return false;
      }

      const userData: User = {
        id: String(data.user_id),
        username: String(data.username),
        role: String(data.role ?? ''),
      };

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
      }}
    >
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
