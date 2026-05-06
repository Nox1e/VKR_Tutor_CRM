import { useQuery } from '@tanstack/react-query';
import {
  trialsApi,
  studentTrialsApi,
  trialResultsApi,
  transformApiData,
} from '@/api';
import { useApiMutation } from '@/api/factory';

export const trialKeys = {
  all: ['trials'] as const,
};

export const studentTrialKeys = {
  all: ['studentTrials'] as const,
  byStudent: (studentId?: string) => ['studentTrials', studentId] as const,
};

export const trialResultKeys = {
  all: ['trialResults'] as const,
  byStudentTrial: (studentTrialId: string) => ['trialResults', studentTrialId] as const,
  enriched: (studentId?: string) => ['trialResults', 'enriched', studentId ?? 'all'] as const,
};

// Trials
export const useTrials = () =>
  useQuery({
    queryKey: trialKeys.all,
    queryFn: trialsApi.getAll,
    select: (data) => data.map(transformApiData.trial),
  });

export const useCreateTrial = () =>
  useApiMutation({
    mutationFn: (trial: Parameters<typeof trialsApi.create>[0]) => trialsApi.create(trial),
    invalidateQueries: [trialKeys.all],
    successToast: { title: 'Пробник создан', description: 'Пробник успешно добавлен в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось создать пробник' },
  });

export const useUpdateTrial = () =>
  useApiMutation({
    mutationFn: ({ id, trial }: {
      id: string;
      trial: Parameters<typeof trialsApi.update>[1];
    }) => trialsApi.update(id, trial),
    invalidateQueries: [trialKeys.all],
    successToast: { title: 'Пробник обновлен', description: 'Пробник успешно обновлен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить пробник' },
  });

export const useDeleteTrial = () =>
  useApiMutation({
    mutationFn: trialsApi.delete,
    invalidateQueries: [trialKeys.all],
    successToast: { title: 'Пробник удален', description: 'Пробник успешно удален из базы данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить пробник' },
  });

// Student trials
export const useStudentTrials = (studentId?: string) =>
  useQuery({
    queryKey: studentTrialKeys.byStudent(studentId),
    queryFn: () => (studentId ? studentTrialsApi.getByStudent(studentId) : studentTrialsApi.getAll()),
    select: (data) => data.map(transformApiData.studentTrial),
    enabled: !!studentId,
  });

export const useCreateStudentTrial = () =>
  useApiMutation({
    mutationFn: (payload: Parameters<typeof studentTrialsApi.create>[0]) =>
      studentTrialsApi.create(payload),
    invalidateQueries: [
      studentTrialKeys.all,
      (variables) => studentTrialKeys.byStudent(variables.studentId),
    ],
    successToast: { title: 'Пробник назначен', description: 'Пробник успешно назначен ученику' },
    errorToast: { title: 'Ошибка', description: 'Не удалось назначить пробник' },
  });

export const useUpdateStudentTrial = () =>
  useApiMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof studentTrialsApi.update>[1]) =>
      studentTrialsApi.update(id, data),
    invalidateQueries: [studentTrialKeys.all],
    successToast: { title: 'Пробник обновлен', description: 'Пробник успешно обновлен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить пробник' },
  });

export const useDeleteStudentTrial = () =>
  useApiMutation({
    mutationFn: studentTrialsApi.delete,
    invalidateQueries: [studentTrialKeys.all],
    successToast: { title: 'Пробник удален', description: 'Пробник успешно удален' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить пробник' },
  });

export const useMarkStudentTrialCompleted = () =>
  useApiMutation({
    mutationFn: studentTrialsApi.markCompleted,
    invalidateQueries: [studentTrialKeys.all],
    successToast: { title: 'Пробник выполнен', description: 'Пробник отмечен как выполненный' },
    errorToast: { title: 'Ошибка', description: 'Не удалось отметить пробник как выполненный' },
  });

// Trial results
export const useTrialResult = (studentTrialId: string) =>
  useQuery({
    queryKey: trialResultKeys.byStudentTrial(studentTrialId),
    queryFn: () => trialResultsApi.getByStudentTrial(studentTrialId),
    select: (data) => (data ? transformApiData.trialResult(data) : null),
    enabled: !!studentTrialId,
  });

export const useEnrichedTrialResults = (studentId?: string) =>
  useQuery({
    queryKey: trialResultKeys.enriched(studentId),
    queryFn: () => trialResultsApi.getEnriched(studentId),
    select: (data) => data.map(transformApiData.enrichedTrialResult),
  });

export const useCreateTrialResult = () =>
  useApiMutation({
    mutationFn: (payload: Parameters<typeof trialResultsApi.create>[0]) =>
      trialResultsApi.create(payload),
    invalidateQueries: [
      trialResultKeys.all,
      (variables) => trialResultKeys.byStudentTrial(variables.studentTrialId),
      studentTrialKeys.all,
    ],
    successToast: { title: 'Результат сохранен', description: 'Результат пробника успешно сохранен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось сохранить результат' },
  });

export const useUpdateTrialResult = () =>
  useApiMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof trialResultsApi.update>[1]) =>
      trialResultsApi.update(id, data),
    invalidateQueries: [trialResultKeys.all, studentTrialKeys.all],
    successToast: { title: 'Результат обновлен', description: 'Результат пробника успешно обновлен' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить результат' },
  });

export const useDeleteTrialResult = () =>
  useApiMutation({
    mutationFn: trialResultsApi.delete,
    invalidateQueries: [trialResultKeys.all, studentTrialKeys.all],
    successToast: { title: 'Результат удален', description: 'Результат пробника успешно удален' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить результат' },
  });
