import { z } from 'zod';
import { apiClient } from './client';
import {
  trialResultDtoSchema,
  enrichedTrialResultDtoSchema,
  type TrialResultDto,
  type EnrichedTrialResultDto,
} from '@shared/api/contracts';
import { transformToApi } from './mappers';

const trialResultsArraySchema = z.array(trialResultDtoSchema);
const enrichedTrialResultsArraySchema = z.array(enrichedTrialResultDtoSchema);

export interface CreateTrialResultInput {
  studentTrialId: string;
  taskScores: number[];
  primaryScore: number;
  secondaryScore: number;
}

export interface UpdateTrialResultInput {
  taskScores: number[];
  primaryScore: number;
  secondaryScore: number;
}

export const trialResultsApi = {
  getByStudentTrial: async (studentTrialId: string) => {
    const results = await apiClient.get<TrialResultDto[]>(
      `/trial-results?studentTrialId=${encodeURIComponent(studentTrialId)}`,
      trialResultsArraySchema,
    );
    return results.length > 0 ? results[0] : null;
  },

  getEnriched: (studentId?: string) => {
    const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    return apiClient.get<EnrichedTrialResultDto[]>(
      `/trial-results${qs}`,
      enrichedTrialResultsArraySchema,
    );
  },

  create: (payload: CreateTrialResultInput) =>
    apiClient.post<TrialResultDto, ReturnType<typeof transformToApi.trialResult>>(
      '/trial-results',
      transformToApi.trialResult(payload),
      trialResultDtoSchema,
    ),

  update: (id: string, payload: UpdateTrialResultInput) =>
    apiClient.put<TrialResultDto, ReturnType<typeof transformToApi.trialResult>>(
      `/trial-results/${id}`,
      transformToApi.trialResult(payload),
      trialResultDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/trial-results/${id}`),
};
