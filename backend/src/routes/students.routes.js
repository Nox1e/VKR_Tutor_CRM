import { Router } from 'express';
import { z } from 'zod';
import { StudentsService } from '../services/students.service.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const createStudentSchema = z.object({
  name: z.string().nonempty('Имя ученика обязательно'),
  photoData: z.string().optional(),
});

const addPaymentSchema = z.object({
  lessonsCount: z.coerce
    .number({ invalid_type_error: 'lessonsCount обязателен' })
    .int()
    .positive('Количество занятий должно быть положительным'),
  amount: z.coerce
    .number({ invalid_type_error: 'amount обязателен' })
    .positive('Сумма должна быть положительной'),
});

const idParamSchema = z.object({
  id: z.string().nonempty('Идентификатор ученика обязателен'),
});

const lessonsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.enum(['planned', 'active', 'completed', 'archived']).optional(),
});

const paidLessonsCountSchema = z.object({
  count: z.coerce.number().int(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const students = await StudentsService.getStudents(req.user.id);
    res.json(students);
  }),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const student = await StudentsService.getStudentById(req.user.id, req.params.id);
    res.json(student);
  }),
);

router.get(
  '/:id/lessons',
  validateRequest({ params: idParamSchema, query: lessonsQuerySchema }),
  asyncHandler(async (req, res) => {
    const lessons = await StudentsService.getLessonsForStudent(req.user.id, req.params.id, req.query);
    res.json(lessons);
  }),
);

router.get(
  '/:id/scheduled-lessons',
  validateRequest({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const lessons = await StudentsService.getScheduledLessonsForStudent(req.user.id, req.params.id);
    res.json(lessons);
  }),
);

router.post(
  '/',
  validateRequest({ body: createStudentSchema }),
  asyncHandler(async (req, res) => {
    const student = await StudentsService.createStudent(req.user.id, {
      name: req.body.name,
      photoData: req.body.photoData,
    });
    res.status(201).json(student);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const student = await StudentsService.updateStudent(req.user.id, req.params.id, req.body);
    res.json(student);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await StudentsService.deleteStudent(req.user.id, req.params.id);
    res.json(result);
  }),
);

router.post(
  '/:id/payment',
  validateRequest({ body: addPaymentSchema }),
  asyncHandler(async (req, res) => {
    const student = await StudentsService.addPayment(req.user.id, req.params.id, req.body);
    res.json(student);
  }),
);

router.get(
  '/:id/payment-history',
  asyncHandler(async (req, res) => {
    const history = await StudentsService.getPaymentHistoryForStudent(req.user.id, req.params.id);
    res.json(history);
  }),
);

router.put(
  '/:id/paid-lessons-count',
  validateRequest({ params: idParamSchema, body: paidLessonsCountSchema }),
  asyncHandler(async (req, res) => {
    const student = await StudentsService.setPaidLessonsCount(req.user.id, req.params.id, req.body.count);
    res.json(student);
  }),
);

export const studentsRouter = router;
