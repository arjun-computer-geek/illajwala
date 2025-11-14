import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

export const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
};
