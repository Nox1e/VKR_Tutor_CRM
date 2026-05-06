import { Router } from 'express';
import { StudentsService } from '../services/students.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const history = await StudentsService.getAllPaymentHistory(req.user.id);
    res.json(history);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await StudentsService.deletePaymentEntry(req.user.id, req.params.id);
    res.json(result);
  }),
);

export const paymentHistoryRouter = router;
