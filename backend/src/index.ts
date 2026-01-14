import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { createApp } from './app';
import { logger } from './utils/logger';
import { initializeCronJobs } from './cron';

const PORT = process.env.PORT || 3001;

const app = createApp();

// Initialize cron jobs (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  initializeCronJobs();
}

app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    url: `http://localhost:${PORT}`,
  });
});
