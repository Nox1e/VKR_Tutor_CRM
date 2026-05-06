import { useQuery } from '@tanstack/react-query';
import { trajectoryApi } from '@/api';
import type { ApplyNextTarget } from '@/api/trajectory';
import { useApiMutation } from '@/api/factory';
import { lessonKeys } from './lessons';
import { studentKeys } from './students';
import { scheduledLessonKeys } from './scheduled-lessons';
import type { TrajectoryItem } from '@/types';

export const trajectoryKeys = {
  all: ['trajectory'] as const,
  byStudent: (studentId?: string) => ['trajectory', studentId] as const,
};

const transformTrajectoryItem = (dto: Record<string, unknown>): TrajectoryItem => ({
  id: dto.id as string,
  studentId: dto.studentId as string,
  preparationId: dto.preparationId as string,
  homeworkId: (dto.homeworkId as string | null) ?? null,
  position: dto.position as number,
  status: dto.status as TrajectoryItem['status'],
  assignedToLessonId: (dto.assignedToLessonId as string | null) ?? null,
  assignedAt: (dto.assignedAt as string | null) ?? null,
  consumedAt: (dto.consumedAt as string | null) ?? null,
  createdAt: dto.createdAt as string,
  preparationTitle: (dto.preparationTitle as string | null) ?? undefined,
  preparationTaskNumber: (dto.preparationTaskNumber as string | null) ?? undefined,
  preparationMethod: (dto.preparationMethod as string | null) ?? undefined,
  homeworkTitle: (dto.homeworkTitle as string | null) ?? undefined,
});

export const useTrajectory = (studentId?: string) =>
  useQuery({
    queryKey: trajectoryKeys.byStudent(studentId),
    queryFn: () => trajectoryApi.getByStudent(studentId!),
    select: (data) =>
      data.map((dto) => transformTrajectoryItem(dto as unknown as Record<string, unknown>)),
    enabled: !!studentId,
  });

export const useAddTrajectoryItem = () =>
  useApiMutation({
    mutationFn: ({ studentId, preparationId, homeworkId }: {
      studentId: string;
      preparationId: string;
      homeworkId?: string | null;
    }) => trajectoryApi.addItem(studentId, { preparationId, homeworkId }),
    invalidateQueries: [trajectoryKeys.all],
    successToast: { title: 'Подготовка добавлена', description: 'Подготовка добавлена в траекторию' },
  });

export const useAddTrajectoryItems = () =>
  useApiMutation({
    mutationFn: ({ studentId, items }: {
      studentId: string;
      items: Array<{ preparationId: string; homeworkId?: string | null }>;
    }) => trajectoryApi.addItems(studentId, items),
    invalidateQueries: [trajectoryKeys.all],
    successToast: { title: 'Подготовки добавлены', description: 'Подготовки добавлены в траекторию' },
  });

export const useReorderTrajectory = () =>
  useApiMutation({
    mutationFn: ({ studentId, orderedIds }: { studentId: string; orderedIds: string[] }) =>
      trajectoryApi.reorder(studentId, orderedIds),
    invalidateQueries: [trajectoryKeys.all],
  });

export const useSkipTrajectoryItem = () =>
  useApiMutation({
    mutationFn: ({ studentId, itemId }: { studentId: string; itemId: string }) =>
      trajectoryApi.skip(studentId, itemId),
    invalidateQueries: [trajectoryKeys.all, lessonKeys.all],
    successToast: { title: 'Подготовка пропущена', description: 'Следующая подготовка назначена' },
  });

export const useRemoveTrajectoryItem = () =>
  useApiMutation({
    mutationFn: ({ studentId, itemId }: { studentId: string; itemId: string }) =>
      trajectoryApi.remove(studentId, itemId),
    invalidateQueries: [trajectoryKeys.all],
    successToast: { title: 'Удалено', description: 'Подготовка убрана из траектории' },
  });

export const useApplyNextTrajectoryItem = () =>
  useApiMutation({
    mutationFn: ({ studentId, target }: { studentId: string; target: ApplyNextTarget }) =>
      trajectoryApi.applyNext(studentId, target),
    invalidateQueries: [trajectoryKeys.all, lessonKeys.all, scheduledLessonKeys.all, studentKeys.all],
    successToast: { title: 'Подготовка применена', description: 'Подготовка из траектории назначена' },
    errorToast: { title: 'Не удалось применить подготовку' },
  });

export const useCompleteLesson = () =>
  useApiMutation({
    mutationFn: (lessonId: string) => trajectoryApi.completeLesson(lessonId),
    invalidateQueries: [lessonKeys.all, trajectoryKeys.all, studentKeys.all, scheduledLessonKeys.all],
    successToast: { title: 'Урок завершён', description: 'Подготовка потреблена, следующая назначена' },
  });
