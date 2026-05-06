import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import AppSuspenseFallback from '@/components/AppSuspenseFallback';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, bootStatus } = useAuth();
  const location = useLocation();

  if (bootStatus === 'loading') {
    return <AppSuspenseFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
