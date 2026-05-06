import rateLimit from 'express-rate-limit';

const jsonHandler = (_req, res) => {
  res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
};

export const loginRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

const generalMax = Number.parseInt(process.env.RATE_LIMIT_GENERAL_PER_MIN ?? '', 10);

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: Number.isFinite(generalMax) && generalMax > 0 ? generalMax : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
