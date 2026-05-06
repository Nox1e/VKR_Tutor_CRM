import { z } from 'zod';
import { apiClient } from './client';
import { studentTrialDtoSchema, type StudentTrialDto } from '@shared/api/contracts';
import { transformToApi } from './mappers';

const studentTrialsArraySchema = z.array(studentTrialDtoSchema);

export interface CreateStudentTrialInput {
  studentId: string;
  trialId: string;
  deadline: Date;
  comment?: string;
  complications?: string;
}

export interface UpdateStudentTrialInput {
  trialId?: string;
  deadline?: Date;
  comment?: string | null;
  complications?: string | null;
  completedAt?: Date;
}

const mapUpdatePayload = (payload: UpdateStudentTrialInput) => {
  const update: Record<string, unknown> = {};
  if (payload.trialId) update.trialId = payload.trialId;
  if (payload.deadline) update.deadline = payload.deadline.toISOString();
  if (payload.comment !== undefined) update.comment = payload.comment;
  if (payload.complications !== undefined) update.complications = payload.complications;
  if (payload.completedAt) update.completedAt = payload.completedAt.toISOString();
  return update;
};

export const studentTrialsApi = {
  getAll: () => apiClient.get<StudentTrialDto[]>('/student-trials', studentTrialsArraySchema),

  getByStudent: (studentId: string) =>
    apiClient.get<StudentTrialDto[]>(
      `/student-trials?studentId=${encodeURIComponent(studentId)}`,
      studentTrialsArraySchema,
    ),

  create: (payload: CreateStudentTrialInput) =>
    apiClient.post<StudentTrialDto, ReturnType<typeof transformToApi.studentTrial>>(
      '/student-trials',
      transformToApi.studentTrial(payload),
      studentTrialDtoSchema,
    ),

  update: (id: string, payload: UpdateStudentTrialInput) =>
    apiClient.put<StudentTrialDto, Record<string, unknown>>(
      `/student-trials/${id}`,
      mapUpdatePayload(payload),
      studentTrialDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/student-trials/${id}`),

  markCompleted: (id: string) =>
    apiClient.post<StudentTrialDto>(`/student-trials/${id}/complete`, undefined, studentTrialDtoSchema),
};
