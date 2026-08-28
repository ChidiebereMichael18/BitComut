import { Router } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ApiError } from '../../middleware/error-handler';
import { validateBody } from '../../middleware/validate';
import { requireIdempotencyKey } from '../../lib/idempotency';
import { ids } from '../../lib/ids';
import { env } from '../../config/env';
import { getTenantBySlug, getTenant } from '../tenants/tenants.repo';
import { listInvoices, getInvoice } from '../invoices/invoices.repo';
import { listPayments, getPayment } from '../payments/payments.repo';
import { getSettlementByPaymentId, mapSettlement } from '../settlements/settlements.repo';
import { paymentService } from '../payments/service-instance';
import {
  STUDENT_SESSION_COOKIE,
  requireStudentAuth,
  type StudentAuthLocals,
} from '../../middleware/student-auth';
import {
  getStudentForAuth,
  getStudentByAccountEmail,
  accountEmailTaken,
  setStudentCredentials,
  getStudentCredentials,
  createStudentSession,
  findStudentSession,
  deleteStudentSession,
} from './student-auth.repo';

export const studentRouter = Router();

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

function studentAuthLocals(res: import('express').Response): StudentAuthLocals {
  return (res.locals as { studentAuth: StudentAuthLocals }).studentAuth;
}

const registerSchema = z.object({
  tenantSlug: z.string().min(1, 'University is required'),
  studentId: z.string().min(1, 'Student record number is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

// POST /api/student/register — link an existing student record to an account.
studentRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const body = req.body as typeof registerSchema._type;

    const tenant = await getTenantBySlug(body.tenantSlug);
    if (!tenant) throw ApiError.badRequest('University not found', 'TENANT_NOT_FOUND');

    const student = await getStudentForAuth(tenant.id, body.studentId);
    if (!student) {
      throw ApiError.badRequest(
        `No student found with record number "${body.studentId}" at ${tenant.name}. Confirm the number with your university.`,
        'STUDENT_NOT_FOUND',
      );
    }
    if (student.hasAccount) {
      throw ApiError.badRequest('This student record already has an account. Please sign in.', 'ALREADY_REGISTERED');
    }
    if (await accountEmailTaken(tenant.id, body.email.toLowerCase())) {
      throw ApiError.badRequest('This email is already registered at this university', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await setStudentCredentials({
      tenantId: tenant.id,
      studentId: student.id,
      accountEmail: body.email.toLowerCase(),
      passwordHash,
    });

    const token = randomBytes(32).toString('hex');
    await createStudentSession({
      id: ids.studentSession(),
      studentId: student.id,
      tenantId: tenant.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    setSessionCookie(res, token);

    res.status(201).json({
      student: { ...student, email: body.email.toLowerCase(), hasAccount: true },
      tenant,
      token,
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'University is required'),
});

// POST /api/student/login
studentRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as typeof loginSchema._type;
    const tenant = await getTenantBySlug(body.tenantSlug);
    if (!tenant) throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');

    const student = await getStudentByAccountEmail(tenant.id, body.email.toLowerCase());
    if (!student || !student.hasAccount) {
      throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');
    }

    const row = await getStudentForAuth(tenant.id, student.id);
    if (!row || !row.hasAccount) {
      throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');
    }
    // Re-fetch raw hash from DB.
    const raw = await getStudentCredentials(tenant.id, row.id);
    if (!raw || !raw.password_hash) {
      throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');
    }
    const ok = await bcrypt.compare(body.password, raw.password_hash);
    if (!ok) throw ApiError.forbidden('Invalid email or password', 'UNAUTHORIZED');

    const token = randomBytes(32).toString('hex');
    await createStudentSession({
      id: ids.studentSession(),
      studentId: row.id,
      tenantId: tenant.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    setSessionCookie(res, token);

    const me = await findStudentSession(token);
    res.json({ student: me?.student ?? row, tenant, token });
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me
studentRouter.get('/me', requireStudentAuth, async (_req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const tenant = await getTenant(auth.tenantId);
    res.json({ student: auth.student, tenant });
  } catch (err) {
    next(err);
  }
});

// POST /api/student/logout
studentRouter.post('/logout', async (req, res, next) => {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      STUDENT_SESSION_COOKIE
    ];
    if (token) await deleteStudentSession(token);
    res.clearCookie(STUDENT_SESSION_COOKIE, { path: '/' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/invoices
studentRouter.get('/me/invoices', requireStudentAuth, async (_req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const invoices = await listInvoices(auth.tenantId, { studentId: auth.studentId });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/balance — outstanding total for the logged-in student.
studentRouter.get('/me/balance', requireStudentAuth, async (_req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const invoices = await listInvoices(auth.tenantId, { studentId: auth.studentId });
    const payments = await listPayments(auth.tenantId, {
      studentId: auth.studentId,
      limit: 100,
    });
    const RECEIVED = new Set(['Paid', 'Settled', 'Settlement Pending', 'Processing']);
    const totalInvoiced = invoices
      .filter((i) => i.status !== 'Cancelled')
      .reduce((s, i) => s + i.amount, 0);
    const totalPaid = payments
      .filter((p) => RECEIVED.has(p.status))
      .reduce((s, p) => s + p.amount, 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);
    const unpaidInvoices = invoices.filter(
      (i) => i.status !== 'Paid' && i.status !== 'Cancelled',
    );
    res.json({
      currency: invoices[0]?.currency ?? 'RWF',
      totalInvoiced,
      totalPaid,
      outstanding,
      unpaidInvoices: unpaidInvoices.length,
      dueSoonInvoices: unpaidInvoices.filter((i) => new Date(i.dueDate) < new Date(Date.now() + 7 * 86400000)).length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/payments — the logged-in student's own payments.
studentRouter.get('/me/payments', requireStudentAuth, async (_req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const payments = await listPayments(auth.tenantId, {
      studentId: auth.studentId,
      limit: 100,
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/payments/:id — poll one of the student's own payments.
studentRouter.get('/me/payments/:id', requireStudentAuth, async (req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const id = String(req.params.id);
    const p = await getPayment(auth.tenantId, id);
    if (!p || p.studentId !== auth.studentId) {
      throw ApiError.notFound('Payment not found');
    }
    res.json(p);
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/payments/:id/settlement — settlement for own payment.
studentRouter.get('/me/payments/:id/settlement', requireStudentAuth, async (req, res, next) => {
  try {
    const auth = studentAuthLocals(res);
    const id = String(req.params.id);
    const p = await getPayment(auth.tenantId, id);
    if (!p || p.studentId !== auth.studentId) {
      throw ApiError.notFound('Payment not found');
    }
    const s = await getSettlementByPaymentId(p.id);
    if (!s || s.tenant_id !== auth.tenantId) throw ApiError.notFound('Settlement not found');
    res.json(mapSettlement(s));
  } catch (err) {
    next(err);
  }
});

const paySchema = z.object({
  invoiceId: z.string().min(1, 'invoiceId is required'),
});

// POST /api/student/me/pay — create a Lightning payment for one of the
// logged-in student's own invoices.
studentRouter.post(
  '/me/pay',
  requireIdempotencyKey,
  requireStudentAuth,
  validateBody(paySchema),
  async (req, res, next) => {
    try {
      const auth = studentAuthLocals(res);
      const { invoiceId } = req.body as typeof paySchema._type;
      const invoice = await getInvoice(auth.tenantId, invoiceId);
      if (!invoice || invoice.studentId !== auth.studentId) {
        throw ApiError.badRequest('Invoice not found', 'INVOICE_NOT_FOUND');
      }
      if (invoice.status === 'Paid') {
        throw ApiError.badRequest('This invoice is already paid', 'ALREADY_PAID');
      }

      const result = await paymentService.createInvoicePayment({
        tenantId: auth.tenantId,
        studentId: auth.studentId,
        invoiceId: invoice.id,
        type: invoice.type,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: new Date(invoice.dueDate),
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);
