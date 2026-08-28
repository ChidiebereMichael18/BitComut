import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { env } from '../config/env';

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
}

/**
 * Resolve the active tenant from, in priority order:
 *   1. `X-Tenant-Slug` header
 *   2. `bitcomut:tenant` cookie (holds a tenant id)
 *   3. fallback: the first seeded tenant
 * Attaches `res.locals.tenant` for downstream handlers. All queries must be
 * scoped by tenant.id.
 */
export async function resolveTenantId(req: Request, _res: Response): Promise<string> {
  const slug = req.header('x-tenant-slug');
  if (slug) {
    const q = await pool.query<{ id: string; slug: string; name: string }>(
      'SELECT id, slug, name FROM tenants WHERE slug=$1',
      [slug],
    );
    if (q.rows[0]) return q.rows[0].id;
  }

  const cookie: string | undefined = (req as { cookies?: Record<string, string> }).cookies?.[env.COOKIE_NAME];
  if (cookie) {
    // Accept both tenant id (old clients) and tenant slug (current frontend,
    // which writes the slug into the `bitcomut:tenant` cookie).
    const q = await pool.query<{ id: string }>(
      'SELECT id FROM tenants WHERE id=$1 OR slug=$1',
      [cookie],
    );
    if (q.rows[0]) return q.rows[0].id;
  }

  const fallback = await pool.query<{ id: string }>(
    'SELECT id FROM tenants ORDER BY created_at LIMIT 1',
  );
  if (fallback.rows[0]) return fallback.rows[0].id;

  throw new Error('No tenants configured');
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = await resolveTenantId(req, res);
    res.locals.tenantId = id;
    const q = await pool.query<{ id: string; slug: string; name: string }>(
      'SELECT id, slug, name FROM tenants WHERE id=$1',
      [id],
    );
    res.locals.tenant = q.rows[0] as TenantContext | undefined;
    next();
  } catch (err) {
    next(err);
  }
}

export function getTenantId(res: Response): string {
  return res.locals.tenantId as string;
}

export function getTenant(res: Response): TenantContext {
  return res.locals.tenant as TenantContext;
}
