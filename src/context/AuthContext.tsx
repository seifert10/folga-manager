import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  role: UserRole | null;
  departments: { id: number; name: string }[];
  departmentScopeText: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('folga_manager_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validação da sessão no carregamento inicial
  useEffect(() => {
    async function checkAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
        localStorage.setItem('folga_manager_user', JSON.stringify(res.user));
      } catch {
        // Se o token estiver expirado ou inválido, limpa sessão
        setUser(null);
        setStoredToken(null);
        localStorage.removeItem('folga_manager_user');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // Listener para quando o backend retornar 401 Unauthorized
    const handleUnauthorized = () => {
      setUser(null);
      setStoredToken(null);
      localStorage.removeItem('folga_manager_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('folga_manager_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignora erro
    } finally {
      setUser(null);
      setToken(null);
      setStoredToken(null);
      localStorage.removeItem('folga_manager_user');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isViewer = user?.role === 'VIEWER';
  const departments = user?.departments || [];

  const departmentScopeText = isAdmin
    ? 'Acesso global'
    : departments.length > 0
    ? departments.map(d => d.name).join(' · ')
    : 'Sem setor';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdmin,
        isManager,
        isViewer,
        role: user?.role || null,
        departments,
        departmentScopeText,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
