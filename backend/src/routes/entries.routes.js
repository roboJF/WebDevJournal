import { Router } from 'express';
import { body } from 'express-validator';
import {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
} from '../controllers/entries.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

const entryRules = [
  body('title')
    .isString()
    .withMessage('Enter a title.')
    .bail()
    .trim()
    .custom((value) => value.length >= 1 && value.length <= 200)
    .withMessage('Use a title between 1 and 200 characters.'),
  body('date')
    .isString()
    .withMessage('Choose a date.')
    .bail()
    .matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .withMessage('Choose a valid date.')
    .bail()
    .isISO8601({ strict: true })
    .withMessage('Choose a valid date.')
    .bail()
    .custom((value) => !value.startsWith('0000'))
    .withMessage('Choose a valid date.'),
  body('content')
    .isString()
    .withMessage('Write some content for your entry.')
    .bail()
    .custom((value) => value.trim().length > 0)
    .withMessage('Write some content for your entry.')
    .custom((value) => value.length <= 100000)
    .withMessage('Keep your entry within 100,000 characters.'),
];

router.get('/', listEntries);
router.get('/:entryId', getEntry);
router.post('/', entryRules, validate, createEntry);
router.put('/:entryId', entryRules, validate, updateEntry);

export default router;
