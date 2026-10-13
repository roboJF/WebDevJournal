import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const fail = (msg) => {
  console.error(`\n[config] ${msg}\n`);
  process.exit(1);
};

const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : value.toLowerCase() === 'true';

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const missing = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'].filter((k) => !process.env[k]);
if (missing.length) {
  fail(`Missing required environment variables: ${missing.join(', ')}. See .env.example.`);
}

if (process.env.JWT_SECRET.length < 32) {
  fail('JWT_SECRET must be at least 32 characters long.');
}

const sameSite = (process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  fail('COOKIE_SAMESITE must be one of: lax, strict, none.');
}

const secure = toBool(process.env.COOKIE_SECURE, isProd);
if (sameSite === 'none' && !secure) {
  fail('COOKIE_SAMESITE=none requires COOKIE_SECURE=true (browsers reject it otherwise).');
}

export const env = {
  nodeEnv,
  isProd,
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresDays: toInt(process.env.JWT_EXPIRES_DAYS, 7),
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 12),
  clientOrigins: process.env.CLIENT_ORIGIN.split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  trustProxy: toInt(process.env.TRUST_PROXY, isProd ? 1 : 0),
  cookie: {
    name: process.env.COOKIE_NAME || 'journal_token',
    secure,
    sameSite,
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
};
