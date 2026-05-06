import { Router } from 'express';
import { z } from 'zod';
import { LessonsService } from '../services/lessons.service.js';
import { TrajectoryService } from '../services/trajectory.service.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const createIntervalSchema = z.object({
  startTime: z.string().nonempty('startTime обязателен'),
  endTime: z.string().optional().nullable(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const lessons = await LessonsService.listLessons(req.user.id);
    res.json(lessons);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const lesson = await LessonsService.createLesson(req.user.id, req.body);
    res.status(201).json(lesson);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const lesson = await LessonsService.updateLesson(req.user.id, req.params.id, req.body);
    res.json(lesson);
  }),
);

router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const result = await TrajectoryService.handleLessonCompleted(req.user.id, req.params.id);
    res.json(result);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await LessonsService.deleteLesson(req.user.id, req.params.id);
    res.json(result);
  }),
);

router.get(
  '/:id/intervals',
  asyncHandler(async (req, res) => {
    const intervals = await LessonsService.getIntervals(req.user.id, req.params.id);
    res.json(intervals);
  }),
);

router.post(
  '/:id/intervals',
  validateRequest({ body: createIntervalSchema }),
  asyncHandler(async (req, res) => {
    const interval = await LessonsService.createInterval(req.user.id, req.params.id, req.body);
    res.status(201).json(interval);
  }),
);

export const lessonsRouter = router;
