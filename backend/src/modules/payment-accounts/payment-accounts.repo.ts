import { pool } from '../../config/db';
import type { PaymentAccount, PaymentAccountType } from '../types';

interface PaymentAccountRow {
  id: string;
  tenant_id: string;
  type: string;
  label: string;
  holder_name: string;
  number: string;
  provider: string | null;
  currency: string;
  is_default: boolean;
}

export function maskAccountNumber(number: string): string {
  const last4 = number.slice(-4);
  return `•••• ${last4}`;
}

export function maskPaymentAccount(r: PaymentAccountRow): PaymentAccount {
  const prefix = r.provider || r.label;
  return {
    id: r.id,
    tenantId: r.tenant_id,
    type: r.type as PaymentAccountType,
    label: r.label,
    holderName: r.holder_name,
    // The full account/mobile number is never exposed to the client. Only the
    // last 4 digits are sent (the frontend renders "•••• 3456" from these);
    // the raw value stays server-side and is used only at withdrawal time.
    number: r.number.slice(-4),
    provider: r.provider,
    currency: r.currency,
    isDefault: r.is_default,
    masked: `${prefix} · •••• ${r.number.slice(-4)}`,
  };
}

export async function listPaymentAccounts(
  tenantId: string,
  currency?: string,
): Promise<PaymentAccountRow[]> {
  const params: unknown[] = [tenantId];
  let sql = 'SELECT * FROM payment_accounts WHERE tenant_id=$1';
  if (currency) {
    params.push(currency.toUpperCase());
    sql += ` AND currency=$${params.length}`;
  }
  sql += ' ORDER BY is_default DESC, id';
  const res = await pool.query<PaymentAccountRow>(sql, params);
  return res.rows;
}

export async function getPaymentAccount(
  tenantId: string,
  id: string,
): Promise<PaymentAccountRow | null> {
  const res = await pool.query<PaymentAccountRow>(
    'SELECT * FROM payment_accounts WHERE tenant_id=$1 AND id=$2',
    [tenantId, id],
  );
  return res.rows[0] ?? null;
}

export async function createPaymentAccount(data: {
  id: string;
  tenantId: string;
  type: PaymentAccountType;
  label: string;
  holderName: string;
  number: string;
  provider?: string | null;
  currency: string;
  isDefault: boolean;
}): Promise<PaymentAccountRow> {
  const res = await pool.query<PaymentAccountRow>(
    `INSERT INTO payment_accounts (id, tenant_id, type, label, holder_name, number, provider, currency, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.id,
      data.tenantId,
      data.type,
      data.label,
      data.holderName,
      data.number,
      data.provider ?? null,
      data.currency,
      data.isDefault,
    ],
  );
  return res.rows[0];
}

export async function deletePaymentAccount(
  tenantId: string,
  id: string,
): Promise<boolean> {
  const res = await pool.query(
    'DELETE FROM payment_accounts WHERE tenant_id=$1 AND id=$2',
    [tenantId, id],
  );
  return (res.rowCount ?? 0) > 0;
}

/** Clear default flag for all accounts of a tenant (used before setting a new default). */
export async function clearDefault(tenantId: string): Promise<void> {
  await pool.query('UPDATE payment_accounts SET is_default=false WHERE tenant_id=$1', [tenantId]);
}
