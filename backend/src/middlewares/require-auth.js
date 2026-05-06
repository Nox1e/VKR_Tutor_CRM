import { HttpError } from '../errors/http-error.js';
import { verifyAccessToken } from '../auth/jwt.js';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new HttpError(401, 'Требуется авторизация'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new HttpError(401, 'Требуется авторизация'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Access-токен недействителен или истёк'));
  }
};
