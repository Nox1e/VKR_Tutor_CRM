import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { TrialsRepository } from '../repositories/trials.repository.js';
import { TrialTagsRepository } from '../repositories/trial-tags.repository.js';

const tagIdsSchema = z.array(z.string()).optional();

const createSchema = z.object({
  orderNumber: z.coerce.number().int().positive('orderNumber обязателен'),
  difficultyLevel: z.enum(['easy', 'ege', 'advanced']),
  title: z.string().nonempty('title обязателен'),
  link: z.string().nonempty('link обязателен'),
  tagIds: tagIdsSchema,
});

const assertTagsBelongToUser = async (userId, tagIds) => {
  if (!tagIds || tagIds.length === 0) return;
  const tags = await TrialTagsRepository.findAll(prisma, userId);
  const allowed = new Set(tags.map((t) => t.id));
  for (const id of tagIds) {
    if (!allowed.has(id)) {
      throw new HttpError(400, `Тег ${id} не принадлежит пользователю`);
    }
  }
};

export const TrialsService = {
  listTrials: (userId, filter = {}) => TrialsRepository.findAll(prisma, userId, filter),

  createTrial: async (userId, payload) => {
    const parsed = createSchema.parse(payload);
    await assertTagsBelongToUser(userId, parsed.tagIds);
    const id = randomUUID();
    await TrialsRepository.insert(
      prisma,
      userId,
      {
        id,
        orderNumber: parsed.orderNumber,
        difficultyLevel: parsed.difficultyLevel,
        title: parsed.title,
        link: parsed.link,
      },
      { tagIds: parsed.tagIds },
    );
    return TrialsRepository.findById(prisma, userId, id);
  },

  updateTrial: async (userId, id, payload) => {
    const updateData = {};
    if (payload.orderNumber !== undefined) {
      updateData.orderNumber = createSchema.shape.orderNumber.parse(payload.orderNumber);
    }
    if (payload.difficultyLevel !== undefined) {
      updateData.difficultyLevel = createSchema.shape.difficultyLevel.parse(payload.difficultyLevel);
    }
    if (payload.title !== undefined) {
      updateData.title = createSchema.shape.title.parse(payload.title);
    }
    if (payload.link !== undefined) {
      updateData.link = createSchema.shape.link.parse(payload.link);
    }

    const tagIds = payload.tagIds === undefined
      ? undefined
      : tagIdsSchema.parse(payload.tagIds);

    if (Object.keys(updateData).length === 0 && tagIds === undefined) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    if (tagIds !== undefined) {
      await assertTagsBelongToUser(userId, tagIds);
    }

    const result = await TrialsRepository.updateById(prisma, userId, id, updateData, { tagIds });
    if (result.count === 0) {
      throw new HttpError(404, 'Пробник не найден');
    }
    return TrialsRepository.findById(prisma, userId, id);
  },

  deleteTrial: async (userId, id) => {
    const result = await TrialsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Пробник не найден');
    }
    return { message: 'Пробник удален', deletedId: id };
  },
};
