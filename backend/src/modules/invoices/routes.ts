import { Router } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validate';
import { listInvoices, getInvoice, createInvoice } from './invoices.repo';
import { getStudent } from '../students/students.repo';
import { listPayments } from '../payments/payments.repo';
import { createInvoiceSchema } from './schema';
import { ids } from '../../lib/ids';

export const invoicesRouter = Router();

const randomDigits = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

invoicesRouter.get('/', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const invoices = await listInvoices(tenantId, {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      studentId:
        typeof req.query.studentId === 'string' ? req.query.studentId : undefined,
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const inv = await getInvoice(tenantId, req.params.id);
    if (!inv) throw ApiError.notFound('Invoice not found');
    res.json(inv);
  } catch (err) {
    next(err);
  }
});

invoicesRouter.post('/', validateBody(createInvoiceSchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const body = req.body as typeof createInvoiceSchema._type;
    const student = await getStudent(tenantId, body.studentId);
    if (!student) throw ApiError.badRequest('Student not found', 'STUDENT_NOT_FOUND');

    const id = ids.invoice();
    const year = new Date().getFullYear();
    const number = `INV-${year}-${randomDigits(4)}`;

    const invoice = await createInvoice({
      id,
      number,
      tenantId,
      studentId: body.studentId,
      type: body.type,
      description: body.description,
      amount: body.amount,
      currency: body.currency,
      dueDate: new Date(body.dueDate),
      status: 'Unpaid',
      created: new Date(),
    });
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

invoicesRouter.get('/:id/payments', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const inv = await getInvoice(tenantId, req.params.id);
    if (!inv) throw ApiError.notFound('Invoice not found');
    const payments = await listPayments(tenantId, {
      search: inv.id,
      limit: 100,
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});
