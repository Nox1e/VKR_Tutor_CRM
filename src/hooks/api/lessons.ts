import { useQuery } from '@tanstack/react-query';
import {
  lessonsApi,
  transformApiData,
  transformToApi,
} from '@/api';
import type { LessonDto } from '@shared/api/contracts';
import { useApiMutation } from '@/api/factory';
import { studentKeys, paymentHistoryKeys } from './students';

export const lessonKeys = {
  all: ['lessons'] as const,
  byStudent: (studentId?: string, paramsKey: string = 'all') =>
    ['students', studentId, 'lessons', paramsKey] as const,
};

export const useStudentLessons = (
  studentId?: string,
  options?: Parameters<typeof lessonsApi.getByStudent>[1],
) => {
  const paramsKey = options ? JSON.stringify(options) : 'all';

  return useQuery({
    queryKey: lessonKeys.byStudent(studentId, paramsKey),
    enabled: !!studentId,
    queryFn: () => lessonsApi.getByStudent(studentId!, options),
    select: (data) => data.map(transformApiData.lesson),
  });
};

export const useLessons = () =>
  useQuery({
    queryKey: lessonKeys.all,
    queryFn: lessonsApi.getAll,
    select: (data) => data.map(transformApiData.lesson),
  });

export const useCreateLesson = () =>
  useApiMutation({
    mutationFn: (lesson: {
      studentId: string;
      startTime: Date;
      endTime: Date;
      meetLink?: string;
      comment?: string;
      isScheduled?: boolean;
      preparationId?: string;
      homeworkId?: string;
    }) => lessonsApi.create(transformToApi.lesson(lesson)),
    invalidateQueries: [lessonKeys.all, studentKeys.all],
    successToast: { title: 'Урок добавлен', description: 'Урок успешно добавлен в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить урок' },
  });

export const useDeleteLesson = () =>
  useApiMutation({
    mutationFn: (lessonId: string) => lessonsApi.delete(lessonId),
    invalidateQueries: [lessonKeys.all, studentKeys.all, paymentHistoryKeys.all],
    successToast: { title: 'Урок удален', description: 'Проведенный урок успешно удален' },
    errorToast: { title: 'Ошибка удаления урока', description: 'Не удалось удалить урок' },
  });

export const useUpdateLesson = () =>
  useApiMutation({
    mutationFn: ({ id, lesson }: { id: string; lesson: Partial<LessonDto> }) =>
      lessonsApi.update(id, lesson),
    invalidateQueries: [lessonKeys.all, studentKeys.all],
    successToast: { title: 'Урок обновлен', description: 'Урок успешно обновлен в базе данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить урок' },
  });

export const useAssignPreparationToLesson = () =>
  useApiMutation({
    mutationFn: ({ lessonId, preparationId }: { lessonId: string; preparationId: string | null }) =>
      lessonsApi.assignPreparation(lessonId, preparationId),
    invalidateQueries: [lessonKeys.all, studentKeys.all],
    successToast: { title: 'Подготовка назначена', description: 'Подготовка успешно назначена на занятие' },
    errorToast: { title: 'Ошибка назначения', description: 'Не удалось назначить подготовку' },
  });

export const useAssignHomeworkToLesson = () =>
  useApiMutation({
    mutationFn: ({ lessonId, homeworkId }: { lessonId: string; homeworkId: string | null }) =>
      lessonsApi.assignHomework(lessonId, homeworkId),
    invalidateQueries: [lessonKeys.all, studentKeys.all],
    successToast: { title: 'Домашнее задание назначено', description: 'Домашнее задание успешно назначено на занятие' },
    errorToast: { title: 'Ошибка назначения', description: 'Не удалось назначить домашнее задание' },
  });

export const useToggleLessonPayment = () =>
  useApiMutation({
    mutationFn: ({ lessonId, isPaid }: { lessonId: string; isPaid: boolean }) =>
      lessonsApi.togglePayment(lessonId, isPaid),
    invalidateQueries: [lessonKeys.all, studentKeys.all, paymentHistoryKeys.all],
    errorToast: { title: 'Ошибка изменения оплаты', description: 'Не удалось изменить статус оплаты' },
  });
