import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validate-request.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { AuthService } from './auth.service.js';
import { config } from '../config/index.js';
import { loginRateLimit } from '../middlewares/rate-limit.js';

const REFRESH_COOKIE = 'rt';

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  inviteCode: z.string().min(1).max(64),
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: 'strict',
  path: '/api/auth',
  domain: config.cookie.domain,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: 'strict',
  path: '/api/auth',
  domain: config.cookie.domain,
});

const requestMeta = (req) => ({
  userAgent: req.headers['user-agent'] ?? null,
  ipAddress: req.ip ?? null,
});

export const authRouter = Router();

authRouter.post('/login', validateRequest({ body: loginSchema }), async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.login(req.body, requestMeta(req));
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/register',
  loginRateLimit,
  validateRequest({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { user, accessToken, refreshToken } = await AuthService.register(
        req.body,
        requestMeta(req),
      );
      res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
      res.status(201).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const result = await AuthService.refresh({ refreshToken }, requestMeta(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await AuthService.logout({ refreshToken });
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    const result = await AuthService.logoutAll(req.user.id);
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await AuthService.me(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
