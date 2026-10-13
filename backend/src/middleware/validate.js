import { validationResult } from 'express-validator';

// Collects express-validator errors into { errors: { field: message } }
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const e of result.array()) {
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
}
