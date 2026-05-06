import { z } from 'zod';
import { apiClient } from './client';
import { paymentHistoryDtoSchema, type PaymentHistoryDto } from '@shared/api/contracts';

const paymentHistoryArraySchema = z.array(paymentHistoryDtoSchema);

export const paymentHistoryApi = {
  getAll: () => apiClient.get<PaymentHistoryDto[]>('/payment-history', paymentHistoryArraySchema),

  delete: (id: string) => apiClient.delete<unknown>(`/payment-history/${id}`),
};
