/**
 * Barrel re-export of all API hooks.
 *
 * Per-entity hooks live in src/hooks/api/<entity>.ts and use the shared
 * factory in src/api/factory.ts. This file is kept for backward compatibility
 * with existing import sites — new code should import from the entity files
 * directly when only one or two hooks are needed.
 */

export {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useAddPayment,
  useSetPaidLessonsCount,
  usePaymentHistory,
  useDeletePaymentHistory,
  studentKeys,
  paymentHistoryKeys,
} from '@/hooks/api/students';

export {
  useStudentLessons,
  useLessons,
  useCreateLesson,
  useDeleteLesson,
  useUpdateLesson,
  useAssignPreparationToLesson,
  useAssignHomeworkToLesson,
  useToggleLessonPayment,
  lessonKeys,
} from '@/hooks/api/lessons';

export {
  useStudentScheduledLessons,
  useScheduledLessons,
  useCreateScheduledLesson,
  useUpdateScheduledLesson,
  useDeleteScheduledLesson,
  useAssignPreparationToScheduledLesson,
  useAssignHomeworkToScheduledLesson,
  scheduledLessonKeys,
} from '@/hooks/api/scheduled-lessons';

export {
  useTrajectory,
  useAddTrajectoryItem,
  useAddTrajectoryItems,
  useReorderTrajectory,
  useSkipTrajectoryItem,
  useRemoveTrajectoryItem,
  useApplyNextTrajectoryItem,
  useCompleteLesson,
  trajectoryKeys,
} from '@/hooks/api/trajectory';

export {
  useIntervals,
  useCreateInterval,
  useUpdateInterval,
  useDeleteInterval,
  useLessonIntervalsMap,
  intervalKeys,
} from '@/hooks/api/intervals';

export {
  usePreparations,
  useCreatePreparation,
  useUpdatePreparation,
  useDeletePreparation,
  preparationKeys,
} from '@/hooks/api/preparations';

export {
  useHomeworks,
  useCreateHomework,
  useUpdateHomework,
  useDeleteHomework,
  homeworkKeys,
} from '@/hooks/api/homeworks';

export {
  useTrials,
  useCreateTrial,
  useUpdateTrial,
  useDeleteTrial,
  useStudentTrials,
  useCreateStudentTrial,
  useUpdateStudentTrial,
  useDeleteStudentTrial,
  useMarkStudentTrialCompleted,
  useTrialResult,
  useEnrichedTrialResults,
  useCreateTrialResult,
  useUpdateTrialResult,
  useDeleteTrialResult,
  trialKeys,
  studentTrialKeys,
  trialResultKeys,
} from '@/hooks/api/trials';

export {
  useExportData,
  useImportData,
  useClearData,
} from '@/hooks/api/admin';

export { useApiMutation, useApiQuery } from '@/api/factory';
