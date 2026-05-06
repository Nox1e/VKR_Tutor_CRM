import { Router } from 'express';
import { TrialsService } from '../services/trials.service.js';
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
    const trials = await TrialsService.listTrials(req.user.id, { tagIds });
    res.json(trials);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const trial = await TrialsService.createTrial(req.user.id, req.body);
    res.status(201).json(trial);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const trial = await TrialsService.updateTrial(req.user.id, req.params.id, req.body);
    res.json(trial);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await TrialsService.deleteTrial(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const trialsRouter = router;
