import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    if (err.name === 'MongooseServerSelectionError') {
      console.error(
        'Could not connect to MongoDB. Start local mongod or set MONGO_URI in server/.env (e.g. MongoDB Atlas).'
      );
    }
    throw err;
  }
}
