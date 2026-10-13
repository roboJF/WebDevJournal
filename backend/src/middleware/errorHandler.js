import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON.' });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed.' });
  }

  console.error(err);
  res.status(500).json({
    message: 'Something went wrong on our end. Please try again.',
    ...(env.isProd ? {} : { detail: err.message }),
  });
}
