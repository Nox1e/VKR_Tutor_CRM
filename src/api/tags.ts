import { z } from 'zod';
import { apiClient } from './client';
import { tagDtoSchema, type TagDto } from '@shared/api/contracts';

const tagsArraySchema = z.array(tagDtoSchema);

export interface TagPayload {
  name: string;
  color?: string | null;
}

export type UpdateTagPayload = Partial<TagPayload>;

const makeApi = (basePath: string) => ({
  getAll: () => apiClient.get<TagDto[]>(basePath, tagsArraySchema),
  create: (payload: TagPayload) =>
    apiClient.post<TagDto, TagPayload>(basePath, payload, tagDtoSchema),
  update: (id: string, payload: UpdateTagPayload) =>
    apiClient.put<TagDto, UpdateTagPayload>(`${basePath}/${id}`, payload, tagDtoSchema),
  delete: (id: string) => apiClient.delete<unknown>(`${basePath}/${id}`),
});

export const preparationTagsApi = makeApi('/preparation-tags');
export const homeworkTagsApi = makeApi('/homework-tags');
export const trialTagsApi = makeApi('/trial-tags');
