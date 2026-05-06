import { Router } from 'express';
import { TrajectoryService } from '../services/trajectory.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/:studentId/trajectory',
  asyncHandler(async (req, res) => {
    const items = await TrajectoryService.getTrajectory(req.user.id, req.params.studentId);
    res.json(items);
  }),
);

router.post(
  '/:studentId/trajectory',
  asyncHandler(async (req, res) => {
    const item = await TrajectoryService.addItem(req.user.id, req.params.studentId, req.body);
    res.status(201).json(item);
  }),
);

router.post(
  '/:studentId/trajectory/batch',
  asyncHandler(async (req, res) => {
    const items = await TrajectoryService.addItems(req.user.id, req.params.studentId, req.body.items);
    res.status(201).json(items);
  }),
);

router.put(
  '/:studentId/trajectory/reorder',
  asyncHandler(async (req, res) => {
    const items = await TrajectoryService.reorder(req.user.id, req.params.studentId, req.body.orderedIds);
    res.json(items);
  }),
);

router.post(
  '/:studentId/trajectory/apply-next',
  asyncHandler(async (req, res) => {
    const result = await TrajectoryService.applyNextItem(
      req.user.id,
      req.params.studentId,
      req.body?.target,
    );
    res.json(result);
  }),
);

router.post(
  '/:studentId/trajectory/:itemId/skip',
  asyncHandler(async (req, res) => {
    const items = await TrajectoryService.skipItem(req.user.id, req.params.studentId, req.params.itemId);
    res.json(items);
  }),
);

router.delete(
  '/:studentId/trajectory/:itemId',
  asyncHandler(async (req, res) => {
    const result = await TrajectoryService.removeItem(req.user.id, req.params.studentId, req.params.itemId);
    res.json(result);
  }),
);

export const trajectoryRouter = router;
