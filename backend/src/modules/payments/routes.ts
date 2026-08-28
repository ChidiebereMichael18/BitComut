import { Router } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireIdempotencyKey, withIdempotency } from '../../lib/idempotency';
import { listPayments, getPayment } from './payments.repo';
import { getStudent } from '../students/students.repo';
import { getSettlementByPaymentId, mapSettlement } from '../settlements/settlements.repo';
import { getReceiptByPaymentId } from '../receipts/receipts.repo';
import { paymentService } from './service-instance';
import { createPaymentSchema, listPaymentsQuerySchema } from './schema';

export const paymentsRouter = Router();

paymentsRouter.get('/', validateQuery(listPaymentsQuerySchema), async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const q = res.locals.validatedQuery as unknown as {
      search?: string; status?: string; settlement?: string; method?: string;
      currency?: string; limit?: number; offset?: number;
    };
    const payments = await listPayments(tenantId, {
      search: q.search,
      status: q.status,
      settlement: q.settlement,
      method: q.method,
      currency: q.currency,
      limit: q.limit,
      offset: q.offset,
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const p = await getPayment(tenantId, req.params.id);
    if (!p) throw ApiError.notFound('Payment not found');
    res.json(p);
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post(
  '/',
  requireIdempotencyKey,
  validateBody(createPaymentSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(res);
      const body = req.body as typeof createPaymentSchema._type;
      const student = await getStudent(tenantId, body.studentId);
      if (!student) throw ApiError.badRequest('Student not found', 'STUDENT_NOT_FOUND');
      await withIdempotency(req, res, tenantId, () =>
        paymentService.createInvoicePayment({
          tenantId,
          studentId: body.studentId,
          invoiceId: body.invoiceId,
          type: body.type,
          description: body.description,
          amount: body.amount,
          currency: body.currency,
          dueDate: new Date(body.dueDate),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

paymentsRouter.get('/:id/settlement', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const p = await getPayment(tenantId, req.params.id);
    if (!p) throw ApiError.notFound('Payment not found');
    const s = await getSettlementByPaymentId(p.id);
    if (!s || s.tenant_id !== tenantId) throw ApiError.notFound('Settlement not found');
    res.json(mapSettlement(s));
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/:id/receipt', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const p = await getPayment(tenantId, req.params.id);
    if (!p) throw ApiError.notFound('Payment not found');
    const r = await getReceiptByPaymentId(tenantId, p.id);
    if (!r) throw ApiError.notFound('Receipt not found');
    res.json(r);
  } catch (err) {
    next(err);
  }
});
