import { pool } from '../../config/db';
import type { Invoice, InvoiceStatus, InvoiceType } from '../types';

interface InvoiceRow {
  id: string;
  number?: string;
  tenant_id: string;
  student_id: string;
  type: string;
  description: string;
  amount: string;
  currency: string;
  due_date: Date;
  status: string;
  created: Date;
  amount_paid: string;
  student_name?: string | null;
}

export function mapInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    studentId: r.student_id,
    number: r.number,
    type: r.type as InvoiceType,
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency,
    dueDate: r.due_date.toISOString(),
    status: r.status as InvoiceStatus,
    created: r.created.toISOString(),
    amountPaid: Number(r.amount_paid),
    studentName: r.student_name ?? undefined,
  };
}

export async function listInvoices(
  tenantId: string,
  opts: { studentId?: string; search?: string; limit?: number; offset?: number } = {},
): Promise<Invoice[]> {
  const where: string[] = ['i.tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (opts.studentId) {
    params.push(opts.studentId);
    where.push(`i.student_id = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    where.push(
      `(s.name ILIKE $${params.length} OR i.description ILIKE $${params.length} OR i.id ILIKE $${params.length} OR i.type ILIKE $${params.length})`,
    );
  }
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 100;
  const offset = opts.offset ?? 0;
  const res = await pool.query<InvoiceRow>(
    `SELECT i.*, s.name AS student_name
     FROM invoices i
     LEFT JOIN students s ON s.id = i.student_id
     WHERE ${where.join(' AND ')}
     ORDER BY i.created DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  return res.rows.map(mapInvoice);
}

export async function getInvoice(
  tenantId: string,
  id: string,
): Promise<Invoice | null> {
  const res = await pool.query<InvoiceRow>(
    `SELECT i.*, s.name AS student_name
     FROM invoices i
     LEFT JOIN students s ON s.id = i.student_id
     WHERE i.tenant_id=$1 AND i.id=$2`,
    [tenantId, id],
  );
  return res.rows[0] ? mapInvoice(res.rows[0]) : null;
}

export async function createInvoice(
  data: {
    id: string;
    number: string;
    tenantId: string;
    studentId: string;
    type: InvoiceType;
    description: string;
    amount: number;
    currency: string;
    dueDate: Date;
    status: InvoiceStatus;
    created: Date;
  },
): Promise<Invoice> {
  const res = await pool.query<InvoiceRow>(
    `INSERT INTO invoices (id, number, tenant_id, student_id, type, description, amount, currency, due_date, status, created, amount_paid)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0)
     RETURNING *`,
    [
      data.id,
      data.number,
      data.tenantId,
      data.studentId,
      data.type,
      data.description,
      data.amount,
      data.currency,
      data.dueDate,
      data.status,
      data.created,
    ],
  );
  const row = res.rows[0];
  return mapInvoice({ ...row, student_name: null });
}

/**
 * Recompute an invoice's status from its paid total.
 * Overdue if past due_date and still unpaid; Paid if fully paid;
 * Partially Paid if > 0 and < amount; else Unpaid.
 */
export async function recomputeInvoiceStatus(
  invoiceId: string,
  tenantId: string,
): Promise<{ amountPaid: number; status: InvoiceStatus; paidTotal: number }> {
  const inv = await pool.query<InvoiceRow>(
    `SELECT * FROM invoices WHERE id=$1 AND tenant_id=$2`,
    [invoiceId, tenantId],
  );
  if (!inv.rows[0]) throw new Error('invoice not found');
  const row = inv.rows[0];
  const amount = Number(row.amount);
  const paid = Number(row.amount_paid);

  const dueDate = new Date(row.due_date);
  const now = new Date();

  let status: InvoiceStatus;
  if (paid >= amount) status = 'Paid';
  else if (paid > 0) status = 'Partially Paid';
  else if (now > dueDate) status = 'Overdue';
  else status = 'Unpaid';

  await pool.query(
    'UPDATE invoices SET status=$1 WHERE id=$2',
    [status, invoiceId],
  );
  return { amountPaid: paid, status, paidTotal: paid };
}

/** Add a paid amount to an invoice (called when a payment is confirmed). */
export async function addToInvoicePaid(
  invoiceId: string,
  tenantId: string,
  amount: number,
): Promise<void> {
  await pool.query(
    `UPDATE invoices SET amount_paid = amount_paid + $1 WHERE id=$2 AND tenant_id=$3`,
    [amount, invoiceId, tenantId],
  );
}
