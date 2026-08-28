import { pool } from '../../config/db';
import type { Settlement, SettlementStatus } from '../types';

interface SettlementRow {
  id: string;
  reference: string;
  tenant_id: string;
  payment_id: string;
  student_id: string;
  btc_sats: string;
  local_amount: string;
  currency: string;
  exchange_rate: string;
  fees: string;
  net_amount: string;
  status: string;
  date: Date;
}

export function mapSettlement(r: SettlementRow): Settlement {
  return {
    id: r.id,
    reference: r.reference,
    tenantId: r.tenant_id,
    paymentId: r.payment_id,
    studentId: r.student_id,
    btcSats: Number(r.btc_sats),
    localAmount: Number(r.local_amount),
    currency: r.currency,
    exchangeRate: Number(r.exchange_rate),
    fees: Number(r.fees),
    netAmount: Number(r.net_amount),
    status: r.status as SettlementStatus,
    date: r.date.toISOString(),
  };
}

export interface CreateSettlementInput {
  id: string;
  reference: string;
  tenantId: string;
  paymentId: string;
  studentId: string;
  btcSats: number;
  localAmount: number;
  currency: string;
  exchangeRate: number;
  fees: number;
  netAmount: number;
  date: Date;
}

export async function createSettlement(
  data: CreateSettlementInput,
): Promise<Settlement> {
  const res = await pool.query<SettlementRow>(
    `INSERT INTO settlements (id, reference, tenant_id, payment_id, student_id, btc_sats,
                              local_amount, currency, exchange_rate, fees, net_amount, status, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Pending',$12)
     RETURNING *`,
    [
      data.id,
      data.reference,
      data.tenantId,
      data.paymentId,
      data.studentId,
      data.btcSats,
      data.localAmount,
      data.currency,
      data.exchangeRate,
      data.fees,
      data.netAmount,
      data.date,
    ],
  );
  return mapSettlement(res.rows[0]);
}

export async function listSettlements(
  tenantId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<Settlement[]> {
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 50;
  const offset = opts.offset ?? 0;
  const res = await pool.query<SettlementRow>(
    `SELECT * FROM settlements WHERE tenant_id=$1
     ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset],
  );
  return res.rows.map(mapSettlement);
}

export async function getSettlement(
  tenantId: string,
  id: string,
): Promise<Settlement | null> {
  const res = await pool.query<SettlementRow>(
    'SELECT * FROM settlements WHERE tenant_id=$1 AND id=$2',
    [tenantId, id],
  );
  return res.rows[0] ? mapSettlement(res.rows[0]) : null;
}

export async function getSettlementByPaymentId(
  paymentId: string,
): Promise<SettlementRow | null> {
  const res = await pool.query<SettlementRow>(
    'SELECT * FROM settlements WHERE payment_id=$1',
    [paymentId],
  );
  return res.rows[0] ?? null;
}

export async function getSettlementByIdUnscoped(
  id: string,
): Promise<SettlementRow | null> {
  const res = await pool.query<SettlementRow>(
    'SELECT * FROM settlements WHERE id=$1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updateSettlementStatus(
  id: string,
  status: SettlementStatus,
): Promise<SettlementRow | null> {
  const res = await pool.query<SettlementRow>(
    'UPDATE settlements SET status=$2 WHERE id=$1 RETURNING *',
    [id, status],
  );
  return res.rows[0] ?? null;
}

export async function listPendingSettlements(): Promise<SettlementRow[]> {
  const res = await pool.query<SettlementRow>(
    "SELECT * FROM settlements WHERE status IN ('Pending','Processing')",
  );
  return res.rows;
}

/**
 * Derived SettlementBalance — never stored. Computed from real state.
 */
export async function getSettlementBalance(
  tenantId: string,
  currency?: string,
): Promise<{
  totalCollected: number;
  totalWithdrawn: number;
  pendingAmount: number;
  availableBalance: number;
  lastWithdrawalAt: string | null;
  currency: string;
}> {
  const cur = currency ? currency.toUpperCase() : undefined;
  const curWhere = cur ? (suffix: string) => ` AND ${suffix} = $2` : () => '';
  const params = cur ? [tenantId, cur] : [tenantId];
  const collected = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) AS s FROM payments
     WHERE tenant_id=$1 AND status='Settled'${curWhere('currency')}`,
    params,
  );
  const withdrawn = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) AS s FROM withdrawals
     WHERE tenant_id=$1 AND status='Completed'${curWhere('currency')}`,
    params,
  );
  const pending = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) AS s FROM withdrawals
     WHERE tenant_id=$1 AND status IN ('Pending','Processing')${curWhere('currency')}`,
    params,
  );
  const last = await pool.query<{ at: Date | null }>(
    `SELECT completed_at AS at FROM withdrawals
     WHERE tenant_id=$1 AND status='Completed'${curWhere('currency')}
     ORDER BY completed_at DESC LIMIT 1`,
    params,
  );

  const totalCollected = Number(collected.rows[0].s ?? 0);
  const totalWithdrawn = Number(withdrawn.rows[0].s ?? 0);
  const pendingAmount = Number(pending.rows[0].s ?? 0);
  return {
    totalCollected,
    totalWithdrawn,
    pendingAmount,
    availableBalance: Math.max(0, totalCollected - totalWithdrawn - pendingAmount),
    lastWithdrawalAt: last.rows[0]?.at ? last.rows[0].at.toISOString() : null,
    currency: cur ?? (await tenantCurrency(tenantId)),
  };
}

async function tenantCurrency(tenantId: string): Promise<string> {
  const res = await pool.query<{ c: string }>(
    'SELECT COALESCE(currency, \'RWF\') AS c FROM tenants WHERE id=$1',
    [tenantId],
  );
  return res.rows[0]?.c ?? 'RWF';
}
