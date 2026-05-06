import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { HomeworksRepository } from '../repositories/homeworks.repository.js';
import { HomeworkTagsRepository } from '../repositories/homework-tags.repository.js';

const tagIdsSchema = z.array(z.string()).optional();

const createSchema = z.object({
  taskNumber: z.string().nonempty('taskNumber обязателен'),
  title: z.string().nonempty('title обязателен'),
  link: z.string().nonempty('Укажите ссылку на материалы'),
  tagIds: tagIdsSchema,
});

const assertTagsBelongToUser = async (userId, tagIds) => {
  if (!tagIds || tagIds.length === 0) return;
  const tags = await HomeworkTagsRepository.findAll(prisma, userId);
  const allowed = new Set(tags.map((t) => t.id));
  for (const id of tagIds) {
    if (!allowed.has(id)) {
      throw new HttpError(400, `Тег ${id} не принадлежит пользователю`);
    }
  }
};

export const HomeworksService = {
  listHomeworks: (userId, filter = {}) => HomeworksRepository.findAll(prisma, userId, filter),

  createHomework: async (userId, payload) => {
    const parsed = createSchema.parse(payload);
    await assertTagsBelongToUser(userId, parsed.tagIds);
    const id = generateId('homework');
    await HomeworksRepository.insert(
      prisma,
      userId,
      {
        id,
        taskNumber: parsed.taskNumber,
        title: parsed.title,
        link: parsed.link,
      },
      { tagIds: parsed.tagIds },
    );
    return HomeworksRepository.findById(prisma, userId, id);
  },

  updateHomework: async (userId, id, payload) => {
    const updateData = {};
    if (payload.taskNumber !== undefined) updateData.taskNumber = payload.taskNumber;
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.link !== undefined) {
      if (typeof payload.link !== 'string' || payload.link.length === 0) {
        throw new HttpError(400, 'Укажите ссылку на материалы');
      }
      updateData.link = payload.link;
    }

    const tagIds = payload.tagIds === undefined
      ? undefined
      : tagIdsSchema.parse(payload.tagIds);

    if (Object.keys(updateData).length === 0 && tagIds === undefined) {
      throw new HttpError(400, 'Нет данных для обновления');
    }

    if (tagIds !== undefined) {
      await assertTagsBelongToUser(userId, tagIds);
    }

    const result = await HomeworksRepository.updateById(prisma, userId, id, updateData, { tagIds });
    if (result.count === 0) {
      throw new HttpError(404, 'Домашнее задание не найдено');
    }
    return HomeworksRepository.findById(prisma, userId, id);
  },

  deleteHomework: async (userId, id) => {
    const result = await HomeworksRepository.deleteById(prisma, userId, id);
    if (result.count === 0) {
      throw new HttpError(404, 'Домашнее задание не найдено');
    }
    return { message: 'Домашнее задание удалено', deletedId: id };
  },
};
