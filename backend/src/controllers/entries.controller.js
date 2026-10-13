import { Entry } from '../models/Entry.js';

export async function listEntries(req, res, next) {
  try {
    const entries = await Entry.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
    return res.json({ entries });
  } catch (err) {
    return next(err);
  }
}

export async function createEntry(req, res, next) {
  try {
    const { title, date, content } = req.body;
    const entry = await Entry.create({ user: req.user.id, title, date, content });
    return res.status(201).json({ entry });
  } catch (err) {
    return next(err);
  }
}
