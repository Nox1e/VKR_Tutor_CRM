import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { studentsRouter } from './routes/students.routes.js';
import { paymentHistoryRouter } from './routes/payment-history.routes.js';
import { lessonsRouter } from './routes/lessons.routes.js';
import { intervalsRouter } from './routes/intervals.routes.js';
import { scheduledLessonsRouter } from './routes/scheduled-lessons.routes.js';
import { preparationsRouter } from './routes/preparations.routes.js';
import { homeworksRouter } from './routes/homeworks.routes.js';
import { trialsRouter } from './routes/trials.routes.js';
import { preparationTagsRouter } from './routes/preparation-tags.routes.js';
import { homeworkTagsRouter } from './routes/homework-tags.routes.js';
import { trialTagsRouter } from './routes/trial-tags.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { studentTrialsRouter } from './routes/student-trials.routes.js';
import { trialResultsRouter } from './routes/trial-results.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { trajectoryRouter } from './routes/trajectory.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { requireAuth } from './middlewares/require-auth.js';
import { loginRateLimit, generalRateLimit } from './middlewares/rate-limit.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found-handler.js';

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    if (config.cors.origins.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error(`CORS: origin "${origin}" не в whitelist`));
  },
  credentials: true,
};

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(morgan('combined'));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth/login', loginRateLimit);
  app.use('/api/auth', authRouter);

  app.use('/api', generalRateLimit);
  app.use('/api', requireAuth);

  app.use('/api/students', studentsRouter);
  app.use('/api/payment-history', paymentHistoryRouter);
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/intervals', intervalsRouter);
  app.use('/api/scheduled-lessons', scheduledLessonsRouter);
  app.use('/api/preparations', preparationsRouter);
  app.use('/api/homeworks', homeworksRouter);
  app.use('/api/trials', trialsRouter);
  app.use('/api/preparation-tags', preparationTagsRouter);
  app.use('/api/homework-tags', homeworkTagsRouter);
  app.use('/api/trial-tags', trialTagsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/student-trials', studentTrialsRouter);
  app.use('/api/trial-results', trialResultsRouter);
  app.use('/api', adminRouter);
  app.use('/api/students', trajectoryRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
