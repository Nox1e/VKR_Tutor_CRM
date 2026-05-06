const parsePort = (value) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

const parseList = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseBool = (value) => value === 'true' || value === '1';

const env = process.env.NODE_ENV ?? 'development';

export const config = {
  env,
  port: parsePort(process.env.PORT) ?? 4000,

  cors: {
    origins: parseList(process.env.CORS_ORIGINS),
  },

  jwt: {
    accessSecret: process.env.JWT_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },

  cookie: {
    secure: parseBool(process.env.COOKIE_SECURE) || env === 'production',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  seed: {
    ownerEmail: process.env.INITIAL_OWNER_EMAIL ?? '',
    ownerPassword: process.env.INITIAL_OWNER_PASSWORD ?? '',
  },
};

export const validateRuntimeConfig = () => {
  const missing = [];
  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) {
    missing.push('JWT_SECRET (min 32 chars)');
  }
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
    missing.push('JWT_REFRESH_SECRET (min 32 chars)');
  }
  if (config.jwt.accessSecret && config.jwt.accessSecret === config.jwt.refreshSecret) {
    missing.push('JWT_SECRET и JWT_REFRESH_SECRET должны различаться');
  }
  if (config.cors.origins.length === 0) {
    missing.push('CORS_ORIGINS (хотя бы один origin)');
  }
  if (missing.length > 0) {
    throw new Error(
      `Некорректная конфигурация окружения:\n  - ${missing.join('\n  - ')}\nСм. backend/.env.example.`,
    );
  }
};
