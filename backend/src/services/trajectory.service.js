import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { HttpError } from '../errors/http-error.js';
import { generateId } from '../utils/generate-id.js';
import { TrajectoryRepository } from '../repositories/trajectory.repository.js';
import { StudentsRepository } from '../repositories/students.repository.js';
import { LessonsRepository } from '../repositories/lessons.repository.js';
import { ScheduledLessonsRepository } from '../repositories/scheduled-lessons.repository.js';

const addItemSchema = z.object({
  preparationId: z.string().nonempty('preparationId обязателен'),
  homeworkId: z.string().nullable().optional(),
});

// Find the schedule template that matches a lesson by exact day + start time.
const findMatchingTemplate = async (client, userId, lesson) => {
  const templates = await ScheduledLessonsRepository.findByStudentId(client, userId, lesson.studentId);
  if (templates.length === 0) return null;

  const lessonDate = lesson.startTime instanceof Date ? lesson.startTime : new Date(lesson.startTime);
  const dayOfWeek = lessonDate.getDay();
  const hours = String(lessonDate.getHours()).padStart(2, '0');
  const minutes = String(lessonDate.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  return templates.find((t) => t.dayOfWeek === dayOfWeek && t.startTime === timeStr) ?? null;
};

export const TrajectoryService = {
  getTrajectory: async (userId, studentId) => {
    const student = await StudentsRepository.findById(prisma, userId, studentId);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }
    return TrajectoryRepository.findByStudentId(prisma, userId, studentId);
  },

  addItem: async (userId, studentId, payload) => {
    const parsed = addItemSchema.parse(payload);

    const student = await StudentsRepository.findById(prisma, userId, studentId);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }

    const maxPos = await TrajectoryRepository.getMaxPosition(prisma, userId, studentId);
    const id = generateId('traj');

    await TrajectoryRepository.insert(prisma, userId, {
      id,
      studentId,
      preparationId: parsed.preparationId,
      homeworkId: parsed.homeworkId ?? null,
      position: maxPos + 1,
      status: 'queued',
    });

    return TrajectoryRepository.findById(prisma, userId, id);
  },

  addItems: async (userId, studentId, items) => {
    const student = await StudentsRepository.findById(prisma, userId, studentId);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await TrajectoryRepository.getMaxPosition(tx, userId, studentId);
      for (let i = 0; i < items.length; i += 1) {
        const parsed = addItemSchema.parse(items[i]);
        await TrajectoryRepository.insert(tx, userId, {
          id: generateId('traj'),
          studentId,
          preparationId: parsed.preparationId,
          homeworkId: parsed.homeworkId ?? null,
          position: maxPos + 1 + i,
          status: 'queued',
        });
      }
    });

    return TrajectoryRepository.findByStudentId(prisma, userId, studentId);
  },

  removeItem: async (userId, studentId, itemId) => {
    const item = await TrajectoryRepository.findById(prisma, userId, itemId);
    if (!item) {
      throw new HttpError(404, 'Элемент траектории не найден');
    }
    if (item.studentId !== studentId) {
      throw new HttpError(403, 'Элемент не принадлежит этому ученику');
    }
    if (item.status === 'consumed') {
      throw new HttpError(400, 'Нельзя удалить потреблённый элемент');
    }

    await TrajectoryRepository.deleteById(prisma, userId, itemId);
    return { message: 'Элемент удалён', deletedId: itemId };
  },

  reorder: async (userId, studentId, orderedIds) => {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new HttpError(400, 'orderedIds должен быть непустым массивом');
    }

    await prisma.$transaction(async (tx) => {
      await TrajectoryRepository.updatePositions(tx, userId, studentId, orderedIds);
    });

    return TrajectoryRepository.findByStudentId(prisma, userId, studentId);
  },

  /**
   * Complete a lesson: copy prep from template → lesson, clear template.
   * Trajectory refill is no longer automatic — the tutor explicitly applies
   * the next queued item via applyNextItem() from the student page.
   */
  handleLessonCompleted: async (userId, lessonId) => {
    const lesson = await LessonsRepository.findById(prisma, userId, lessonId);
    if (!lesson) {
      throw new HttpError(404, 'Занятие не найдено');
    }

    if (lesson.status === 'completed') {
      return { lesson, template: null, refilled: null };
    }

    let matchedTemplate = null;

    await prisma.$transaction(async (tx) => {
      if (lesson.status !== 'archived') {
        await LessonsRepository.updateById(tx, userId, lessonId, { status: 'completed' });
      }

      const template = await findMatchingTemplate(tx, userId, lesson);
      if (!template) return;

      matchedTemplate = template;

      const lessonUpdates = {};
      if (template.preparationId && !lesson.preparationId) {
        lessonUpdates.preparationId = template.preparationId;
      }
      if (template.homeworkId && !lesson.homeworkId) {
        lessonUpdates.homeworkId = template.homeworkId;
      }
      if (Object.keys(lessonUpdates).length > 0) {
        await LessonsRepository.updateById(tx, userId, lessonId, lessonUpdates);
      }

      await ScheduledLessonsRepository.updateById(tx, userId, template.id, {
        preparationId: null,
        homeworkId: null,
      });
    });

    const updatedLesson = await LessonsRepository.findById(prisma, userId, lessonId);
    return { lesson: updatedLesson, template: matchedTemplate, refilled: null };
  },

  /**
   * Tutor-driven application of the next queued trajectory item.
   * Target is either an existing Lesson or a ScheduledLesson template.
   * Marks the trajectory item as consumed.
   */
  applyNextItem: async (userId, studentId, target) => {
    const student = await StudentsRepository.findById(prisma, userId, studentId);
    if (!student) {
      throw new HttpError(404, 'Ученик не найден');
    }
    if (!target || (target.type !== 'lesson' && target.type !== 'scheduled') || !target.id) {
      throw new HttpError(400, 'Некорректная цель применения');
    }

    let appliedItem = null;

    await prisma.$transaction(async (tx) => {
      const nextItem = await TrajectoryRepository.findNextQueued(tx, userId, studentId);
      if (!nextItem) {
        throw new HttpError(404, 'В траектории нет элементов в очереди');
      }

      const updates = { preparationId: nextItem.preparationId };
      if (nextItem.homeworkId) updates.homeworkId = nextItem.homeworkId;

      if (target.type === 'lesson') {
        const lesson = await LessonsRepository.findById(tx, userId, target.id);
        if (!lesson || lesson.studentId !== studentId) {
          throw new HttpError(404, 'Занятие не найдено');
        }
        await LessonsRepository.updateById(tx, userId, target.id, updates);
      } else {
        const templates = await ScheduledLessonsRepository.findByStudentId(tx, userId, studentId);
        const template = templates.find((t) => t.id === target.id);
        if (!template) {
          throw new HttpError(404, 'Шаблон занятия не найден');
        }
        await ScheduledLessonsRepository.updateById(tx, userId, target.id, updates);
      }

      await TrajectoryRepository.updateStatus(tx, userId, nextItem.id, 'consumed', {
        consumedAt: new Date(),
      });

      appliedItem = nextItem;
    });

    return { appliedItem };
  },

  skipItem: async (userId, studentId, itemId) => {
    const item = await TrajectoryRepository.findById(prisma, userId, itemId);
    if (!item) {
      throw new HttpError(404, 'Элемент траектории не найден');
    }
    if (item.studentId !== studentId) {
      throw new HttpError(403, 'Элемент не принадлежит этому ученику');
    }
    if (item.status !== 'queued') {
      throw new HttpError(400, 'Можно пропустить только элемент в очереди');
    }

    await TrajectoryRepository.updateStatus(prisma, userId, item.id, 'skipped', {});
    return TrajectoryRepository.findByStudentId(prisma, userId, studentId);
  },
};
