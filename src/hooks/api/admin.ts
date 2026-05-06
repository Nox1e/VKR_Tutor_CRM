import { dataApi } from '@/api';
import { useApiMutation } from '@/api/factory';
import { studentKeys, paymentHistoryKeys } from './students';
import { lessonKeys } from './lessons';
import { scheduledLessonKeys } from './scheduled-lessons';
import { intervalKeys } from './intervals';
import { preparationKeys } from './preparations';
import { homeworkKeys } from './homeworks';
import { trialKeys, studentTrialKeys, trialResultKeys } from './trials';

export const useExportData = () =>
  useApiMutation({
    mutationFn: dataApi.export,
    errorToast: { title: 'Ошибка экспорта', description: 'Не удалось экспортировать данные' },
  });

export const useImportData = () =>
  useApiMutation({
    mutationFn: dataApi.import,
    invalidateQueries: [studentKeys.all, lessonKeys.all, scheduledLessonKeys.all, intervalKeys.all],
    successToast: { title: 'Данные импортированы', description: 'Данные успешно импортированы в базу данных' },
    errorToast: { title: 'Ошибка импорта', description: 'Не удалось импортировать данные' },
  });

export const useClearData = () =>
  useApiMutation({
    mutationFn: dataApi.clear,
    invalidateQueries: [
      studentKeys.all,
      lessonKeys.all,
      scheduledLessonKeys.all,
      intervalKeys.all,
      preparationKeys.all,
      homeworkKeys.all,
      trialKeys.all,
      studentTrialKeys.all,
      trialResultKeys.all,
      paymentHistoryKeys.all,
    ],
    successToast: { title: 'Данные очищены', description: 'Все данные успешно очищены из базы данных' },
    errorToast: { title: 'Ошибка очистки', description: 'Не удалось очистить данные' },
  });
