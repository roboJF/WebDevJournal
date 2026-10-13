import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Slows down brute-force attempts on credential endpoints
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

const registerRules = [
  body('username')
    .isString().withMessage('Enter a username.')
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9_]{3,30}$/)
    .withMessage('Use 3-30 letters, numbers, or underscores.'),
  body('password')
    .isString().withMessage('Enter a password.')
    .bail()
    .isLength({ min: 8 }).withMessage('Use at least 8 characters.')
    // bcrypt silently ignores anything past 72 bytes
    .custom((v) => Buffer.byteLength(v, 'utf8') <= 72)
    .withMessage('Use 72 bytes or fewer (about 72 characters).'),
];

const loginRules = [
  body('username').isString().trim().notEmpty().withMessage('Enter your username.'),
  body('password').isString().notEmpty().withMessage('Enter your password.'),
];

router.post('/register', credentialLimiter, registerRules, validate, register);
router.post('/login', credentialLimiter, loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
