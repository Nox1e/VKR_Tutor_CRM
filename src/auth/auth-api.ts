import { API_BASE_URL } from '@/config';
import { ApiError, apiClient, refreshSession } from '@/api/client';
import { authStore, type AuthUser } from './auth-store';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const login = async (email: string, password: string): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Не удалось войти', response.status, payload);
  }

  const data = (await response.json()) as AuthResponse;
  authStore.setAuth(data.user, data.accessToken);
  return data.user;
};

export const register = async (
  email: string,
  password: string,
  inviteCode: string,
): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, inviteCode }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Не удалось зарегистрироваться', response.status, payload);
  }

  const data = (await response.json()) as AuthResponse;
  authStore.setAuth(data.user, data.accessToken);
  return data.user;
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post<void>('/auth/logout', undefined, undefined, { skipAuth: true });
  } catch {
    // ignore — we clear local state regardless
  }
  authStore.clear();
};

export const bootstrapSession = async (): Promise<boolean> => refreshSession();
