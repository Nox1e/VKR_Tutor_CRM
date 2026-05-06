import { z } from 'zod';
import { apiClient } from './client';

export const trajectoryItemDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  studentId: z.string(),
  preparationId: z.string(),
  homeworkId: z.string().nullable().optional(),
  position: z.number(),
  status: z.enum(['queued', 'assigned', 'consumed', 'skipped']),
  assignedToLessonId: z.string().nullable().optional(),
  assignedAt: z.union([z.string(), z.date()]).nullable().optional(),
  consumedAt: z.union([z.string(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  preparationTitle: z.string().nullable().optional(),
  preparationTaskNumber: z.string().nullable().optional(),
  preparationMethod: z.string().nullable().optional(),
  homeworkTitle: z.string().nullable().optional(),
});

export type TrajectoryItemDto = z.infer<typeof trajectoryItemDtoSchema>;

const trajectoryArraySchema = z.array(trajectoryItemDtoSchema);

const completeLessonResponseSchema = z.object({
  lesson: z.record(z.unknown()),
  template: z.record(z.unknown()).nullable(),
  refilled: z.record(z.unknown()).nullable(),
});

export type CompleteLessonResponse = z.infer<typeof completeLessonResponseSchema>;

const applyNextResponseSchema = z.object({
  appliedItem: z.unknown().nullable().optional(),
});

export type ApplyNextResponse = z.infer<typeof applyNextResponseSchema>;

export type ApplyNextTarget = { type: 'lesson' | 'scheduled'; id: string };

export const trajectoryApi = {
  getByStudent: (studentId: string) =>
    apiClient.get<TrajectoryItemDto[]>(
      `/students/${studentId}/trajectory`,
      trajectoryArraySchema,
    ),

  addItem: (studentId: string, payload: { preparationId: string; homeworkId?: string | null }) =>
    apiClient.post<TrajectoryItemDto, Record<string, unknown>>(
      `/students/${studentId}/trajectory`,
      payload as Record<string, unknown>,
      trajectoryItemDtoSchema,
    ),

  addItems: (studentId: string, items: Array<{ preparationId: string; homeworkId?: string | null }>) =>
    apiClient.post<TrajectoryItemDto[], Record<string, unknown>>(
      `/students/${studentId}/trajectory/batch`,
      { items } as Record<string, unknown>,
      trajectoryArraySchema,
    ),

  reorder: (studentId: string, orderedIds: string[]) =>
    apiClient.put<TrajectoryItemDto[], Record<string, unknown>>(
      `/students/${studentId}/trajectory/reorder`,
      { orderedIds } as Record<string, unknown>,
      trajectoryArraySchema,
    ),

  skip: (studentId: string, itemId: string) =>
    apiClient.post<TrajectoryItemDto[], Record<string, unknown>>(
      `/students/${studentId}/trajectory/${itemId}/skip`,
      {} as Record<string, unknown>,
      trajectoryArraySchema,
    ),

  remove: (studentId: string, itemId: string) =>
    apiClient.delete<unknown>(`/students/${studentId}/trajectory/${itemId}`),

  applyNext: (studentId: string, target: ApplyNextTarget) =>
    apiClient.post<ApplyNextResponse, Record<string, unknown>>(
      `/students/${studentId}/trajectory/apply-next`,
      { target } as Record<string, unknown>,
      applyNextResponseSchema,
    ),

  completeLesson: (lessonId: string) =>
    apiClient.post<CompleteLessonResponse, Record<string, unknown>>(
      `/lessons/${lessonId}/complete`,
      {} as Record<string, unknown>,
      completeLessonResponseSchema,
    ),
};
