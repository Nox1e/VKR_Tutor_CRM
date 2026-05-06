import { HttpError } from '../errors/http-error.js';
import { prisma } from '../database/prisma.js';
import { AuthRepository } from './auth.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';

const sanitize = (user) => ({ id: user.id, email: user.email, role: user.role });

const issueRefresh = async (tx, user, meta = {}) => {
  const { token, jti, expiresAt } = signRefreshToken(user);
  await tx.refreshToken.create({
    data: {
      jti,
      userId: user.id,
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    },
  });
  return token;
};

export const AuthService = {
  async login({ email, password }, meta = {}) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) throw new HttpError(401, 'Неверный email или пароль');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Неверный email или пароль');

    const refreshToken = await prisma.$transaction((tx) => issueRefresh(tx, user, meta));

    return {
      user: sanitize(user),
      accessToken: signAccessToken(user),
      refreshToken,
    };
  },

  async refresh({ refreshToken }, meta = {}) {
    if (!refreshToken) throw new HttpError(401, 'Отсутствует refresh-токен');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, 'Refresh-токен недействителен');
    }
    if (!payload.jti) throw new HttpError(401, 'Refresh-токен недействителен');

    return prisma.$transaction(async (tx) => {
      const stored = await tx.refreshToken.findUnique({ where: { jti: payload.jti } });
      if (!stored) throw new HttpError(401, 'Refresh-токен недействителен');

      // Reuse detection: if the token was already revoked, somebody is replaying
      // it. Revoke all live sessions for that user and refuse.
      if (stored.revokedAt) {
        await tx.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new HttpError(401, 'Refresh-токен скомпрометирован, все сессии завершены');
      }

      if (stored.expiresAt < new Date()) {
        throw new HttpError(401, 'Refresh-токен просрочен');
      }

      const user = await tx.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new HttpError(401, 'Пользователь не найден');

      // Rotate: revoke this token, issue a new pair.
      await tx.refreshToken.update({
        where: { jti: stored.jti },
        data: { revokedAt: new Date() },
      });
      const newRefresh = await issueRefresh(tx, user, meta);

      return {
        user: sanitize(user),
        accessToken: signAccessToken(user),
        refreshToken: newRefresh,
      };
    });
  },

  async logout({ refreshToken }) {
    if (!refreshToken) return;
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return; // ignore — already invalid
    }
    if (!payload.jti) return;

    await prisma.refreshToken.updateMany({
      where: { jti: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async logoutAll(userId) {
    const result = await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revokedCount: result.count };
  },

  async me(userId) {
    const user = await AuthRepository.findById(userId);
    if (!user) throw new HttpError(404, 'Пользователь не найден');
    return sanitize(user);
  },

  async createOwner({ email, password }) {
    const existing = await AuthRepository.findByEmail(email);
    if (existing) throw new HttpError(409, 'Пользователь с таким email уже существует');
    const passwordHash = await hashPassword(password);
    return AuthRepository.insert({ email, passwordHash, role: 'tutor' });
  },

  /**
   * Register a new tutor against a single-use invite code.
   * Atomic: the code's used_count is bumped in the same transaction as the
   * user creation, and the bump is conditional (used_count < max_uses,
   * not expired) so two parallel registrations on a max_uses=1 code can't
   * both succeed.
   *
   * On success the new user is logged in (access + refresh issued).
   */
  async register({ email, password, inviteCode }, meta = {}) {
    if (password.length < 8) {
      throw new HttpError(400, 'Пароль должен быть не короче 8 символов');
    }
    if (!inviteCode) {
      throw new HttpError(403, 'Код приглашения недействителен');
    }

    const existing = await AuthRepository.findByEmail(email);
    if (existing) throw new HttpError(409, 'Пользователь с таким email уже зарегистрирован');

    const passwordHash = await hashPassword(password);

    return prisma.$transaction(async (tx) => {
      // Atomic claim: bumps used_count only if it's still under the cap and
      // the code hasn't expired. Returns 0 rows if the claim failed for any
      // reason — we collapse all of these into a single 403 to avoid leaking
      // why ("not found" vs "expired" vs "exhausted") to a probe.
      const updated = await tx.$queryRaw`
        UPDATE invite_codes
        SET used_count = used_count + 1
        WHERE code = ${inviteCode}
          AND used_count < max_uses
          AND (expires_at IS NULL OR expires_at > NOW())
        RETURNING code
      `;
      if (!Array.isArray(updated) || updated.length === 0) {
        throw new HttpError(403, 'Код приглашения недействителен');
      }

      const user = await tx.user.create({
        data: { email, passwordHash, role: 'tutor' },
        select: { id: true, email: true, role: true, status: true, createdAt: true },
      });

      const refreshToken = await issueRefresh(tx, user, meta);

      return {
        user: sanitize(user),
        accessToken: signAccessToken(user),
        refreshToken,
      };
    });
  },
};
