import { Router } from 'express';
import { PreparationsService } from '../services/preparations.service.js';
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
    const preparations = await PreparationsService.listPreparations(req.user.id, { tagIds });
    res.json(preparations);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const preparation = await PreparationsService.createPreparation(req.user.id, req.body);
    res.status(201).json(preparation);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const preparation = await PreparationsService.updatePreparation(req.user.id, req.params.id, req.body);
    res.json(preparation);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await PreparationsService.deletePreparation(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const preparationsRouter = router;
