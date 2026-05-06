import { z } from 'zod';

// API contracts. After ADR-005 the API is camelCase end-to-end on both
// request and response. Date fields are ISO strings on the wire and
// converted to/from JS Date in the service layer.

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();
const isoDate = z.union([z.string(), z.date()]).transform((v) =>
  v instanceof Date ? v.toISOString() : v,
);
const optionalIsoDate = isoDate.optional();
const nullableIsoDate = z
  .union([z.string(), z.date()])
  .nullable()
  .optional()
  .transform((v) => (v instanceof Date ? v.toISOString() : v));

export const studentDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  name: z.string(),
  telegram: nullableString,
  phone: nullableString,
  birthDate: nullableString,
  timezone: nullableString,
  parentName: nullableString,
  parentTelegram: nullableString,
  parentPhone: nullableString,
  hourlyRate: nullableNumber,
  lessonsPerMonth: nullableNumber,
  lessonDuration: nullableNumber,
  paymentType: z.enum(['subscription', 'per-lesson']).nullable().optional(),
  monthlyRevenue: nullableNumber,
  acquisitionCost: nullableNumber,
  acquisitionSource: z
    .enum(['profi', 'avito', 'referral', 'word-of-mouth'])
    .nullable()
    .optional(),
  photoData: nullableString,
  paidLessonsCount: nullableNumber,
  manualTaskProgress: z.any().nullable().optional(),
  learningTrajectory: nullableString,
  color: nullableString,
  createdAt: isoDate,
});

export const lessonDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  studentId: z.string(),
  startTime: isoDate,
  endTime: isoDate,
  meetLink: nullableString,
  comment: nullableString,
  isScheduled: z.boolean().nullable().optional(),
  status: z.enum(['planned', 'active', 'completed', 'archived']),
  preparationId: nullableString,
  homeworkId: nullableString,
  isPaid: z.boolean().nullable().optional(),
  createdAt: optionalIsoDate,
  studentName: nullableString,
});

export const scheduledLessonDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  studentId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  meetLink: nullableString,
  comment: nullableString,
  preparationId: nullableString,
  homeworkId: nullableString,
  createdAt: optionalIsoDate,
  studentName: nullableString,
});

export const intervalDtoSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  startTime: isoDate,
  endTime: nullableIsoDate,
  createdAt: optionalIsoDate,
});

export const tagDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: nullableString,
  createdAt: isoDate.optional(),
});

export const notificationDtoSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().optional().nullable(),
  meta: z.record(z.any()).optional().nullable(),
  createdAt: isoDate,
  readAt: nullableIsoDate,
});

const tagsArrayOptional = z.array(tagDtoSchema).optional();

export const preparationTagDtoSchema = tagDtoSchema;
export const homeworkTagDtoSchema = tagDtoSchema;
export const trialTagDtoSchema = tagDtoSchema;

export const preparationDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  taskNumber: z.string(),
  method: z.enum(['program', 'analytics', 'excel']),
  title: z.string(),
  message: z.string(),
  tags: tagsArrayOptional,
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const homeworkDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  taskNumber: z.string(),
  title: z.string(),
  link: nullableString,
  tags: tagsArrayOptional,
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const trialDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  orderNumber: z.number().int(),
  difficultyLevel: z.enum(['easy', 'ege', 'advanced']),
  title: z.string(),
  link: z.string(),
  tags: tagsArrayOptional,
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const paymentHistoryDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  studentId: z.string(),
  lessonsCount: z.number().int(),
  amount: z.number(),
  createdAt: isoDate,
});

export const studentTrialDtoSchema = z.object({
  id: z.string(),
  userId: z.number().int().optional(),
  studentId: z.string(),
  trialId: z.string(),
  deadline: isoDate,
  comment: nullableString,
  complications: nullableString,
  status: z.enum(['assigned', 'completed']),
  completedAt: nullableIsoDate,
  createdAt: isoDate,
  updatedAt: isoDate,
  trialTitle: nullableString,
  trialLink: nullableString,
  trialDifficultyLevel: nullableString,
});

export const trialResultDtoSchema = z.object({
  id: z.string(),
  studentTrialId: z.string(),
  taskScores: z.union([z.string(), z.array(z.number()), z.any()]),
  primaryScore: z.number().int(),
  secondaryScore: z.number().int(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const enrichedTrialResultDtoSchema = trialResultDtoSchema.extend({
  studentId: nullableString,
  completedAt: nullableIsoDate,
  deadline: nullableIsoDate,
  trialTitle: nullableString,
  trialDifficultyLevel: nullableString,
});

export const exportPayloadSchema = z.object({
  students: z.array(studentDtoSchema),
  lessons: z.array(lessonDtoSchema),
  scheduledLessons: z.array(scheduledLessonDtoSchema),
  intervals: z.array(intervalDtoSchema),
  preparations: z.array(preparationDtoSchema),
  homeworks: z.array(homeworkDtoSchema),
  trials: z.array(trialDtoSchema),
  studentTrials: z.array(studentTrialDtoSchema),
  trialResults: z.array(trialResultDtoSchema),
  paymentHistory: z.array(paymentHistoryDtoSchema),
  exportDate: z.string(),
});

export const importPayloadSchema = exportPayloadSchema.extend({
  exportDate: z.string().optional(),
});
