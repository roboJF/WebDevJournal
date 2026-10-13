import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // Keep the journal date as a calendar date, without a timezone conversion.
    date: { type: String, required: true },
    content: {
      type: String,
      required: true,
      maxlength: 100000,
      validate: (value) => value.trim().length > 0,
    },
  },
  { timestamps: true }
);

entrySchema.index({ user: 1, date: -1, createdAt: -1 });
entrySchema.set('toJSON', {
  transform(_doc, ret) {
    return {
      id: ret._id.toString(),
      title: ret.title,
      date: ret.date,
      content: ret.content,
      createdAt: ret.createdAt,
    };
  },
});

export const Entry = mongoose.model('Entry', entrySchema);
