import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import { clearToken, getToken, setToken } from '@/services/apiClient';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session from the stored token on first load.
  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    authService
      .verifySession()
      .then((verified) => {
        if (alive) setUser(verified);
      })
      .catch(() => {
        if (alive) {
          clearToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (alive) setInitializing(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember = true): Promise<User> => {
    const session = await authService.login(email, password);
    setToken(session.token, remember);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, logout, updateProfile }),
    [user, initializing, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
