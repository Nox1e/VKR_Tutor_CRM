import { Router } from 'express';
import { NotificationsService } from '../services/notifications.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await NotificationsService.list(req.user.id);
    res.json(items);
  }),
);

router.post(
  '/mark-all-read',
  asyncHandler(async (req, res) => {
    const result = await NotificationsService.markAllRead(req.user.id);
    res.json(result);
  }),
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const result = await NotificationsService.markRead(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const notificationsRouter = router;
