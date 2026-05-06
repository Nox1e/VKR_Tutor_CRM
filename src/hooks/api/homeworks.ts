import { useQuery } from '@tanstack/react-query';
import { homeworksApi, transformApiData } from '@/api';
import { useApiMutation } from '@/api/factory';

export const homeworkKeys = {
  all: ['homeworks'] as const,
};

export const useHomeworks = () =>
  useQuery({
    queryKey: homeworkKeys.all,
    queryFn: homeworksApi.getAll,
    select: (data) => data.map(transformApiData.homework),
  });

export const useCreateHomework = () =>
  useApiMutation({
    mutationFn: (homework: Parameters<typeof homeworksApi.create>[0]) =>
      homeworksApi.create(homework),
    invalidateQueries: [homeworkKeys.all],
    successToast: { title: 'Домашнее задание добавлено', description: 'Домашнее задание успешно добавлено в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить домашнее задание' },
  });

export const useUpdateHomework = () =>
  useApiMutation({
    mutationFn: ({ id, homework }: {
      id: string;
      homework: Parameters<typeof homeworksApi.update>[1];
    }) => homeworksApi.update(id, homework),
    invalidateQueries: [homeworkKeys.all],
    successToast: { title: 'Домашнее задание обновлено', description: 'Домашнее задание успешно обновлено' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить домашнее задание' },
  });

export const useDeleteHomework = () =>
  useApiMutation({
    mutationFn: homeworksApi.delete,
    invalidateQueries: [homeworkKeys.all],
    successToast: { title: 'Домашнее задание удалено', description: 'Домашнее задание успешно удалено из базы данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить домашнее задание' },
  });
