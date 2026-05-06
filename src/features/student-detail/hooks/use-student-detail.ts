import { useMemo } from 'react';
import {
  useStudent,
  useStudentLessons,
  useStudentScheduledLessons,
  usePreparations,
  useHomeworks,
  usePaymentHistory,
  useStudentTrials,
  useTrials,
} from '@/hooks/useApi';
import { useStudentSchedule } from './use-student-schedule';

interface UseStudentDetailOptions {
  lessonsLimit?: number;
}

export const useStudentDetail = (studentId?: string, options: UseStudentDetailOptions = {}) => {
  const lessonOptions = useMemo(() => {
    if (!options.lessonsLimit) {
      return undefined;
    }

    return { limit: options.lessonsLimit } as Parameters<typeof useStudentLessons>[1];
  }, [options.lessonsLimit]);

  const studentQuery = useStudent(studentId);
  const lessonsQuery = useStudentLessons(studentId, lessonOptions);
  const scheduledLessonsQuery = useStudentScheduledLessons(studentId);
  const preparationsQuery = usePreparations();
  const homeworksQuery = useHomeworks();
  const paymentHistoryQuery = usePaymentHistory(studentId);
  const studentTrialsQuery = useStudentTrials(studentId);
  const trialsCatalogQuery = useTrials();

  const schedule = useStudentSchedule(lessonsQuery.data ?? [], scheduledLessonsQuery.data ?? []);

  const assignedTrials = useMemo(
    () =>
      (studentTrialsQuery.data ?? [])
        .filter((trial) => trial.status === 'assigned')
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        ),
    [studentTrialsQuery.data],
  );

  const completedTrials = useMemo(
    () =>
      (studentTrialsQuery.data ?? [])
        .filter((trial) => trial.status === 'completed')
        .sort((a, b) => {
          const aDate = new Date(a.completedAt ?? a.createdAt).getTime();
          const bDate = new Date(b.completedAt ?? b.createdAt).getTime();
          return bDate - aDate;
        }),
    [studentTrialsQuery.data],
  );

  const nextTrial = assignedTrials.length > 0 ? assignedTrials[0] : null;

  const isLoading =
    studentQuery.isLoading || lessonsQuery.isLoading || scheduledLessonsQuery.isLoading;

  const isError =
    studentQuery.isError || lessonsQuery.isError || scheduledLessonsQuery.isError;

  return {
    studentQuery,
    lessonsQuery,
    scheduledLessonsQuery,
    preparationsQuery,
    homeworksQuery,
    paymentHistoryQuery,
    studentTrialsQuery,
    trialsCatalogQuery,
    schedule,
    isLoading,
    isError,
    student: studentQuery.data,
    lessons: lessonsQuery.data ?? [],
    scheduledLessons: scheduledLessonsQuery.data ?? [],
    preparations: preparationsQuery.data ?? [],
    homeworks: homeworksQuery.data ?? [],
    paymentHistory: paymentHistoryQuery.data ?? [],
    studentTrials: studentTrialsQuery.data ?? [],
    assignedTrials,
    completedTrials,
    nextTrial,
  } as const;
};
