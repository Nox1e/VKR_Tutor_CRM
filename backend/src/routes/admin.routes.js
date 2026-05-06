import { Router } from 'express';
import { AdminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { importPayloadSchema } from '../../../shared/api/contracts.js';

const router = Router();

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const data = await AdminService.exportData(req.user.id);
    res.json(data);
  }),
);

router.post(
  '/import',
  validateRequest({ body: importPayloadSchema }),
  asyncHandler(async (req, res) => {
    const result = await AdminService.importData(req.user.id, req.body);
    res.json(result);
  }),
);

router.delete(
  '/clear',
  asyncHandler(async (req, res) => {
    const result = await AdminService.clearAllData(req.user.id);
    res.json(result);
  }),
);

export const adminRouter = router;
