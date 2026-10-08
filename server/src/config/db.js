import mongoose from 'mongoose';

// Cache the MongoDB connection for Vercel serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pesum_kanakku';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Don't buffer commands in serverless
    };

    console.log('Establishing new MongoDB connection...');
    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log(`MongoDB connected to: ${mongoUri}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};
