import { Router } from 'express';
import { z } from 'zod';
import { ScheduledLessonsService } from '../services/scheduled-lessons.service.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const createSchema = z.object({
  studentId: z.string().nonempty('studentId обязателен'),
  dayOfWeek: z.number({ invalid_type_error: 'dayOfWeek обязателен' }).int(),
  startTime: z.string().nonempty('startTime обязателен'),
  endTime: z.string().nonempty('endTime обязателен'),
  meetLink: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  preparationId: z.string().optional().nullable(),
  homeworkId: z.string().optional().nullable(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const lessons = await ScheduledLessonsService.listScheduledLessons(req.user.id);
    res.json(lessons);
  }),
);

router.post(
  '/',
  validateRequest({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const lesson = await ScheduledLessonsService.createScheduledLesson(req.user.id, req.body);
    res.status(201).json(lesson);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const lesson = await ScheduledLessonsService.updateScheduledLesson(req.user.id, req.params.id, req.body);
    res.json(lesson);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await ScheduledLessonsService.deleteScheduledLesson(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const scheduledLessonsRouter = router;
