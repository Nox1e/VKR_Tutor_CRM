import { z } from 'zod';
import { apiClient } from './client';
import { scheduledLessonDtoSchema, type ScheduledLessonDto } from '@shared/api/contracts';

const scheduledLessonsArraySchema = z.array(scheduledLessonDtoSchema);

export interface CreateScheduledLessonPayload {
  studentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  meetLink?: string;
  comment?: string;
  preparationId?: string | null;
  homeworkId?: string | null;
}

export type UpdateScheduledLessonPayload = Partial<Record<string, unknown>>;

const buildStudentScheduledLessonsPath = (studentId: string) =>
  `/students/${studentId}/scheduled-lessons`;

export const scheduledLessonsApi = {
  getAll: () => apiClient.get<ScheduledLessonDto[]>('/scheduled-lessons', scheduledLessonsArraySchema),

  getByStudent: (studentId: string) =>
    apiClient.get<ScheduledLessonDto[]>(buildStudentScheduledLessonsPath(studentId), scheduledLessonsArraySchema),

  create: (payload: CreateScheduledLessonPayload) =>
    apiClient.post<ScheduledLessonDto, CreateScheduledLessonPayload>(
      '/scheduled-lessons',
      payload,
      scheduledLessonDtoSchema,
    ),

  update: (id: string, payload: UpdateScheduledLessonPayload) =>
    apiClient.put<ScheduledLessonDto, UpdateScheduledLessonPayload>(
      `/scheduled-lessons/${id}`,
      payload,
      scheduledLessonDtoSchema,
    ),

  assignPreparation: (id: string, preparationId: string | null) =>
    apiClient.put<ScheduledLessonDto, { preparationId: string | null }>(
      `/scheduled-lessons/${id}`,
      { preparationId },
      scheduledLessonDtoSchema,
    ),

  assignHomework: (id: string, homeworkId: string | null) =>
    apiClient.put<ScheduledLessonDto, { homeworkId: string | null }>(
      `/scheduled-lessons/${id}`,
      { homeworkId },
      scheduledLessonDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/scheduled-lessons/${id}`),
};
