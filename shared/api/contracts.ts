import { z } from 'zod';
import {
  studentDtoSchema,
  lessonDtoSchema,
  scheduledLessonDtoSchema,
  intervalDtoSchema,
  preparationDtoSchema,
  homeworkDtoSchema,
  trialDtoSchema,
  paymentHistoryDtoSchema,
  studentTrialDtoSchema,
  trialResultDtoSchema,
  enrichedTrialResultDtoSchema,
  exportPayloadSchema,
  importPayloadSchema,
  tagDtoSchema,
  preparationTagDtoSchema,
  homeworkTagDtoSchema,
  trialTagDtoSchema,
  notificationDtoSchema,
} from './contracts.js';

export {
  studentDtoSchema,
  lessonDtoSchema,
  scheduledLessonDtoSchema,
  intervalDtoSchema,
  preparationDtoSchema,
  homeworkDtoSchema,
  trialDtoSchema,
  paymentHistoryDtoSchema,
  studentTrialDtoSchema,
  trialResultDtoSchema,
  enrichedTrialResultDtoSchema,
  exportPayloadSchema,
  importPayloadSchema,
  tagDtoSchema,
  preparationTagDtoSchema,
  homeworkTagDtoSchema,
  trialTagDtoSchema,
  notificationDtoSchema,
};

export type StudentDto = z.infer<typeof studentDtoSchema>;
export type LessonDto = z.infer<typeof lessonDtoSchema>;
export type ScheduledLessonDto = z.infer<typeof scheduledLessonDtoSchema>;
export type IntervalDto = z.infer<typeof intervalDtoSchema>;
export type PreparationDto = z.infer<typeof preparationDtoSchema>;
export type HomeworkDto = z.infer<typeof homeworkDtoSchema>;
export type TrialDto = z.infer<typeof trialDtoSchema>;
export type PaymentHistoryDto = z.infer<typeof paymentHistoryDtoSchema>;
export type StudentTrialDto = z.infer<typeof studentTrialDtoSchema>;
export type TrialResultDto = z.infer<typeof trialResultDtoSchema>;
export type EnrichedTrialResultDto = z.infer<typeof enrichedTrialResultDtoSchema>;
export type ExportPayloadDto = z.infer<typeof exportPayloadSchema>;
export type ImportPayloadDto = z.infer<typeof importPayloadSchema>;
export type TagDto = z.infer<typeof tagDtoSchema>;
export type PreparationTagDto = TagDto;
export type HomeworkTagDto = TagDto;
export type TrialTagDto = TagDto;
export type NotificationDto = z.infer<typeof notificationDtoSchema>;
