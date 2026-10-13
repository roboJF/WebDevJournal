import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log('[db] Connected to MongoDB');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
