import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { verifyToken, clearAuthCookie } from '../utils/token.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookie.name];
  if (!token) {
    return res.status(401).json({ message: 'You need to log in.' });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'You need to log in.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
    return next(err);
  }
}
