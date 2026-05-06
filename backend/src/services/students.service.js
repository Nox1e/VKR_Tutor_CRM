import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { StudentsRepository } from '../repositories/students.repository.js';
import { PaymentHistoryRepository } from '../repositories/payment-history.repository.js';
import { LessonsRepository } from '../repositories/lessons.repository.js';
import { ScheduledLessonsRepository } from '../repositories/scheduled-lessons.repository.js';

const paymentSchema = z.object({
  lessonsCount: z.coerce
    .number()
    .int()
    .positive('Количество занятий должно быть положительным'),
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
});

// Whitelist of fields the API can update on a Student. After ADR-005 the API
// is camelCase end-to-end, so we just guard against unknown keys.
const STUDENT_UPDATABLE_FIELDS = new Set([
  'name',
  'telegram',
  'phone',
  'birthDate',
  'timezone',
  'parentName',
  'parentTelegram',
  'parentPhone',
  'hourlyRate',
  'lessonsPerMonth',
  'lessonDuration',
  'paymentType',
  'monthlyRevenue',
  'acquisitionCost',
  'acquisitionSource',
  'photoData',
  'paidLessonsCount',
  'manualTaskProgress',
  'learningTrajectory',
  'color',
]);

const pickUpdatable = (payload) => {
  const result = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (STUDENT_UPDATABLE_FIELDS.has(key)) {
      result[key] = value === '' ? null : value;
    }
  }
  return result;
};

export const StudentsService = {
  getStudents: (userId) => StudentsRepository.findAll(prisma, userId),

  getStudentById: async (userId, id) => {
    const student = await StudentsRepository.findById(prisma, userId, id);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }
    return student;
  },

  createStudent: async (userId, { name, photoData }) => {
    if (!name) {
      throw new HttpError(400, 'Имя ученика обязательно');
    }
    const id = generateId('student');
    await StudentsRepository.insert(prisma, userId, {
      id,
      name,
      photoData: photoData ?? null,
    });
    return StudentsRepository.findById(prisma, userId, id);
  },

  updateStudent: async (userId, id, payload) => {
    const updateData = pickUpdatable(payload);
    if (Object.keys(updateData).length === 0) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    const result = await StudentsRepository.updateById(prisma, userId, id, updateData);
    if (result.count === 0) {
      throw new HttpError(404, 'Ученик не найден');
    }
    return StudentsRepository.findById(prisma, userId, id);
  },

  deleteStudent: async (userId, id) => {
    const result = await StudentsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Ученик не найден');
    }
    return { message: 'Ученик удален', deletedId: id };
  },

  addPayment: async (userId, studentId, payload) => {
    const parsed = paymentSchema.parse(payload);

    await prisma.$transaction(async (tx) => {
      const student = await StudentsRepository.findById(tx, userId, studentId);
      if (!student) {
        throw new HttpError(404, 'Ученик не найден');
      }

      await StudentsRepository.incrementPaidLessons(tx, userId, studentId, parsed.lessonsCount);

      const paymentId = generateId('payment');
      await PaymentHistoryRepository.insert(tx, userId, {
        id: paymentId,
        studentId,
        lessonsCount: parsed.lessonsCount,
        amount: parsed.amount,
      });

      const updatedCount = await LessonsRepository.markNextUnpaidLessonsAsPaid(
        tx,
        userId,
        studentId,
        parsed.lessonsCount,
      );
      if (updatedCount > 0) {
        await StudentsRepository.decrementPaidLessons(tx, userId, studentId, updatedCount);
      }
    });

    return StudentsRepository.findById(prisma, userId, studentId);
  },

  getPaymentHistoryForStudent: (userId, studentId) =>
    PaymentHistoryRepository.findByStudentId(prisma, userId, studentId),

  getLessonsForStudent: (userId, studentId, { limit, offset, status } = {}) =>
    LessonsRepository.findByStudentId(prisma, userId, {
      studentId,
      limit,
      offset,
      status,
    }),

  getScheduledLessonsForStudent: (userId, studentId) =>
    ScheduledLessonsRepository.findByStudentId(prisma, userId, studentId),

  getAllPaymentHistory: (userId) => PaymentHistoryRepository.findAll(prisma, userId),

  deletePaymentEntry: async (userId, paymentId) => {
    await prisma.$transaction(async (tx) => {
      const payment = await PaymentHistoryRepository.findById(tx, userId, paymentId);
      if (!payment) {
        throw new HttpError(404, 'Запись в истории оплат не найдена');
      }
      await PaymentHistoryRepository.deleteById(tx, userId, paymentId);
      await StudentsRepository.decrementPaidLessons(
        tx,
        userId,
        payment.studentId,
        payment.lessonsCount,
      );
    });

    return { message: 'Запись из истории оплат удалена', deletedId: paymentId };
  },

  setPaidLessonsCount: async (userId, studentId, count) => {
    const result = await StudentsRepository.setPaidLessonsCount(prisma, userId, studentId, count);
    if (result.count === 0) {
      throw new HttpError(404, 'Ученик не найден');
    }
    return StudentsRepository.findById(prisma, userId, studentId);
  },
};
