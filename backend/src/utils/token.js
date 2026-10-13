import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  httpOnly: true, // JS in the browser can never read the token
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/',
};

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: `${env.jwtExpiresDays}d` });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function setAuthCookie(res, token) {
  res.cookie(env.cookie.name, token, {
    ...baseCookieOptions,
    maxAge: env.jwtExpiresDays * DAY_MS,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookie.name, baseCookieOptions);
}
