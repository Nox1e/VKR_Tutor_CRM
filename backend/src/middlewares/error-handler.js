import { HttpError } from '../errors/http-error.js';

const formatZodError = (error) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err?.name === 'ZodError') {
    res.status(400).json({
      error: 'Ошибка валидации',
      details: formatZodError(err),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      details: err.details ?? null,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Необработанная ошибка:', err);

  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
  });
};
