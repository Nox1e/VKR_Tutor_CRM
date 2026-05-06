import { Router } from 'express';
import { TrialTagsService } from '../services/trial-tags.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tags = await TrialTagsService.listTags(req.user.id);
    res.json(tags);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const tag = await TrialTagsService.createTag(req.user.id, req.body);
    res.status(201).json(tag);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const tag = await TrialTagsService.updateTag(req.user.id, req.params.id, req.body);
    res.json(tag);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await TrialTagsService.deleteTag(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const trialTagsRouter = router;
