import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { LessonsRepository } from '../repositories/lessons.repository.js';
import { StudentsRepository } from '../repositories/students.repository.js';
import { IntervalsRepository } from '../repositories/intervals.repository.js';

const toDate = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `Неверная дата: ${value}`);
  }
  return parsed;
};

const optionalString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'null' ? undefined : trimmed;
};

const nullableString = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'null' ? null : trimmed;
};

const createLessonSchema = z.object({
  studentId: z.string().nonempty('studentId обязателен'),
  startTime: z.string().nonempty('startTime обязателен'),
  endTime: z.string().nonempty('endTime обязателен'),
  meetLink: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  isScheduled: z.boolean().optional(),
  status: z.string().optional(),
  preparationId: z.string().nullable().optional(),
  homeworkId: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
});

const LESSON_UPDATABLE_FIELDS = new Set([
  'studentId',
  'startTime',
  'endTime',
  'meetLink',
  'comment',
  'isScheduled',
  'status',
  'preparationId',
  'homeworkId',
  'isPaid',
]);

const pickLessonUpdate = (payload) => {
  const result = {};
  for (const [key, raw] of Object.entries(payload ?? {})) {
    if (!LESSON_UPDATABLE_FIELDS.has(key)) continue;

    if (key === 'startTime' || key === 'endTime') {
      const value = toDate(raw);
      if (value !== null) result[key] = value;
      continue;
    }
    if (key === 'isScheduled' || key === 'isPaid') {
      if (typeof raw === 'boolean') result[key] = raw;
      continue;
    }
    if (key === 'preparationId' || key === 'homeworkId' || key === 'meetLink' || key === 'comment') {
      result[key] = nullableString(raw);
      continue;
    }
    if (key === 'status') {
      const v = optionalString(raw);
      if (v !== undefined) result[key] = v;
      continue;
    }
    if (key === 'studentId') {
      const v = optionalString(raw);
      if (v !== undefined) result[key] = v;
      continue;
    }
  }
  return result;
};

export const LessonsService = {
  listLessons: (userId) => LessonsRepository.findAll(prisma, userId),

  createLesson: async (userId, payload) => {
    const parsed = createLessonSchema.parse(payload);
    const startTime = toDate(parsed.startTime);
    const endTime = toDate(parsed.endTime);

    const created = await prisma.$transaction(async (tx) => {
      const student = await StudentsRepository.findById(tx, userId, parsed.studentId);
      if (!student) {
        throw new HttpError(404, 'Ученик не найден');
      }

      // Idempotency guard: if a lesson with the same (userId, studentId,
      // startTime) already exists, return it instead of creating a duplicate.
      // Multiple frontend instances of useMaterializeWeek() can race during
      // page navigation / StrictMode double-mount, and we don't want each of
      // them to slot in a parallel copy of the same calendar entry.
      const conflict = await tx.lesson.findFirst({
        where: { userId, studentId: parsed.studentId, startTime },
      });
      if (conflict) {
        return { lesson: conflict, alreadyExisted: true };
      }

      // Balance is no longer consumed at create time. The lesson-completion
      // worker consumes one credit when end_time elapses, so auto-materialised
      // future weeks don't drain the prepaid balance ahead of time.
      const isExplicitlyPaid = parsed.isPaid === true;
      const lessonId = generateId('lesson');

      await LessonsRepository.insert(tx, userId, {
        id: lessonId,
        studentId: parsed.studentId,
        startTime,
        endTime,
        meetLink: nullableString(parsed.meetLink),
        comment: nullableString(parsed.comment),
        isScheduled: parsed.isScheduled ?? false,
        status: parsed.status ?? 'planned',
        preparationId: parsed.preparationId ?? null,
        homeworkId: parsed.homeworkId ?? null,
        isPaid: isExplicitlyPaid,
      });

      if (isExplicitlyPaid && (student.paidLessonsCount ?? 0) > 0) {
        await StudentsRepository.decrementPaidLessons(tx, userId, parsed.studentId, 1);
      }

      return { lesson: { id: lessonId }, alreadyExisted: false };
    });

    return LessonsRepository.findById(prisma, userId, created.lesson.id);
  },

  updateLesson: async (userId, lessonId, payload) => {
    const updateData = pickLessonUpdate(payload);
    if (Object.keys(updateData).length === 0) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    await prisma.$transaction(async (tx) => {
      const current = await LessonsRepository.findById(tx, userId, lessonId);
      if (!current) {
        throw new HttpError(404, 'Занятие не найдено');
      }

      if (updateData.studentId) {
        const student = await StudentsRepository.findById(tx, userId, updateData.studentId);
        if (!student) {
          throw new HttpError(404, 'Ученик не найден');
        }
      }

      // Reschedule-revert: a completed+paid lesson moved to the future
      // becomes planned again and the balance is refunded.
      let rescheduledRevert = false;
      if (
        updateData.endTime !== undefined &&
        current.status === 'completed' &&
        current.isPaid === true
      ) {
        if (updateData.endTime.getTime() > Date.now()) {
          rescheduledRevert = true;
          updateData.status = 'planned';
          updateData.isPaid = false;
          await StudentsRepository.incrementPaidLessons(tx, userId, current.studentId, 1);
        }
      }

      if (!rescheduledRevert && updateData.isPaid !== undefined) {
        if (updateData.isPaid !== current.isPaid) {
          if (updateData.isPaid) {
            await StudentsRepository.decrementPaidLessons(tx, userId, current.studentId, 1);
          } else {
            await StudentsRepository.incrementPaidLessons(tx, userId, current.studentId, 1);
          }
        }
      }

      await LessonsRepository.updateById(tx, userId, lessonId, updateData);
    });

    return LessonsRepository.findById(prisma, userId, lessonId);
  },

  deleteLesson: async (userId, lessonId) => {
    await prisma.$transaction(async (tx) => {
      const current = await LessonsRepository.findById(tx, userId, lessonId);
      if (!current) {
        throw new HttpError(404, 'Занятие не найдено');
      }

      await LessonsRepository.deleteById(tx, userId, lessonId);

      if (current.isPaid) {
        await StudentsRepository.incrementPaidLessons(tx, userId, current.studentId, 1);
      }
    });

    return { message: 'Занятие удалено', deletedId: lessonId };
  },

  getIntervals: (userId, lessonId) => IntervalsRepository.findByLessonId(prisma, userId, lessonId),

  createInterval: async (userId, lessonId, payload) => {
    const schema = z.object({
      startTime: z.string().nonempty('startTime обязателен'),
      endTime: z.string().optional().nullable(),
    });

    const parsed = schema.parse(payload);
    const lesson = await LessonsRepository.findById(prisma, userId, lessonId);
    if (!lesson) {
      throw new HttpError(404, 'Занятие не найдено');
    }

    const intervalId = generateId('interval');
    await IntervalsRepository.insert(prisma, userId, {
      id: intervalId,
      lessonId,
      startTime: toDate(parsed.startTime),
      endTime: parsed.endTime ? toDate(parsed.endTime) : null,
    });

    return IntervalsRepository.findById(prisma, userId, intervalId);
  },

  updateInterval: async (userId, intervalId, payload) => {
    const updates = {};
    if (payload.startTime !== undefined) {
      updates.startTime = toDate(payload.startTime);
    }
    if (payload.endTime !== undefined) {
      updates.endTime = payload.endTime ? toDate(payload.endTime) : null;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    const result = await IntervalsRepository.updateById(prisma, userId, intervalId, updates);
    if (result.count === 0) {
      throw new HttpError(404, 'Интервал не найден');
    }
    return IntervalsRepository.findById(prisma, userId, intervalId);
  },

  deleteInterval: async (userId, intervalId) => {
    const result = await IntervalsRepository.deleteById(prisma, userId, intervalId);
    if (result.count === 0) {
      throw new HttpError(404, 'Интервал не найден');
    }
    return { message: 'Интервал удален', deletedId: intervalId };
  },
};
