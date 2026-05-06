import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import { useApiMutation } from '@/api/factory';

export const notificationKeys = {
  all: ['notifications'] as const,
};

// Refetch every 60s while the tab is focused, and on focus regain — keeps
// the bell badge fresh without hammering the server.
const REFETCH_INTERVAL_MS = 60_000;

export const useNotifications = () => {
  const query = useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.getAll,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((n) => !n.readAt).length,
    [query.data],
  );

  return { ...query, unreadCount };
};

export const useMarkNotificationRead = () =>
  useApiMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    invalidateQueries: [notificationKeys.all],
    successToast: false,
    errorToast: { title: 'Не удалось отметить уведомление' },
  });

export const useMarkAllNotificationsRead = () =>
  useApiMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    invalidateQueries: [notificationKeys.all],
    successToast: false,
    errorToast: { title: 'Не удалось отметить уведомления' },
  });
