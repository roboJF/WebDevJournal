import mongoose from 'mongoose';
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

export async function getEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    if (!mongoose.isObjectIdOrHexString(entryId)) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const entry = await Entry.findOne({ _id: entryId, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }
    return res.json({ entry });
  } catch (err) {
    return next(err);
  }
}
