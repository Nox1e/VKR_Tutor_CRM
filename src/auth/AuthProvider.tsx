import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { authStore, type AuthUser } from './auth-store';
import {
  bootstrapSession,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from './auth-api';
import { setOnUnauthenticated } from '@/api/client';

type BootStatus = 'loading' | 'ready';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  bootStatus: BootStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const subscribe = (cb: () => void) => authStore.subscribe(cb);
const getSnapshot = () => authStore.getState();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [bootStatus, setBootStatus] = useState<BootStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    bootstrapSession().finally(() => {
      if (!cancelled) setBootStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOnUnauthenticated(() => {
      authStore.clear();
    });
    return () => setOnUnauthenticated(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: state.user !== null && state.accessToken !== null,
      bootStatus,
      login: async (email, password) => {
        await apiLogin(email, password);
      },
      register: async (email, password, inviteCode) => {
        await apiRegister(email, password, inviteCode);
      },
      logout: async () => {
        await apiLogout();
      },
    }),
    [state, bootStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used внутри <AuthProvider>');
  }
  return ctx;
};
