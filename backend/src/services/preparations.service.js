import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { PreparationsRepository } from '../repositories/preparations.repository.js';
import { PreparationTagsRepository } from '../repositories/preparation-tags.repository.js';

const methodEnum = ['program', 'analytics', 'excel'];

const tagIdsSchema = z.array(z.string()).optional();

const createSchema = z.object({
  taskNumber: z.string().nonempty('taskNumber обязателен'),
  method: z.enum(methodEnum, {
    errorMap: () => ({ message: 'method должен быть program, analytics или excel' }),
  }),
  title: z.string().nonempty('title обязателен'),
  message: z.string().nonempty('message обязателен'),
  tagIds: tagIdsSchema,
});

const assertTagsBelongToUser = async (userId, tagIds) => {
  if (!tagIds || tagIds.length === 0) return;
  const tags = await PreparationTagsRepository.findAll(prisma, userId);
  const allowed = new Set(tags.map((t) => t.id));
  for (const id of tagIds) {
    if (!allowed.has(id)) {
      throw new HttpError(400, `Тег ${id} не принадлежит пользователю`);
    }
  }
};

export const PreparationsService = {
  listPreparations: (userId, filter = {}) => PreparationsRepository.findAll(prisma, userId, filter),

  createPreparation: async (userId, payload) => {
    const parsed = createSchema.parse(payload);
    await assertTagsBelongToUser(userId, parsed.tagIds);
    const id = generateId('preparation');
    await PreparationsRepository.insert(
      prisma,
      userId,
      {
        id,
        taskNumber: parsed.taskNumber,
        method: parsed.method,
        title: parsed.title,
        message: parsed.message,
      },
      { tagIds: parsed.tagIds },
    );
    return PreparationsRepository.findById(prisma, userId, id);
  },

  updatePreparation: async (userId, id, payload) => {
    const updateData = {};
    if (payload.taskNumber !== undefined) updateData.taskNumber = payload.taskNumber;
    if (payload.method !== undefined) {
      if (!methodEnum.includes(payload.method)) {
        throw new HttpError(400, 'method должен быть program, analytics или excel');
      }
      updateData.method = payload.method;
    }
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.message !== undefined) updateData.message = payload.message;

    const tagIds = payload.tagIds === undefined
      ? undefined
      : tagIdsSchema.parse(payload.tagIds);

    if (Object.keys(updateData).length === 0 && tagIds === undefined) {
      throw new HttpError(400, 'Не указаны поля для обновления');
    }

    if (tagIds !== undefined) {
      await assertTagsBelongToUser(userId, tagIds);
    }

    const result = await PreparationsRepository.updateById(prisma, userId, id, updateData, { tagIds });
    if (result.count === 0) {
      throw new HttpError(404, 'Подготовка не найдена');
    }
    return PreparationsRepository.findById(prisma, userId, id);
  },

  deletePreparation: async (userId, id) => {
    const result = await PreparationsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Подготовка не найдена');
    }
    return { message: 'Подготовка удалена', deletedId: id };
  },
};
