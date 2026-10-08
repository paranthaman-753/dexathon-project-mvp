import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pesum_kanakku';

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoUri}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.warn('The server will continue running in demo mode without a live MongoDB connection.');
    return false;
  }
};
