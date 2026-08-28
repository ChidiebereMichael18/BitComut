import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

/**
 * Idempotency for mutating endpoints.
 *
 * Client sends an `Idempotency-Key` header. If we have seen the key before
 * (scoped by tenant), we return the stored response instead of re-running the
 * handler — so retries after network failures don't double-create resources.
 */

export const IDEMPOTENCY_HEADER = 'idempotency-key';

export async function readStoredResponse(
  tenantId: string,
  key: string,
): Promise<unknown | null> {
  const res = await pool.query<{ response_body: unknown }>(
    'SELECT response_body FROM idempotency_keys WHERE tenant_id=$1 AND key=$2',
    [tenantId, key],
  );
  return res.rows[0]?.response_body ?? null;
}

export async function storeResponse(
  tenantId: string,
  key: string,
  responseBody: unknown,
): Promise<void> {
  await pool.query(
    `INSERT INTO idempotency_keys (tenant_id, key, response_body)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, key) DO NOTHING`,
    [tenantId, key, JSON.stringify(responseBody)],
  );
}

/**
 * Wrapper used by controllers. Reads the Idempotency-Key header; if present and
 * previously seen for this tenant, returns the stored JSON. Otherwise runs
 * `cb` and stores its result.
 */
export async function withIdempotency<T>(
  req: Request,
  res: Response,
  tenantId: string,
  cb: () => Promise<T>,
  opts: { status?: number } = {},
): Promise<void> {
  const key = req.header(IDEMPOTENCY_HEADER);

  if (key) {
    const stored = await readStoredResponse(tenantId, key);
    if (stored != null) {
      res.json(stored);
      return;
    }
  }

  const result = await cb();
  if (key) await storeResponse(tenantId, key, result);
  res.status(opts.status ?? 200).json(result);
}

// Express middleware to reject requests missing a required idempotency key.
export function requireIdempotencyKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.header(IDEMPOTENCY_HEADER);
  if (!key) {
    res.status(400).json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required' } });
    return;
  }
  next();
}
