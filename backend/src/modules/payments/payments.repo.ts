import { pool } from '../../config/db';
import type {
  Payment,
  PaymentMethod,
  PaymentNetwork,
  PaymentStatus,
} from '../types';

export interface PaymentRow {
  id: string;
  reference: string;
  tenant_id: string;
  student_id: string;
  invoice_id: string;
  amount: string;
  currency: string;
  btc_sats: string;
  exchange_rate: string;
  method: string;
  network: string;
  status: string;
  date: Date;
  confirmed_at: Date | null;
  settlement_date: Date | null;
  lnbits_payment_hash: string | null;
  lnbits_wallet_id: string | null;
  payment_request: string | null;
  student_name?: string | null;
  invoice_number?: string | null;
  invoice_description?: string | null;
}

export function mapPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    reference: r.reference,
    tenantId: r.tenant_id,
    studentId: r.student_id,
    invoiceId: r.invoice_id,
    amount: Number(r.amount),
    currency: r.currency,
    btcSats: Number(r.btc_sats),
    exchangeRate: Number(r.exchange_rate),
    method: r.method as PaymentMethod,
    network: r.network as PaymentNetwork,
    status: r.status as PaymentStatus,
    date: r.date.toISOString(),
    confirmedAt: r.confirmed_at ? r.confirmed_at.toISOString() : null,
    settlementDate: r.settlement_date ? r.settlement_date.toISOString() : null,
    lnbitsPaymentHash: r.lnbits_payment_hash,
    lnbitsWalletId: r.lnbits_wallet_id,
    paymentRequest: r.payment_request,
  };
}

export interface CreatePaymentInput {
  id: string;
  reference: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  btcSats: number;
  exchangeRate: number;
  method: PaymentMethod;
  network: PaymentNetwork;
  status: PaymentStatus;
  date: Date;
  lnbitsPaymentHash?: string | null;
  lnbitsWalletId?: string | null;
  paymentRequest?: string | null;
}

export async function createPayment(data: CreatePaymentInput): Promise<Payment> {
  const res = await pool.query<PaymentRow>(
    `INSERT INTO payments (id, reference, tenant_id, student_id, invoice_id, amount, currency,
                           btc_sats, exchange_rate, method, network, status, date,
                           lnbits_payment_hash, lnbits_wallet_id, payment_request)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      data.id,
      data.reference,
      data.tenantId,
      data.studentId,
      data.invoiceId,
      data.amount,
      data.currency,
      data.btcSats,
      data.exchangeRate,
      data.method,
      data.network,
      data.status,
      data.date,
      data.lnbitsPaymentHash ?? null,
      data.lnbitsWalletId ?? null,
      data.paymentRequest ?? null,
    ],
  );
  return mapPayment(res.rows[0]);
}

export async function listPayments(
  tenantId: string,
  opts: {
    search?: string;
    status?: string;
    settlement?: string;
    method?: string;
    currency?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Payment[]> {
  const where: string[] = ['p.tenant_id = $1'];
  const params: unknown[] = [tenantId];
  const push = (pred: string, val: unknown) => {
    params.push(val);
    where.push(pred.replace('?', `$${params.length}`));
  };

  if (opts.studentId) push('p.student_id = ?', opts.studentId);
  if (opts.status) push('p.status = ?', opts.status);
  if (opts.currency) push('p.currency = ?', opts.currency.toUpperCase());
  if (opts.method) push('p.method = ?', opts.method);
  if (opts.settlement) {
    if (opts.settlement === 'Settled') {
      where.push(`p.status IN ('Settled','Settlement Pending')`);
    } else {
      push("p.status IN ('Pending','Processing','Paid','Settlement Pending')", '');
    }
  }
  if (opts.search) {
    const term = opts.search.trim();
    if (term) {
      push(
        `(s.name ILIKE ? OR s.id ILIKE ? OR p.student_id ILIKE ? OR p.reference ILIKE ? OR p.lnbits_payment_hash ILIKE ? OR p.id ILIKE ? OR i.id ILIKE ?)`,
        '%' + term + '%',
      );
      // The above only adds one param; rebuild robustly:
      where.pop();
      params.pop();
      const p2 = `%${term}%`;
      const idx = params.length;
      where.push(
        `(s.name ILIKE $${idx + 1} OR s.id ILIKE $${idx + 2} OR p.student_id ILIKE $${idx + 3} OR p.reference ILIKE $${idx + 4} OR p.lnbits_payment_hash ILIKE $${idx + 5} OR p.id ILIKE $${idx + 6} OR i.id ILIKE $${idx + 7})`,
      );
      for (let k = 0; k < 7; k++) params.push(p2);
    }
  }

  const limit = opts.limit && opts.limit > 0 ? opts.limit : 50;
  const offset = opts.offset ?? 0;

  const res = await pool.query<PaymentRow>(
    `SELECT p.*, s.name AS student_name, i.description AS invoice_description
     FROM payments p
     JOIN students s ON s.id = p.student_id
     JOIN invoices i ON i.id = p.invoice_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.date DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  return res.rows.map(mapPayment);
}

export async function getPayment(
  tenantId: string,
  id: string,
): Promise<Payment | null> {
  const res = await pool.query<PaymentRow>(
    `SELECT p.*, s.name AS student_name, i.description AS invoice_description
     FROM payments p
     JOIN students s ON s.id = p.student_id
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.tenant_id=$1 AND p.id=$2`,
    [tenantId, id],
  );
  return res.rows[0] ? mapPayment(res.rows[0]) : null;
}

export async function getPaymentByHash(
  paymentHash: string,
): Promise<PaymentRow | null> {
  const res = await pool.query<PaymentRow>(
    `SELECT p.*, s.name AS student_name, i.description AS invoice_description
     FROM payments p
     JOIN students s ON s.id = p.student_id
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.lnbits_payment_hash=$1`,
    [paymentHash],
  );
  return res.rows[0] ?? null;
}

export async function getPaymentByIdUnscoped(
  id: string,
): Promise<PaymentRow | null> {
  const res = await pool.query<PaymentRow>(
    'SELECT * FROM payments WHERE id=$1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  extra: {
    confirmedAt?: Date | null;
    settlementDate?: Date | null;
  } = {},
): Promise<PaymentRow | null> {
  const sets: string[] = ['status=$2'];
  const params: unknown[] = [id, status];
  if (extra.confirmedAt !== undefined) {
    params.push(extra.confirmedAt);
    sets.push(`confirmed_at=$${params.length}`);
  }
  if (extra.settlementDate !== undefined) {
    params.push(extra.settlementDate);
    sets.push(`settlement_date=$${params.length}`);
  }
  const res = await pool.query<PaymentRow>(
    `UPDATE payments SET ${sets.join(', ')} WHERE id=$1 RETURNING *`,
    params,
  );
  return res.rows[0] ?? null;
}

export async function updatePaymentByHash(
  paymentHash: string,
  status: PaymentStatus,
  extra: {
    confirmedAt?: Date;
    settlementDate?: Date;
  } = {},
): Promise<PaymentRow | null> {
  const sets: string[] = ['status=$2'];
  const params: unknown[] = [paymentHash, status];
  if (extra.confirmedAt) {
    params.push(extra.confirmedAt);
    sets.push(`confirmed_at=$${params.length}`);
  }
  if (extra.settlementDate) {
    params.push(extra.settlementDate);
    sets.push(`settlement_date=$${params.length}`);
  }
  const res = await pool.query<PaymentRow>(
    `UPDATE payments SET ${sets.join(', ')} WHERE lnbits_payment_hash=$1 RETURNING *`,
    params,
  );
  return res.rows[0] ?? null;
}

export async function listPendingPayments(): Promise<PaymentRow[]> {
  const res = await pool.query<PaymentRow>(
    `SELECT * FROM payments WHERE status IN ('Pending','Processing')`,
  );
  return res.rows;
}
