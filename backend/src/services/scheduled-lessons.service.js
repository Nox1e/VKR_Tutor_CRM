import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { ScheduledLessonsRepository } from '../repositories/scheduled-lessons.repository.js';
import { StudentsRepository } from '../repositories/students.repository.js';

const createSchema = z.object({
  studentId: z.string().nonempty('studentId обязателен'),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().nonempty('startTime обязателен'),
  endTime: z.string().nonempty('endTime обязателен'),
  meetLink: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  preparationId: z.string().optional().nullable(),
  homeworkId: z.string().optional().nullable(),
});

const UPDATABLE_FIELDS = new Set([
  'studentId',
  'dayOfWeek',
  'startTime',
  'endTime',
  'meetLink',
  'comment',
  'preparationId',
  'homeworkId',
]);

const pickUpdate = (payload) => {
  const result = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (!UPDATABLE_FIELDS.has(key)) continue;
    if (key === 'dayOfWeek') {
      result[key] = Number.parseInt(value, 10);
      continue;
    }
    result[key] = value === '' ? null : value;
  }
  return result;
};

export const ScheduledLessonsService = {
  listScheduledLessons: (userId) => ScheduledLessonsRepository.findAll(prisma, userId),

  createScheduledLesson: async (userId, payload) => {
    const parsed = createSchema.parse(payload);

    const student = await StudentsRepository.findById(prisma, userId, parsed.studentId);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }

    const id = generateId('scheduled');
    await ScheduledLessonsRepository.insert(prisma, userId, {
      id,
      studentId: parsed.studentId,
      dayOfWeek: parsed.dayOfWeek,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      meetLink: parsed.meetLink ?? null,
      comment: parsed.comment ?? null,
      preparationId: parsed.preparationId ?? null,
      homeworkId: parsed.homeworkId ?? null,
    });

    return ScheduledLessonsRepository.findById(prisma, userId, id);
  },

  updateScheduledLesson: async (userId, id, payload) => {
    const updateData = pickUpdate(payload);
    if (Object.keys(updateData).length === 0) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    if (updateData.studentId) {
      const student = await StudentsRepository.findById(prisma, userId, updateData.studentId);
      if (!student) {
        throw new HttpError(404, 'Ученик не найден');
      }
    }

    const result = await ScheduledLessonsRepository.updateById(prisma, userId, id, updateData);
    if (result.count === 0) {
      throw new HttpError(404, 'Плановое занятие не найдено');
    }
    return ScheduledLessonsRepository.findById(prisma, userId, id);
  },

  deleteScheduledLesson: async (userId, id) => {
    const result = await ScheduledLessonsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Плановое занятие не найдено');
    }
    return { message: 'Плановое занятие удалено', deletedId: id };
  },
};
