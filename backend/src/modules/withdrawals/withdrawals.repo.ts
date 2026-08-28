import { pool } from '../../config/db';
import type { Withdrawal, WithdrawalStatus } from '../types';

interface WithdrawalRow {
  id: string;
  reference: string;
  tenant_id: string;
  amount: string;
  currency: string;
  payment_account_id: string;
  bank_account_label: string;
  status: string;
  created_at: Date;
  completed_at: Date | null;
  masked?: string;
}

export function mapWithdrawal(r: WithdrawalRow): Withdrawal {
  return {
    id: r.id,
    reference: r.reference,
    tenantId: r.tenant_id,
    amount: Number(r.amount),
    currency: r.currency,
    paymentAccountId: r.payment_account_id,
    bankAccountLabel: r.bank_account_label,
    status: r.status as WithdrawalStatus,
    createdAt: r.created_at.toISOString(),
    completedAt: r.completed_at ? r.completed_at.toISOString() : null,
  };
}

export async function createWithdrawal(data: {
  id: string;
  reference: string;
  tenantId: string;
  amount: number;
  currency: string;
  paymentAccountId: string;
  bankAccountLabel: string;
}): Promise<Withdrawal> {
  const res = await pool.query<WithdrawalRow>(
    `INSERT INTO withdrawals (id, reference, tenant_id, amount, currency, payment_account_id, bank_account_label, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending')
     RETURNING *`,
    [
      data.id,
      data.reference,
      data.tenantId,
      data.amount,
      data.currency,
      data.paymentAccountId,
      data.bankAccountLabel,
    ],
  );
  return mapWithdrawal(res.rows[0]);
}

export async function listWithdrawals(
  tenantId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<Withdrawal[]> {
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 50;
  const offset = opts.offset ?? 0;
  const res = await pool.query<WithdrawalRow>(
    'SELECT * FROM withdrawals WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset],
  );
  return res.rows.map(mapWithdrawal);
}

export async function getWithdrawal(
  tenantId: string,
  id: string,
): Promise<Withdrawal | null> {
  const res = await pool.query<WithdrawalRow>(
    'SELECT * FROM withdrawals WHERE tenant_id=$1 AND id=$2',
    [tenantId, id],
  );
  return res.rows[0] ? mapWithdrawal(res.rows[0]) : null;
}

/** Scoped status update; returns updated row or null if not found for tenant. */
export async function updateWithdrawalStatus(
  id: string,
  tenantId: string,
  status: WithdrawalStatus,
  completedAt?: Date,
): Promise<Withdrawal | null> {
  const sets: string[] = ['status=$3'];
  const params: unknown[] = [id, tenantId];
  let paramIdx = 3;
  if (status === 'Completed') {
    params.push(completedAt ?? new Date());
    sets.push(`completed_at=$${paramIdx + 1}`);
  }
  const res = await pool.query<WithdrawalRow>(
    `UPDATE withdrawals SET ${sets.join(', ')} WHERE id=$1 AND tenant_id=$2 RETURNING *`,
    params,
  );
  return res.rows[0] ? mapWithdrawal(res.rows[0]) : null;
}

export async function listPendingWithdrawals(): Promise<WithdrawalRow[]> {
  const res = await pool.query<WithdrawalRow>(
    "SELECT * FROM withdrawals WHERE status IN ('Pending','Processing')",
  );
  return res.rows;
}

export async function getWithdrawalByIdUnscoped(
  id: string,
): Promise<WithdrawalRow | null> {
  const res = await pool.query<WithdrawalRow>(
    'SELECT * FROM withdrawals WHERE id=$1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updateWithdrawalStatusByIdUnscoped(
  id: string,
  status: WithdrawalStatus,
  completedAt?: Date,
): Promise<Withdrawal | null> {
  let sql: string;
  const params: unknown[] = [status, id];
  if (status === 'Completed') {
    params.push(completedAt ?? new Date());
    sql = `UPDATE withdrawals SET status=$1, completed_at=$3 WHERE id=$2 RETURNING *`;
  } else {
    sql = `UPDATE withdrawals SET status=$1 WHERE id=$2 RETURNING *`;
  }
  const res = await pool.query<WithdrawalRow>(sql, params);
  return res.rows[0] ? mapWithdrawal(res.rows[0]) : null;
}
