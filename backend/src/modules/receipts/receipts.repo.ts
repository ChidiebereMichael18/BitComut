import { pool } from '../../config/db';
import type { Receipt, ReceiptStatus } from '../types';

interface ReceiptRow {
  id: string;
  number: string;
  tenant_id: string;
  student_id: string;
  invoice_id: string;
  payment_id: string;
  amount: string;
  currency: string;
  date: Date;
  status: string;
}

export function mapReceipt(r: ReceiptRow): Receipt {
  return {
    id: r.id,
    number: r.number,
    tenantId: r.tenant_id,
    studentId: r.student_id,
    invoiceId: r.invoice_id,
    paymentId: r.payment_id,
    amount: Number(r.amount),
    currency: r.currency,
    date: r.date.toISOString(),
    status: r.status as ReceiptStatus,
  };
}

export async function createReceipt(data: {
  id: string;
  number: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  paymentId: string;
  amount: number;
  currency: string;
  date: Date;
}): Promise<Receipt> {
  const res = await pool.query<ReceiptRow>(
    `INSERT INTO receipts (id, number, tenant_id, student_id, invoice_id, payment_id,
                           amount, currency, date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Issued')
     RETURNING *`,
    [
      data.id,
      data.number,
      data.tenantId,
      data.studentId,
      data.invoiceId,
      data.paymentId,
      data.amount,
      data.currency,
      data.date,
    ],
  );
  return mapReceipt(res.rows[0]);
}

export async function listReceipts(
  tenantId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<Receipt[]> {
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 50;
  const offset = opts.offset ?? 0;
  const res = await pool.query<ReceiptRow>(
    'SELECT * FROM receipts WHERE tenant_id=$1 ORDER BY date DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset],
  );
  return res.rows.map(mapReceipt);
}

export async function getReceipt(
  tenantId: string,
  id: string,
): Promise<Receipt | null> {
  const res = await pool.query<ReceiptRow>(
    'SELECT * FROM receipts WHERE tenant_id=$1 AND id=$2',
    [tenantId, id],
  );
  return res.rows[0] ? mapReceipt(res.rows[0]) : null;
}

export async function getReceiptByPaymentId(
  tenantId: string,
  paymentId: string,
): Promise<Receipt | null> {
  const res = await pool.query<ReceiptRow>(
    'SELECT * FROM receipts WHERE tenant_id=$1 AND payment_id=$2',
    [tenantId, paymentId],
  );
  return res.rows[0] ? mapReceipt(res.rows[0]) : null;
}
