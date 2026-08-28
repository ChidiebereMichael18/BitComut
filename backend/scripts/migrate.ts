import { pool } from '../src/config/db';
import { applyMigrations } from './lib/migrations';
import { logger } from '../src/config/logger';

async function main() {
  await applyMigrations();
  logger.info('Migrate complete');
  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});