import { z } from 'zod';
import { apiClient } from './client';
import { lessonDtoSchema, intervalDtoSchema, type LessonDto, type IntervalDto } from '@shared/api/contracts';

const lessonsArraySchema = z.array(lessonDtoSchema);
const intervalsArraySchema = z.array(intervalDtoSchema);

export interface CreateLessonPayload {
  studentId: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  comment?: string;
  isScheduled?: boolean;
  preparationId?: string | null;
  homeworkId?: string | null;
  isPaid?: boolean;
}

export type UpdateLessonPayload = Partial<Record<string, unknown>>;

export interface CreateIntervalPayload {
  startTime: string;
  endTime?: string;
}

export interface StudentLessonsQueryParams {
  limit?: number;
  offset?: number;
  status?: 'planned' | 'active' | 'completed' | 'archived';
}

const buildStudentLessonsPath = (studentId: string, params?: StudentLessonsQueryParams) => {
  if (!params) {
    return `/students/${studentId}/lessons`;
  }

  const searchParams = new URLSearchParams();

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset));
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  const query = searchParams.toString();

  return query ? `/students/${studentId}/lessons?${query}` : `/students/${studentId}/lessons`;
};

export const lessonsApi = {
  getAll: () => apiClient.get<LessonDto[]>('/lessons', lessonsArraySchema),

  getByStudent: (studentId: string, params?: StudentLessonsQueryParams) =>
    apiClient.get<LessonDto[]>(buildStudentLessonsPath(studentId, params), lessonsArraySchema),

  create: (payload: CreateLessonPayload) =>
    apiClient.post<LessonDto, CreateLessonPayload>('/lessons', payload, lessonDtoSchema),

  update: (id: string, payload: UpdateLessonPayload) =>
    apiClient.put<LessonDto, UpdateLessonPayload>(`/lessons/${id}`, payload, lessonDtoSchema),

  assignPreparation: (id: string, preparationId: string | null) =>
    apiClient.put<LessonDto, { preparationId: string | null }>(
      `/lessons/${id}`,
      { preparationId },
      lessonDtoSchema,
    ),

  assignHomework: (id: string, homeworkId: string | null) =>
    apiClient.put<LessonDto, { homeworkId: string | null }>(
      `/lessons/${id}`,
      { homeworkId },
      lessonDtoSchema,
    ),

  togglePayment: (id: string, isPaid: boolean) =>
    apiClient.put<LessonDto, { isPaid: boolean }>(
      `/lessons/${id}`,
      { isPaid },
      lessonDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/lessons/${id}`),

  getIntervals: (lessonId: string) =>
    apiClient.get<IntervalDto[]>(`/lessons/${lessonId}/intervals`, intervalsArraySchema),

  createInterval: (lessonId: string, payload: CreateIntervalPayload) =>
    apiClient.post<IntervalDto, CreateIntervalPayload>(
      `/lessons/${lessonId}/intervals`,
      payload,
      intervalDtoSchema,
    ),

  updateInterval: (intervalId: string, payload: CreateIntervalPayload) =>
    apiClient.put<IntervalDto, CreateIntervalPayload>(
      `/intervals/${intervalId}`,
      payload,
      intervalDtoSchema,
    ),

  deleteInterval: (intervalId: string) => apiClient.delete<unknown>(`/intervals/${intervalId}`),
};
