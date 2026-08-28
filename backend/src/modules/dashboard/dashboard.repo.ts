import { pool } from '../../config/db';

export interface DashboardStats {
  totalReceived: number;
  totalInvoiced: number;
  totalOutstanding: number;
  totalWithdrawn: number;
  collectionRate: number;
  settlementRate: number;
  todayAmount: number;
  recentPayments: unknown[];
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const received = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) s FROM payments
     WHERE tenant_id=$1 AND status IN ('Paid','Settlement Pending','Settled')`,
    [tenantId],
  );
  const invoiced = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) s FROM invoices
     WHERE tenant_id=$1 AND status <> 'Cancelled'`,
    [tenantId],
  );
  const withdrawn = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) s FROM withdrawals
     WHERE tenant_id=$1 AND status='Completed'`,
    [tenantId],
  );
  const today = await pool.query<{ s: string | null }>(
    `SELECT COALESCE(SUM(amount),0) s FROM payments
     WHERE tenant_id=$1 AND confirmed_at::date = CURRENT_DATE`,
    [tenantId],
  );
  const settledCount = await pool.query<{ c: string }>(
    `SELECT COUNT(*) c FROM payments WHERE tenant_id=$1 AND status='Settled'`,
    [tenantId],
  );
  const totalCount = await pool.query<{ c: string }>(
    `SELECT COUNT(*) c FROM payments WHERE tenant_id=$1`,
    [tenantId],
  );
  const recent = await pool.query(
    `SELECT p.*, s.name AS student_name, i.description AS invoice_description
     FROM payments p
     JOIN students s ON s.id = p.student_id
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.tenant_id=$1
     ORDER BY p.date DESC LIMIT 10`,
    [tenantId],
  );

  const totalReceived = Number(received.rows[0].s ?? 0);
  const totalInvoiced = Number(invoiced.rows[0].s ?? 0);
  const totalWithdrawn = Number(withdrawn.rows[0].s ?? 0);
  const totalOutstanding = totalInvoiced - totalReceived;
  const todayAmount = Number(today.rows[0].s ?? 0);
  const settled = Number(settledCount.rows[0].c);
  const total = Number(totalCount.rows[0].c);

  return {
    totalReceived,
    totalInvoiced,
    totalOutstanding: Math.max(0, totalOutstanding),
    totalWithdrawn,
    collectionRate: totalInvoiced > 0 ? totalReceived / totalInvoiced : 0,
    settlementRate: total > 0 ? settled / total : 0,
    todayAmount,
    recentPayments: recent.rows,
  };
}

export type ChartPeriod = '7D' | '30D' | '90D' | '12M';

export async function getChartSeries(
  tenantId: string,
  period: ChartPeriod,
): Promise<{ date: string; volume: number; count: number }[]> {
  const interval = period === '12M' ? 'month' : 'day';
  const lookback =
    period === '7D' ? "7 days" : period === '30D' ? "30 days" : period === '90D' ? "90 days" : "12 months";

  const res = await pool.query<{ date: string; volume: string; count: string }>(
    `SELECT
        to_char(date_trunc($2, date), 'YYYY-MM-DD') AS date,
        COALESCE(SUM(amount),0)::text AS volume,
        COUNT(*)::text AS count
     FROM payments
     WHERE tenant_id=$1 AND confirmed_at IS NOT NULL AND date >= now() - ($3::interval)
     GROUP BY 1
     ORDER BY 1 ASC`,
    [tenantId, interval, lookback],
  );
  return res.rows.map((r) => ({
    date: r.date,
    volume: Number(r.volume),
    count: Number(r.count),
  }));
}
