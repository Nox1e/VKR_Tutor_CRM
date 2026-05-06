import { Router } from 'express';
import { StudentTrialsService } from '../services/student-trials.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const trials = await StudentTrialsService.listStudentTrials(req.user.id, {
      studentId: req.query.studentId,
    });
    res.json(trials);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const trial = await StudentTrialsService.createStudentTrial(req.user.id, req.body);
    res.status(201).json(trial);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const trial = await StudentTrialsService.updateStudentTrial(req.user.id, req.params.id, req.body);
    res.json(trial);
  }),
);

router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const trial = await StudentTrialsService.completeStudentTrial(req.user.id, req.params.id);
    res.json(trial);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await StudentTrialsService.deleteStudentTrial(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const studentTrialsRouter = router;
