import { z } from 'zod';
import { apiClient } from './client';
import { notificationDtoSchema, type NotificationDto } from '@shared/api/contracts';

const notificationsArraySchema = z.array(notificationDtoSchema);

export const notificationsApi = {
  getAll: () =>
    apiClient.get<NotificationDto[]>('/notifications', notificationsArraySchema),

  markRead: (id: string) =>
    apiClient.post<{ ok: boolean }>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.post<{ ok: boolean; count: number }>('/notifications/mark-all-read'),
};
