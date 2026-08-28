import { pool } from '../src/config/db';
import { seed } from './lib/seed';
import { logger } from '../src/config/logger';

seed()
  .then(() => pool.end())
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  });