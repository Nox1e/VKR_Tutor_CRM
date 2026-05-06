import { z } from 'zod';
import { apiClient } from './client';
import { trialDtoSchema, type TrialDto } from '@shared/api/contracts';

const trialsArraySchema = z.array(trialDtoSchema);

export interface TrialPayload {
  orderNumber: number;
  difficultyLevel: 'easy' | 'ege' | 'advanced';
  title: string;
  link: string;
  tagIds?: string[];
}

export type UpdateTrialPayload = Partial<TrialPayload> & Record<string, unknown>;

const buildQuery = (filter?: { tagIds?: string[] }) => {
  if (!filter?.tagIds || filter.tagIds.length === 0) return '';
  return `?tagIds=${filter.tagIds.map(encodeURIComponent).join(',')}`;
};

export const trialsApi = {
  getAll: (filter?: { tagIds?: string[] }) =>
    apiClient.get<TrialDto[]>(`/trials${buildQuery(filter)}`, trialsArraySchema),

  create: (payload: TrialPayload) =>
    apiClient.post<TrialDto, TrialPayload>('/trials', payload, trialDtoSchema),

  update: (id: string, payload: UpdateTrialPayload) =>
    apiClient.put<TrialDto, UpdateTrialPayload>(`/trials/${id}`, payload, trialDtoSchema),

  delete: (id: string) => apiClient.delete<unknown>(`/trials/${id}`),
};
