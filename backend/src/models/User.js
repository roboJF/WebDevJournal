import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Display version, keeps the casing the user typed
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    // Lowercased copy used for case-insensitive uniqueness ("Sam" and "sam" collide)
    usernameLower: { type: String, required: true, unique: true, index: true },
    // Never returned from queries unless explicitly selected with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    return { id: ret._id.toString(), username: ret.username, createdAt: ret.createdAt };
  },
});

export const User = mongoose.model('User', userSchema);
