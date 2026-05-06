import { z } from 'zod';
import { apiClient } from './client';
import { preparationDtoSchema, type PreparationDto } from '@shared/api/contracts';

const preparationsArraySchema = z.array(preparationDtoSchema);

export interface PreparationPayload {
  taskNumber: string;
  method: 'program' | 'analytics' | 'excel';
  title: string;
  message: string;
  tagIds?: string[];
}

export type UpdatePreparationPayload = Partial<PreparationPayload> & Record<string, unknown>;

const buildQuery = (filter?: { tagIds?: string[] }) => {
  if (!filter?.tagIds || filter.tagIds.length === 0) return '';
  return `?tagIds=${filter.tagIds.map(encodeURIComponent).join(',')}`;
};

export const preparationsApi = {
  getAll: (filter?: { tagIds?: string[] }) =>
    apiClient.get<PreparationDto[]>(`/preparations${buildQuery(filter)}`, preparationsArraySchema),

  create: (payload: PreparationPayload) =>
    apiClient.post<PreparationDto, PreparationPayload>('/preparations', payload, preparationDtoSchema),

  update: (id: string, payload: UpdatePreparationPayload) =>
    apiClient.put<PreparationDto, UpdatePreparationPayload>(
      `/preparations/${id}`,
      payload,
      preparationDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/preparations/${id}`),
};
