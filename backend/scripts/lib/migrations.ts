import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from '../../src/config/db';
import { logger } from '../../src/config/logger';

const SQL_DIR = join(__dirname, '..', '..', 'sql');

export async function applyMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(SQL_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(SQL_DIR, file), 'utf8');
    logger.info({ file }, 'Applying migration');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }

  logger.info('All migrations applied');
}