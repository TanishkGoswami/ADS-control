import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, getCurrentUserApi, loginApi } from '../../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) { if (active) setIsLoading(false); return; }
      try {
        const currentUser = await getCurrentUserApi();
        if (active) { setToken(savedToken); setUser(currentUser); localStorage.setItem('auth_user', JSON.stringify(currentUser)); }
      } catch {
        if (active) { setToken(null); setUser(null); localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); }
      } finally { if (active) setIsLoading(false); }
    };
    const unauthorized = () => { setToken(null); setUser(null); };
    window.addEventListener('auth:unauthorized', unauthorized);
    void restore();
    return () => { active = false; window.removeEventListener('auth:unauthorized', unauthorized); };
  }, []);

  const login = async (emailOrUsername: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ emailOrUsername, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
