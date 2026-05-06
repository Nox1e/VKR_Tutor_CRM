import { Router } from 'express';
import { HomeworksService } from '../services/homeworks.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const parseTagIdsQuery = (raw) => {
  if (!raw) return undefined;
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const cleaned = list.map((s) => s.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tagIds = parseTagIdsQuery(req.query.tagIds);
    const homeworks = await HomeworksService.listHomeworks(req.user.id, { tagIds });
    res.json(homeworks);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const homework = await HomeworksService.createHomework(req.user.id, req.body);
    res.status(201).json(homework);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const homework = await HomeworksService.updateHomework(req.user.id, req.params.id, req.body);
    res.json(homework);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await HomeworksService.deleteHomework(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const homeworksRouter = router;
