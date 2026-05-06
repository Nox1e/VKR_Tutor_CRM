import { useQuery } from '@tanstack/react-query';
import {
  scheduledLessonsApi,
  transformApiData,
  transformToApi,
} from '@/api';
import type { ScheduledLessonDto } from '@shared/api/contracts';
import { useApiMutation } from '@/api/factory';
import { studentKeys } from './students';

export const scheduledLessonKeys = {
  all: ['scheduledLessons'] as const,
  byStudent: (studentId?: string) => ['students', studentId, 'scheduledLessons'] as const,
};

export const useStudentScheduledLessons = (studentId?: string) =>
  useQuery({
    queryKey: scheduledLessonKeys.byStudent(studentId),
    enabled: !!studentId,
    queryFn: () => scheduledLessonsApi.getByStudent(studentId!),
    select: (data) => data.map(transformApiData.scheduledLesson),
  });

export const useScheduledLessons = () =>
  useQuery({
    queryKey: scheduledLessonKeys.all,
    queryFn: scheduledLessonsApi.getAll,
    select: (data) => data.map(transformApiData.scheduledLesson),
  });

export const useCreateScheduledLesson = () =>
  useApiMutation({
    mutationFn: (lesson: {
      studentId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      meetLink?: string;
      comment?: string;
    }) => scheduledLessonsApi.create(transformToApi.scheduledLesson(lesson)),
    invalidateQueries: [scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Плановое занятие добавлено', description: 'Плановое занятие успешно добавлено в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить плановое занятие' },
  });

export const useUpdateScheduledLesson = () =>
  useApiMutation({
    mutationFn: ({ id, lesson }: { id: string; lesson: Partial<ScheduledLessonDto> }) =>
      scheduledLessonsApi.update(id, lesson),
    invalidateQueries: [scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Плановое занятие обновлено', description: 'Плановое занятие успешно обновлено в базе данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить плановое занятие' },
  });

export const useDeleteScheduledLesson = () =>
  useApiMutation({
    mutationFn: scheduledLessonsApi.delete,
    invalidateQueries: [scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Плановое занятие удалено', description: 'Плановое занятие успешно удалено из базы данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить плановое занятие' },
  });

export const useAssignPreparationToScheduledLesson = () =>
  useApiMutation({
    mutationFn: ({ lessonId, preparationId }: { lessonId: string; preparationId: string | null }) =>
      scheduledLessonsApi.assignPreparation(lessonId, preparationId),
    invalidateQueries: [scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Подготовка назначена', description: 'Подготовка успешно назначена на плановое занятие' },
    errorToast: { title: 'Ошибка назначения', description: 'Не удалось назначить подготовку' },
  });

export const useAssignHomeworkToScheduledLesson = () =>
  useApiMutation({
    mutationFn: ({ lessonId, homeworkId }: { lessonId: string; homeworkId: string | null }) =>
      scheduledLessonsApi.assignHomework(lessonId, homeworkId),
    invalidateQueries: [scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Домашнее задание назначено', description: 'Домашнее задание успешно назначено на плановое занятие' },
    errorToast: { title: 'Ошибка назначения', description: 'Не удалось назначить домашнее задание' },
  });
