import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { StudentTrialsRepository } from '../repositories/student-trials.repository.js';
import { StudentsRepository } from '../repositories/students.repository.js';
import { TrialsRepository } from '../repositories/trials.repository.js';

const createSchema = z.object({
  studentId: z.string().nonempty('studentId обязателен'),
  trialId: z.string().nonempty('trialId обязателен'),
  deadline: z.string().nonempty('deadline обязателен'),
  comment: z.string().optional().nullable(),
  complications: z.string().optional().nullable(),
});

const updateSchema = z
  .object({
    trialId: z.string().optional(),
    deadline: z.string().optional(),
    comment: z.string().nullable().optional(),
    complications: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Нет полей для обновления',
  });

export const StudentTrialsService = {
  listStudentTrials: (userId, filters) =>
    StudentTrialsRepository.findAll(prisma, userId, filters ?? {}),

  createStudentTrial: async (userId, payload) => {
    const parsed = createSchema.parse(payload);

    const [student, trial] = await Promise.all([
      StudentsRepository.findById(prisma, userId, parsed.studentId),
      TrialsRepository.findById(prisma, userId, parsed.trialId),
    ]);

    if (!student) throw new HttpError(404, 'Ученик не найден');
    if (!trial) throw new HttpError(404, 'Пробник не найден');

    const id = randomUUID();
    await StudentTrialsRepository.insert(prisma, userId, {
      id,
      studentId: parsed.studentId,
      trialId: parsed.trialId,
      deadline: new Date(parsed.deadline),
      comment: parsed.comment ?? null,
      complications: parsed.complications ?? null,
      status: 'assigned',
    });

    return StudentTrialsRepository.findDetailedById(prisma, userId, id);
  },

  updateStudentTrial: async (userId, id, payload) => {
    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.errors?.[0]?.message ?? 'Нет полей для обновления');
    }

    const updateData = { ...parsed.data };
    if (updateData.deadline !== undefined) updateData.deadline = new Date(updateData.deadline);
    if (updateData.completedAt !== undefined) {
      updateData.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : null;
    }

    const result = await StudentTrialsRepository.updateById(prisma, userId, id, updateData);
    if (result.count === 0) {
      throw new HttpError(404, 'Пробник ученика не найден');
    }
    return StudentTrialsRepository.findDetailedById(prisma, userId, id);
  },

  completeStudentTrial: async (userId, id) => {
    const result = await StudentTrialsRepository.updateById(prisma, userId, id, {
      status: 'completed',
      completedAt: new Date(),
    });
    if (result.count === 0) {
      throw new HttpError(404, 'Пробник ученика не найден');
    }
    return StudentTrialsRepository.findDetailedById(prisma, userId, id);
  },

  deleteStudentTrial: async (userId, id) => {
    const result = await StudentTrialsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Пробник ученика не найден');
    }
    return { message: 'Пробник ученика удален', deletedId: id };
  },
};
