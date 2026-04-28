import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mikroguard';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
};