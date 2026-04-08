import mongoose from 'mongoose';
import logger from '../utils/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is not defined in environment variables');

    await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`MongoDB connection attempt ${attempt} failed: ${message}`);

    if (attempt >= MAX_RETRIES) {
      logger.error('Max retries reached. Exiting process.');
      process.exit(1);
    }

    logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await connectDB(attempt + 1);
  }
};

export default connectDB;
