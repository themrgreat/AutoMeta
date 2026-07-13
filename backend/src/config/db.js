import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
  }

  mongoose.connection.on('connected', () => {
    console.log(`[db] connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
}
