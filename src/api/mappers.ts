import type {
  StudentDto,
  LessonDto,
  ScheduledLessonDto,
  IntervalDto,
  PreparationDto,
  HomeworkDto,
  TrialDto,
  PaymentHistoryDto,
  StudentTrialDto,
  TrialResultDto,
  EnrichedTrialResultDto,
} from '@shared/api/contracts';
import type {
  Student,
  Lesson,
  ScheduledLesson,
  TimeInterval,
  Preparation,
  Homework,
  Trial,
  PaymentHistory,
  StudentTrial,
  TrialResult,
  EnrichedTrialResult,
  Tag,
} from '@/types';

// After ADR-005 the API is camelCase end-to-end. The mappers now do almost
// nothing — we still parse Date fields and JSON-encoded scalars, drop nulls
// in favour of `undefined` where the model expects optional fields.

const opt = <T>(v: T | null | undefined): T | undefined => (v ?? undefined);
const date = (v: string | Date) => (v instanceof Date ? v : new Date(v));
const optDate = (v: string | Date | null | undefined) =>
  v ? (v instanceof Date ? v : new Date(v)) : undefined;

const mapTags = (
  raw: Array<{ id: string; name: string; color?: string | null }> | undefined | null,
): Tag[] | undefined =>
  raw?.map((t) => ({ id: t.id, name: t.name, color: opt(t.color) }));

export const transformApiData = {
  student: (apiStudent: StudentDto): Student => ({
    id: apiStudent.id,
    name: apiStudent.name,
    telegram: opt(apiStudent.telegram),
    phone: opt(apiStudent.phone),
    birthDate: opt(apiStudent.birthDate),
    timezone: opt(apiStudent.timezone),
    parentName: opt(apiStudent.parentName),
    parentTelegram: opt(apiStudent.parentTelegram),
    parentPhone: opt(apiStudent.parentPhone),
    hourlyRate: opt(apiStudent.hourlyRate),
    lessonsPerMonth: opt(apiStudent.lessonsPerMonth),
    lessonDuration: opt(apiStudent.lessonDuration),
    paymentType: opt(apiStudent.paymentType),
    monthlyRevenue: opt(apiStudent.monthlyRevenue),
    acquisitionCost: opt(apiStudent.acquisitionCost),
    acquisitionSource: opt(apiStudent.acquisitionSource),
    photoData: opt(apiStudent.photoData),
    paidLessonsCount: opt(apiStudent.paidLessonsCount),
    manualTaskProgress: opt(apiStudent.manualTaskProgress) as Student['manualTaskProgress'],
    learningTrajectory: opt(apiStudent.learningTrajectory),
    color: opt(apiStudent.color),
  }),

  lesson: (apiLesson: LessonDto): Lesson => ({
    id: apiLesson.id,
    studentId: apiLesson.studentId,
    startTime: date(apiLesson.startTime),
    endTime: date(apiLesson.endTime),
    meetLink: opt(apiLesson.meetLink),
    comment: opt(apiLesson.comment),
    isScheduled: Boolean(apiLesson.isScheduled),
    status: apiLesson.status,
    preparationId: opt(apiLesson.preparationId),
    homeworkId: opt(apiLesson.homeworkId),
    isPaid: Boolean(apiLesson.isPaid),
    intervals: [],
  }),

  scheduledLesson: (apiScheduledLesson: ScheduledLessonDto): ScheduledLesson => ({
    id: apiScheduledLesson.id,
    studentId: apiScheduledLesson.studentId,
    dayOfWeek: apiScheduledLesson.dayOfWeek,
    startTime: apiScheduledLesson.startTime,
    endTime: apiScheduledLesson.endTime,
    meetLink: opt(apiScheduledLesson.meetLink),
    comment: opt(apiScheduledLesson.comment),
    preparationId: opt(apiScheduledLesson.preparationId),
    homeworkId: opt(apiScheduledLesson.homeworkId),
  }),

  interval: (apiInterval: IntervalDto): TimeInterval => ({
    id: apiInterval.id,
    startTime: date(apiInterval.startTime),
    endTime: optDate(apiInterval.endTime),
  }),

  preparation: (apiPreparation: PreparationDto): Preparation => ({
    id: apiPreparation.id,
    taskNumber: apiPreparation.taskNumber,
    method: apiPreparation.method,
    title: apiPreparation.title,
    message: apiPreparation.message,
    tags: mapTags(apiPreparation.tags),
    createdAt: date(apiPreparation.createdAt),
    updatedAt: date(apiPreparation.updatedAt),
  }),

  homework: (apiHomework: HomeworkDto): Homework => ({
    id: apiHomework.id,
    taskNumber: apiHomework.taskNumber,
    title: apiHomework.title,
    link: opt(apiHomework.link),
    tags: mapTags(apiHomework.tags),
    createdAt: date(apiHomework.createdAt),
    updatedAt: date(apiHomework.updatedAt),
  }),

  trial: (apiTrial: TrialDto): Trial => ({
    id: apiTrial.id,
    orderNumber: apiTrial.orderNumber,
    difficultyLevel: apiTrial.difficultyLevel,
    title: apiTrial.title,
    link: apiTrial.link,
    tags: mapTags(apiTrial.tags),
    createdAt: date(apiTrial.createdAt),
    updatedAt: date(apiTrial.updatedAt),
  }),

  paymentHistory: (apiPaymentHistory: PaymentHistoryDto): PaymentHistory => ({
    id: apiPaymentHistory.id,
    studentId: apiPaymentHistory.studentId,
    lessonsCount: apiPaymentHistory.lessonsCount,
    amount: apiPaymentHistory.amount,
    createdAt: date(apiPaymentHistory.createdAt),
  }),

  studentTrial: (apiStudentTrial: StudentTrialDto): StudentTrial => ({
    id: apiStudentTrial.id,
    studentId: apiStudentTrial.studentId,
    trialId: apiStudentTrial.trialId,
    deadline: date(apiStudentTrial.deadline),
    comment: opt(apiStudentTrial.comment),
    complications: opt(apiStudentTrial.complications),
    status: apiStudentTrial.status,
    completedAt: optDate(apiStudentTrial.completedAt),
    createdAt: date(apiStudentTrial.createdAt),
    updatedAt: date(apiStudentTrial.updatedAt),
    trialTitle: opt(apiStudentTrial.trialTitle),
    trialLink: opt(apiStudentTrial.trialLink),
    trialDifficultyLevel: opt(apiStudentTrial.trialDifficultyLevel),
  }),

  trialResult: (apiTrialResult: TrialResultDto): TrialResult => ({
    id: apiTrialResult.id,
    studentTrialId: apiTrialResult.studentTrialId,
    taskScores:
      typeof apiTrialResult.taskScores === 'string'
        ? JSON.parse(apiTrialResult.taskScores)
        : (apiTrialResult.taskScores as number[]),
    primaryScore: apiTrialResult.primaryScore,
    secondaryScore: apiTrialResult.secondaryScore,
    createdAt: date(apiTrialResult.createdAt),
    updatedAt: date(apiTrialResult.updatedAt),
  }),

  enrichedTrialResult: (dto: EnrichedTrialResultDto): EnrichedTrialResult => ({
    id: dto.id,
    studentTrialId: dto.studentTrialId,
    taskScores:
      typeof dto.taskScores === 'string'
        ? JSON.parse(dto.taskScores)
        : (dto.taskScores as number[]),
    primaryScore: dto.primaryScore,
    secondaryScore: dto.secondaryScore,
    createdAt: date(dto.createdAt),
    updatedAt: date(dto.updatedAt),
    studentId: opt(dto.studentId) ?? undefined,
    completedAt: optDate(dto.completedAt),
    deadline: optDate(dto.deadline),
    trialTitle: opt(dto.trialTitle),
    trialDifficultyLevel: opt(dto.trialDifficultyLevel),
  }),
};

// Outbound payloads are now camelCase too — we just serialise Date → ISO and
// pass the rest through. Keeping the helpers as a thin layer so call sites
// don't need to remember which fields are dates.

export const transformToApi = {
  student: (student: Partial<Student> & Pick<Student, 'name'>) => ({
    name: student.name,
    telegram: student.telegram ?? null,
    phone: student.phone ?? null,
    birthDate: student.birthDate ?? null,
    timezone: student.timezone ?? null,
    parentName: student.parentName ?? null,
    parentTelegram: student.parentTelegram ?? null,
    parentPhone: student.parentPhone ?? null,
    hourlyRate: student.hourlyRate ?? null,
    lessonsPerMonth: student.lessonsPerMonth ?? null,
    lessonDuration: student.lessonDuration ?? null,
    paymentType: student.paymentType ?? null,
    monthlyRevenue: student.monthlyRevenue ?? null,
    acquisitionCost: student.acquisitionCost ?? null,
    acquisitionSource: student.acquisitionSource ?? null,
    photoData: student.photoData ?? null,
    paidLessonsCount: student.paidLessonsCount ?? 0,
    manualTaskProgress: student.manualTaskProgress ?? null,
    learningTrajectory: student.learningTrajectory ?? null,
    color: student.color ?? null,
  }),

  lesson: (lesson: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
    isScheduled?: boolean;
    preparationId?: string | null;
    homeworkId?: string | null;
    isPaid?: boolean;
  }) => ({
    studentId: lesson.studentId,
    startTime: lesson.startTime.toISOString(),
    endTime: lesson.endTime.toISOString(),
    meetLink: lesson.meetLink,
    comment: lesson.comment,
    isScheduled: lesson.isScheduled,
    preparationId: lesson.preparationId,
    homeworkId: lesson.homeworkId,
    isPaid: lesson.isPaid,
  }),

  scheduledLesson: (lesson: {
    studentId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    meetLink?: string;
    comment?: string;
    preparationId?: string | null;
    homeworkId?: string | null;
  }) => ({
    studentId: lesson.studentId,
    dayOfWeek: lesson.dayOfWeek,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    meetLink: lesson.meetLink,
    comment: lesson.comment,
    preparationId: lesson.preparationId,
    homeworkId: lesson.homeworkId,
  }),

  interval: (interval: { startTime: Date; endTime?: Date }) => ({
    startTime: interval.startTime.toISOString(),
    endTime: interval.endTime?.toISOString(),
  }),

  preparation: (preparation: {
    taskNumber: string;
    method: 'program' | 'analytics' | 'excel';
    title: string;
    message: string;
  }) => ({
    taskNumber: preparation.taskNumber,
    method: preparation.method,
    title: preparation.title,
    message: preparation.message,
  }),

  homework: (homework: {
    taskNumber: string;
    title: string;
    link?: string;
  }) => ({
    taskNumber: homework.taskNumber,
    title: homework.title,
    link: homework.link,
  }),

  trial: (trial: {
    orderNumber: number;
    difficultyLevel: 'easy' | 'ege' | 'advanced';
    title: string;
    link: string;
  }) => ({
    orderNumber: trial.orderNumber,
    difficultyLevel: trial.difficultyLevel,
    title: trial.title,
    link: trial.link,
  }),

  studentTrial: (studentTrial: {
    studentId: string;
    trialId: string;
    deadline: Date;
    comment?: string;
    complications?: string;
  }) => ({
    studentId: studentTrial.studentId,
    trialId: studentTrial.trialId,
    deadline: studentTrial.deadline.toISOString(),
    comment: studentTrial.comment,
    complications: studentTrial.complications,
  }),

  trialResult: (trialResult: {
    studentTrialId?: string;
    taskScores: number[];
    primaryScore: number;
    secondaryScore: number;
  }) => {
    const payload: Record<string, unknown> = {
      taskScores: trialResult.taskScores,
      primaryScore: trialResult.primaryScore,
      secondaryScore: trialResult.secondaryScore,
    };
    if (trialResult.studentTrialId !== undefined) {
      payload.studentTrialId = trialResult.studentTrialId;
    }
    return payload;
  },
};
