import { useQuery } from '@tanstack/react-query';
import { preparationsApi, transformApiData, transformToApi } from '@/api';
import type { PreparationDto } from '@shared/api/contracts';
import { useApiMutation } from '@/api/factory';

export const preparationKeys = {
  all: ['preparations'] as const,
};

export const usePreparations = () =>
  useQuery({
    queryKey: preparationKeys.all,
    queryFn: preparationsApi.getAll,
    select: (data) => data.map(transformApiData.preparation),
  });

export const useCreatePreparation = () =>
  useApiMutation({
    mutationFn: (preparation: {
      taskNumber: string;
      method: 'program' | 'analytics' | 'excel';
      title: string;
      message: string;
    }) => preparationsApi.create(transformToApi.preparation(preparation)),
    invalidateQueries: [preparationKeys.all],
    successToast: { title: 'Подготовка добавлена', description: 'Подготовка успешно добавлена в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить подготовку' },
  });

export const useUpdatePreparation = () =>
  useApiMutation({
    mutationFn: ({ id, preparation }: { id: string; preparation: Partial<PreparationDto> }) =>
      preparationsApi.update(id, preparation),
    invalidateQueries: [preparationKeys.all],
    successToast: { title: 'Подготовка обновлена', description: 'Подготовка успешно обновлена в базе данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить подготовку' },
  });

export const useDeletePreparation = () =>
  useApiMutation({
    mutationFn: preparationsApi.delete,
    invalidateQueries: [preparationKeys.all],
    successToast: { title: 'Подготовка удалена', description: 'Подготовка успешно удалена из базы данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить подготовку' },
  });
