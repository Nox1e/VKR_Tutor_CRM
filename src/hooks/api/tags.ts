import { useQuery } from '@tanstack/react-query';
import {
  preparationTagsApi,
  homeworkTagsApi,
  trialTagsApi,
  type TagPayload,
  type UpdateTagPayload,
} from '@/api/tags';
import { useApiMutation } from '@/api/factory';

export const preparationTagKeys = { all: ['preparationTags'] as const };
export const homeworkTagKeys = { all: ['homeworkTags'] as const };
export const trialTagKeys = { all: ['trialTags'] as const };

// Cache invalidations also need to drop the entity lists, since their tag
// arrays may reference the changed/deleted tag.
const preparationListsKey = ['preparations'] as const;
const homeworkListsKey = ['homeworks'] as const;
const trialListsKey = ['trials'] as const;

export const usePreparationTags = () =>
  useQuery({ queryKey: preparationTagKeys.all, queryFn: preparationTagsApi.getAll });

export const useCreatePreparationTag = () =>
  useApiMutation({
    mutationFn: (payload: TagPayload) => preparationTagsApi.create(payload),
    invalidateQueries: [preparationTagKeys.all, preparationListsKey],
    successToast: { title: 'Тег создан' },
    errorToast: { title: 'Не удалось создать тег' },
  });

export const useUpdatePreparationTag = () =>
  useApiMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateTagPayload) =>
      preparationTagsApi.update(id, payload),
    invalidateQueries: [preparationTagKeys.all, preparationListsKey],
    successToast: { title: 'Тег обновлён' },
    errorToast: { title: 'Не удалось обновить тег' },
  });

export const useDeletePreparationTag = () =>
  useApiMutation({
    mutationFn: preparationTagsApi.delete,
    invalidateQueries: [preparationTagKeys.all, preparationListsKey],
    successToast: { title: 'Тег удалён' },
    errorToast: { title: 'Не удалось удалить тег' },
  });

export const useHomeworkTags = () =>
  useQuery({ queryKey: homeworkTagKeys.all, queryFn: homeworkTagsApi.getAll });

export const useCreateHomeworkTag = () =>
  useApiMutation({
    mutationFn: (payload: TagPayload) => homeworkTagsApi.create(payload),
    invalidateQueries: [homeworkTagKeys.all, homeworkListsKey],
    successToast: { title: 'Тег создан' },
    errorToast: { title: 'Не удалось создать тег' },
  });

export const useUpdateHomeworkTag = () =>
  useApiMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateTagPayload) =>
      homeworkTagsApi.update(id, payload),
    invalidateQueries: [homeworkTagKeys.all, homeworkListsKey],
    successToast: { title: 'Тег обновлён' },
    errorToast: { title: 'Не удалось обновить тег' },
  });

export const useDeleteHomeworkTag = () =>
  useApiMutation({
    mutationFn: homeworkTagsApi.delete,
    invalidateQueries: [homeworkTagKeys.all, homeworkListsKey],
    successToast: { title: 'Тег удалён' },
    errorToast: { title: 'Не удалось удалить тег' },
  });

export const useTrialTags = () =>
  useQuery({ queryKey: trialTagKeys.all, queryFn: trialTagsApi.getAll });

export const useCreateTrialTag = () =>
  useApiMutation({
    mutationFn: (payload: TagPayload) => trialTagsApi.create(payload),
    invalidateQueries: [trialTagKeys.all, trialListsKey],
    successToast: { title: 'Тег создан' },
    errorToast: { title: 'Не удалось создать тег' },
  });

export const useUpdateTrialTag = () =>
  useApiMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateTagPayload) =>
      trialTagsApi.update(id, payload),
    invalidateQueries: [trialTagKeys.all, trialListsKey],
    successToast: { title: 'Тег обновлён' },
    errorToast: { title: 'Не удалось обновить тег' },
  });

export const useDeleteTrialTag = () =>
  useApiMutation({
    mutationFn: trialTagsApi.delete,
    invalidateQueries: [trialTagKeys.all, trialListsKey],
    successToast: { title: 'Тег удалён' },
    errorToast: { title: 'Не удалось удалить тег' },
  });
