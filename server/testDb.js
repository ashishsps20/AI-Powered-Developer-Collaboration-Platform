import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ email: 'bot@gmail.com' }).toArray();
    console.log('User found:', users);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

testDb();
