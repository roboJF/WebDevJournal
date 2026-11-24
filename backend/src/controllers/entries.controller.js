import mongoose from 'mongoose';
import { Entry } from '../models/Entry.js';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { cloudinary } from '../middleware/upload.js';

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
    const images = await uploadImages(req.files);

    const entry = await Entry.create({
      user: req.user.id,
      title,
      date,
      content,
      images,
    });

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

async function uploadImages(files = []) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'muse/entries',
              resource_type: 'image',
              transformation: [
                { width: 1600, height: 1600, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            },
          );

          stream.end(file.buffer);
        }),
    ),
  );
}

function getCloudinaryPublicId(url) {
  try {
    const pathname = new URL(url).pathname;
    const marker = '/image/upload/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const parts = pathname
      .slice(markerIndex + marker.length)
      .split('/')
      .filter(Boolean);
    if (parts[0]?.startsWith('v') && /^v\d+$/.test(parts[0])) parts.shift();

    const fileName = parts.pop();
    if (!fileName) return null;
    parts.push(fileName.replace(/\.[^/.]+$/, ''));
    return parts.join('/') || null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImages(urls) {
  if (process.env.NODE_ENV === 'test') return;

  await Promise.all(
    urls.map(async (url) => {
      const publicId = getCloudinaryPublicId(url);
      if (!publicId) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }),
  );
}

function parseRetainedImages(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.filter((url) => typeof url === 'string');
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
}

export async function updateEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    if (!mongoose.isObjectIdOrHexString(entryId)) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const existingEntry = await Entry.findOne({
      _id: entryId,
      user: req.user.id,
    });

    if (!existingEntry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const currentImages = existingEntry.images || [];
    const parsedRetainedImages = parseRetainedImages(req.body.images);
    const retainedImages =
      parsedRetainedImages === undefined
        ? currentImages
        : parsedRetainedImages.filter((url) => currentImages.includes(url));
    const newImages = await uploadImages(req.files);
    const images = [...retainedImages, ...newImages];
    const removedImages = currentImages.filter((url) => !retainedImages.includes(url));

    const entry = await Entry.findOneAndUpdate(
      { _id: entryId, user: req.user.id },
      {
        $set: {
          title: req.body.title,
          date: req.body.date,
          content: req.body.content,
          images,
        },
      },
      { returnDocument: 'after', runValidators: true },
    );
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    if (removedImages.length) {
      await deleteCloudinaryImages(removedImages).catch((err) => {
        console.error('Failed to delete Cloudinary images:', err);
      });
    }

    return res.json({ entry });
  } catch (err) {
    return next(err);
  }
}

export async function deleteEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    if (!mongoose.isObjectIdOrHexString(entryId)) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const entry = await Entry.findOneAndDelete({ _id: entryId, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}
