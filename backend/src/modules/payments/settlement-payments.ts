import { pool } from '../../config/db';
import type { PaymentStatus, Payment } from '../types';

interface PaymentRow {
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
  student_name?: string | null;
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
    method: r.method as Payment['method'],
    network: r.network as Payment['network'],
    status: r.status as PaymentStatus,
    date: r.date.toISOString(),
    confirmedAt: r.confirmed_at ? r.confirmed_at.toISOString() : null,
    settlementDate: r.settlement_date ? r.settlement_date.toISOString() : null,
    lnbitsPaymentHash: r.lnbits_payment_hash,
    lnbitsWalletId: r.lnbits_wallet_id,
  };
}

/** Update a payment row by id (unscoped — internal worker use) and return join-enriched row. */
export async function updatePaymentByIdUnscopedStatus(
  id: string,
  status: PaymentStatus,
  extra: { confirmedAt?: Date; settlementDate?: Date } = {},
): Promise<PaymentRow | null> {
  const sets: string[] = ['status=$2'];
  const params: unknown[] = [id, status];
  if (extra.confirmedAt) {
    params.push(extra.confirmedAt);
    sets.push(`confirmed_at=$${params.length}`);
  }
  if (extra.settlementDate) {
    params.push(extra.settlementDate);
    sets.push(`settlement_date=$${params.length}`);
  }
  const res = await pool.query<PaymentRow>(
    `UPDATE payments SET ${sets.join(', ')} WHERE id=$1 RETURNING *`,
    params,
  );
  if (!res.rows[0]) return null;
  const enriched = await pool.query<PaymentRow>(
    `SELECT p.*, s.name AS student_name, i.description AS invoice_description
     FROM payments p
     JOIN students s ON s.id = p.student_id
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.id=$1`,
    [id],
  );
  return enriched.rows[0] ?? res.rows[0];
}
