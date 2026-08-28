import { Router } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ApiError } from '../../middleware/error-handler';
import { validateBody } from '../../middleware/validate';
import { ids } from '../../lib/ids';
import { env } from '../../config/env';
import { createTenant, getTenant, getTenantBySlug, mapTenant } from '../tenants/tenants.repo';
import {
  createUser,
  createSession,
  deleteSession,
  findSession,
  findUserWithPassword,
} from './auth.repo';

export const authRouter = Router();

export const SESSION_COOKIE = 'bitcomut_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

const registerSchema = z.object({
  tenant: z.object({
    name: z.string().min(2, 'University name is required'),
    shortName: z.string().min(2, 'Short name is required'),
    email: z.string().email('A valid contact email is required'),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    currency: z.string().default('RWF'),
    country: z.string().optional(),
    campusName: z.string().optional(),
    established: z.string().optional(),
    logoColor: z.string().default('#7C3AED'),
  }),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name is required'),
});

// POST /api/auth/register — self-register a university + its owner admin.
authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const body = req.body as typeof registerSchema._type;
    const slug = slugify(body.tenant.name);

    const existingTenant = await getTenantBySlug(slug);
    if (existingTenant) throw ApiError.badRequest('University already registered', 'SLUG_TAKEN');

    const existingUser = await findUserWithPassword(body.email);
    if (existingUser) throw ApiError.badRequest('Email already registered', 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const tenantId = ids.tenant();

    const tenantRow = await createTenant({
      id: tenantId,
      slug,
      name: body.tenant.name,
      short_name: body.tenant.shortName,
      address: body.tenant.address ?? 'No address provided',
      email: body.tenant.email,
      phone: body.tenant.phone ?? 'N/A',
      website: body.tenant.website ?? '',
      currency: body.tenant.currency.toUpperCase(),
      default_currency: body.tenant.currency.toUpperCase(),
      settlement_currency: body.tenant.currency.toUpperCase(),
      admin_name: body.displayName,
      admin_email: body.email,
      country: body.tenant.country ?? '',
      campus_name: body.tenant.campusName ?? 'Main Campus',
      student_count: 0,
      established: body.tenant.established ?? '',
      logo_color: body.tenant.logoColor,
      created_at: new Date(),
    });

    const user = await createUser({
      id: ids.user(),
      tenantId,
      email: body.email,
      passwordHash,
      displayName: body.displayName,
      role: 'Admin',
    });

    const token = randomBytes(32).toString('hex');
    await createSession({
      id: ids.session(),
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    setSessionCookie(res, token);

    res.status(201).json({ user, tenant: mapTenant(tenantRow), token });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as typeof loginSchema._type;
    const row = await findUserWithPassword(body.email);
    if (!row) throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');

    const ok = await bcrypt.compare(body.password, row.password_hash);
    if (!ok) throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');

    const tenant = await getTenant(row.tenant_id);
    if (!tenant) throw ApiError.forbidden('No university for this account', 'NO_TENANT');

    const token = randomBytes(32).toString('hex');
    await createSession({
      id: ids.session(),
      userId: row.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    setSessionCookie(res, token);

    res.json({
      user: {
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        createdAt: row.created_at.toISOString(),
      },
      tenant,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req, res, next) => {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (!token) throw ApiError.forbidden('Not authenticated', 'UNAUTHENTICATED');

    const session = await findSession(token);
    if (!session) throw ApiError.forbidden('Session expired', 'UNAUTHENTICATED');

    const tenant = await getTenant(session.user.tenantId);
    if (!tenant) throw ApiError.forbidden('No university for this account', 'NO_TENANT');

    res.json({ user: session.user, tenant });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (token) await deleteSession(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});