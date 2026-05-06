import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';

const ALGO = 'HS256';

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { algorithm: ALGO, expiresIn });

const verifyToken = (token, secret) =>
  jwt.verify(token, secret, { algorithms: [ALGO] });

export const signAccessToken = (user) =>
  signToken(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    config.jwt.accessSecret,
    config.jwt.accessTtl,
  );

// Refresh tokens carry a jti so the server can revoke them individually.
// Returns { token, jti, expiresAt } so the auth service can persist the row.
export const signRefreshToken = (user) => {
  const jti = randomUUID();
  const token = signToken(
    { sub: user.id, type: 'refresh', jti },
    config.jwt.refreshSecret,
    config.jwt.refreshTtl,
  );
  const decoded = jwt.decode(token);
  const expiresAt = new Date((decoded?.exp ?? Math.floor(Date.now() / 1000)) * 1000);
  return { token, jti, expiresAt };
};

export const verifyAccessToken = (token) => {
  const decoded = verifyToken(token, config.jwt.accessSecret);
  if (decoded.type !== 'access') {
    throw new Error('Неверный тип токена');
  }
  return decoded;
};

export const verifyRefreshToken = (token) => {
  const decoded = verifyToken(token, config.jwt.refreshSecret);
  if (decoded.type !== 'refresh') {
    throw new Error('Неверный тип токена');
  }
  return decoded;
};
