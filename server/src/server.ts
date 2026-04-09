import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import connectDB from './config/db';
import logger from './utils/logger';

const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT ?? '5001', 10);

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`CORS origin: ${process.env.CLIENT_URL}`);
  });
};

start();
