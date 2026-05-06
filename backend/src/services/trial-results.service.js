import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { TrialResultsRepository } from '../repositories/trial-results.repository.js';
import { StudentTrialsRepository } from '../repositories/student-trials.repository.js';

// task_scores is stored as JSONB. The API now accepts either an already-parsed
// array (preferred) or a JSON string (legacy clients) — we coerce here.
const taskScoresSchema = z.union([
  z.array(z.number()),
  z.string().transform((s) => {
    try {
      return JSON.parse(s);
    } catch {
      throw new Error('taskScores: невалидный JSON');
    }
  }),
]);

const createSchema = z.object({
  studentTrialId: z.string().nonempty('studentTrialId обязателен'),
  taskScores: taskScoresSchema,
  primaryScore: z.coerce.number({ invalid_type_error: 'primaryScore обязателен' }),
  secondaryScore: z.coerce.number({ invalid_type_error: 'secondaryScore обязателен' }),
});

const updateSchema = z.object({
  taskScores: taskScoresSchema,
  primaryScore: z.coerce.number({ invalid_type_error: 'primaryScore обязателен' }),
  secondaryScore: z.coerce.number({ invalid_type_error: 'secondaryScore обязателен' }),
});

export const TrialResultsService = {
  getResultsForStudentTrial: async (userId, studentTrialId) => {
    if (!studentTrialId) {
      throw new HttpError(400, 'studentTrialId обязателен');
    }
    return TrialResultsRepository.findByStudentTrialId(prisma, userId, studentTrialId);
  },

  getEnrichedResults: async (userId, { studentId } = {}) =>
    TrialResultsRepository.findEnriched(prisma, userId, { studentId }),

  createTrialResult: async (userId, payload) => {
    const parsed = createSchema.parse(payload);

    const studentTrial = await StudentTrialsRepository.findById(prisma, userId, parsed.studentTrialId);
    if (!studentTrial) {
      throw new HttpError(404, 'Пробник ученика не найден');
    }

    const id = randomUUID();
    await TrialResultsRepository.insert(prisma, userId, {
      id,
      studentTrialId: parsed.studentTrialId,
      taskScores: parsed.taskScores,
      primaryScore: parsed.primaryScore,
      secondaryScore: parsed.secondaryScore,
    });

    return TrialResultsRepository.findById(prisma, userId, id);
  },

  updateTrialResult: async (userId, id, payload) => {
    const parsed = updateSchema.parse(payload);

    const result = await TrialResultsRepository.updateById(prisma, userId, id, {
      taskScores: parsed.taskScores,
      primaryScore: parsed.primaryScore,
      secondaryScore: parsed.secondaryScore,
    });
    if (result.count === 0) {
      throw new HttpError(404, 'Результат пробника не найден');
    }
    return TrialResultsRepository.findById(prisma, userId, id);
  },

  deleteTrialResult: async (userId, id) => {
    const result = await TrialResultsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Результат пробника не найден');
    }
    return { message: 'Результат пробника удален', deletedId: id };
  },
};
