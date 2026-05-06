import { useQuery, useQueries } from '@tanstack/react-query';
import { intervalsApi, transformApiData, transformToApi } from '@/api';
import { useApiMutation } from '@/api/factory';
import { lessonKeys } from './lessons';
import { studentKeys } from './students';
import type { TimeInterval } from '@/types';

export const intervalKeys = {
  all: ['intervals'] as const,
  byLesson: (lessonId: string) => ['intervals', lessonId] as const,
};

export const useIntervals = (lessonId: string) =>
  useQuery({
    queryKey: intervalKeys.byLesson(lessonId),
    queryFn: () => intervalsApi.getByLesson(lessonId),
    select: (data) => data.map(transformApiData.interval),
    enabled: !!lessonId,
  });

export const useCreateInterval = () =>
  useApiMutation({
    mutationFn: ({ lessonId, interval }: {
      lessonId: string;
      interval: { startTime: Date; endTime?: Date };
    }) => intervalsApi.create(lessonId, transformToApi.interval(interval)),
    invalidateQueries: [
      (variables) => intervalKeys.byLesson(variables.lessonId),
      lessonKeys.all,
      studentKeys.all,
    ],
    successToast: { title: 'Интервал добавлен', description: 'Интервал активности успешно добавлен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить интервал' },
  });

export const useUpdateInterval = () =>
  useApiMutation({
    mutationFn: ({ id, interval }: {
      id: string;
      lessonId: string;
      interval: { startTime: Date; endTime?: Date };
    }) => intervalsApi.update(id, transformToApi.interval(interval)),
    invalidateQueries: [
      (variables) => intervalKeys.byLesson(variables.lessonId),
      lessonKeys.all,
      studentKeys.all,
    ],
    successToast: { title: 'Интервал обновлен', description: 'Интервал активности успешно обновлен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить интервал' },
  });

export const useDeleteInterval = () =>
  useApiMutation({
    mutationFn: ({ id }: { id: string; lessonId: string }) => intervalsApi.delete(id),
    invalidateQueries: [
      (variables) => intervalKeys.byLesson(variables.lessonId),
      lessonKeys.all,
      studentKeys.all,
    ],
    successToast: { title: 'Интервал удален', description: 'Интервал активности успешно удален' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить интервал' },
  });

export const useLessonIntervalsMap = (lessonIds: string[]) => {
  const queries = useQueries({
    queries: lessonIds.map((lessonId) => ({
      queryKey: intervalKeys.byLesson(lessonId),
      queryFn: () => intervalsApi.getByLesson(lessonId),
      select: (data: Awaited<ReturnType<typeof intervalsApi.getByLesson>>) =>
        data.map(transformApiData.interval),
      enabled: !!lessonId,
    })),
  });

  const intervalsMap: Record<string, TimeInterval[]> = {};
  lessonIds.forEach((id, i) => {
    intervalsMap[id] = queries[i]?.data ?? [];
  });

  const isLoading = queries.some((q) => q.isLoading);

  return { intervalsMap, isLoading };
};
