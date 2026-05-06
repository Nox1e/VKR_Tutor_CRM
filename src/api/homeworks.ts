import { z } from 'zod';
import { apiClient } from './client';
import { homeworkDtoSchema, type HomeworkDto } from '@shared/api/contracts';

const homeworksArraySchema = z.array(homeworkDtoSchema);

export interface HomeworkInput {
  taskNumber: string;
  title: string;
  link?: string | null;
  tagIds?: string[];
}

export type UpdateHomeworkInput = Partial<HomeworkInput>;

type HomeworkApiPayload = {
  taskNumber?: string | null;
  title?: string | null;
  link?: string | null;
  tagIds?: string[];
};

const mapCreateHomeworkPayload = (payload: HomeworkInput): HomeworkApiPayload => ({
  taskNumber: payload.taskNumber,
  title: payload.title,
  link: payload.link ?? null,
  ...(payload.tagIds !== undefined ? { tagIds: payload.tagIds } : {}),
});

const mapUpdateHomeworkPayload = (payload: UpdateHomeworkInput): HomeworkApiPayload => {
  const result: HomeworkApiPayload = {};
  if (payload.taskNumber !== undefined) result.taskNumber = payload.taskNumber;
  if (payload.title !== undefined) result.title = payload.title;
  if ('link' in payload) result.link = payload.link ?? null;
  if (payload.tagIds !== undefined) result.tagIds = payload.tagIds;
  return result;
};

const buildQuery = (filter?: { tagIds?: string[] }) => {
  if (!filter?.tagIds || filter.tagIds.length === 0) return '';
  return `?tagIds=${filter.tagIds.map(encodeURIComponent).join(',')}`;
};

export const homeworksApi = {
  getAll: (filter?: { tagIds?: string[] }) =>
    apiClient.get<HomeworkDto[]>(`/homeworks${buildQuery(filter)}`, homeworksArraySchema),

  create: (payload: HomeworkInput) =>
    apiClient.post<HomeworkDto, HomeworkApiPayload>(
      '/homeworks',
      mapCreateHomeworkPayload(payload),
      homeworkDtoSchema,
    ),

  update: (id: string, payload: UpdateHomeworkInput) =>
    apiClient.put<HomeworkDto, HomeworkApiPayload>(
      `/homeworks/${id}`,
      mapUpdateHomeworkPayload(payload),
      homeworkDtoSchema,
    ),

  delete: (id: string) => apiClient.delete<unknown>(`/homeworks/${id}`),
};
