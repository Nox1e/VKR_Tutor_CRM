import { Router } from 'express';
import { TrialResultsService } from '../services/trial-results.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.query.studentTrialId) {
      const results = await TrialResultsService.getResultsForStudentTrial(req.user.id, req.query.studentTrialId);
      res.json(results);
      return;
    }
    const results = await TrialResultsService.getEnrichedResults(req.user.id, {
      studentId: req.query.studentId || undefined,
    });
    res.json(results);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await TrialResultsService.createTrialResult(req.user.id, req.body);
    res.status(201).json(result);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await TrialResultsService.updateTrialResult(req.user.id, req.params.id, req.body);
    res.json(result);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await TrialResultsService.deleteTrialResult(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const trialResultsRouter = router;
