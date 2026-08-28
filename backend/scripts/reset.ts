import { pool } from '../src/config/db';
import { logger } from '../src/config/logger';
import { applyMigrations } from './lib/migrations';
import { seed } from './lib/seed';

async function reset() {
  logger.warn('Dropping entire public schema...');
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  logger.info('Schema reset; applying migrations');
  await applyMigrations();
  await seed();
}

reset()
  .then(() => pool.end())
  .catch((err) => {
    logger.error({ err }, 'Reset failed');
    process.exit(1);
  });