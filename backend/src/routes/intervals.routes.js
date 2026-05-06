import { Router } from 'express';
import { LessonsService } from '../services/lessons.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const interval = await LessonsService.updateInterval(req.user.id, req.params.id, req.body);
    res.json(interval);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await LessonsService.deleteInterval(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const intervalsRouter = router;
