import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

// Compared against when a username doesn't exist, so response time
// doesn't reveal whether an account is real.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.bcryptRounds);

export async function register(req, res, next) {
  try {
    const { username, password } = req.body;
    const usernameLower = username.toLowerCase();

    if (await User.exists({ usernameLower })) {
      return res.status(409).json({
        message: 'That username is already taken.',
        errors: { username: 'That username is already taken.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const user = await User.create({ username, usernameLower, passwordHash });

    setAuthCookie(res, signToken(user.id));
    return res.status(201).json({ user });
  } catch (err) {
    // Two sign-ups racing for the same name hit the unique index
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'That username is already taken.',
        errors: { username: 'That username is already taken.' },
      });
    }
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ usernameLower: username.toLowerCase() }).select(
      '+passwordHash'
    );

    const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !valid) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    setAuthCookie(res, signToken(user.id));
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out.' });
}

export function me(req, res) {
  res.json({ user: req.user });
}
