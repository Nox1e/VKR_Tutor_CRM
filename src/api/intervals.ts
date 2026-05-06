import { z } from 'zod';
import { apiClient } from './client';
import { intervalDtoSchema, type IntervalDto } from '@shared/api/contracts';

const intervalsArraySchema = z.array(intervalDtoSchema);

export interface IntervalPayload {
  startTime: string;
  endTime?: string;
}

export const intervalsApi = {
  getByLesson: (lessonId: string) =>
    apiClient.get<IntervalDto[]>(`/lessons/${lessonId}/intervals`, intervalsArraySchema),

  create: (lessonId: string, payload: IntervalPayload) =>
    apiClient.post<IntervalDto, IntervalPayload>(
      `/lessons/${lessonId}/intervals`,
      payload,
      intervalDtoSchema,
    ),

  update: (intervalId: string, payload: IntervalPayload) =>
    apiClient.put<IntervalDto, IntervalPayload>(`/intervals/${intervalId}`, payload, intervalDtoSchema),

  delete: (intervalId: string) => apiClient.delete<unknown>(`/intervals/${intervalId}`),
};
