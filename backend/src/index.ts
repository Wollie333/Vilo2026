import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { createApp } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    url: `http://localhost:${PORT}`,
  });
});
