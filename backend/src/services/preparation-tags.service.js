import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { PreparationTagsRepository } from '../repositories/preparation-tags.repository.js';

const nameSchema = z.string().trim().min(1, 'Имя тега не может быть пустым').max(64, 'Имя тега слишком длинное');
const colorSchema = z.string().trim().max(32).optional().nullable();

const createSchema = z.object({
  name: nameSchema,
  color: colorSchema,
});

const updateSchema = z.object({
  name: nameSchema.optional(),
  color: colorSchema,
});

export const PreparationTagsService = {
  listTags: (userId) => PreparationTagsRepository.findAll(prisma, userId),

  createTag: async (userId, payload) => {
    const parsed = createSchema.parse(payload);
    const existing = await PreparationTagsRepository.findByName(prisma, userId, parsed.name);
    if (existing) {
      throw new HttpError(409, 'Тег с таким именем уже существует');
    }
    const id = generateId('preptag');
    await PreparationTagsRepository.insert(prisma, userId, {
      id,
      name: parsed.name,
      color: parsed.color ?? null,
    });
    return PreparationTagsRepository.findById(prisma, userId, id);
  },

  updateTag: async (userId, id, payload) => {
    const parsed = updateSchema.parse(payload);
    const data = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.color !== undefined) data.color = parsed.color ?? null;
    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'Нет данных для обновления');
    }
    if (data.name) {
      const dup = await PreparationTagsRepository.findByName(prisma, userId, data.name);
      if (dup && dup.id !== id) {
        throw new HttpError(409, 'Тег с таким именем уже существует');
      }
    }
    const result = await PreparationTagsRepository.updateById(prisma, userId, id, data);
    if (result.count === 0) {
      throw new HttpError(404, 'Тег не найден');
    }
    return PreparationTagsRepository.findById(prisma, userId, id);
  },

  deleteTag: async (userId, id) => {
    const result = await PreparationTagsRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Тег не найден');
    }
    return { message: 'Тег удалён', deletedId: id };
  },
};
