import { pool } from '../../config/db';
import { randomBytes } from 'crypto';
import { ids } from '../../lib/ids';
import { bus } from '../../lib/realtime/bus';
import { FxService } from '../../lib/fx/fx-service';
import { lnbits, type LnbitsInvoice } from '../../lib/lnbits/client';
import type { Invoice, InvoiceStatus, InvoiceType, Payment } from '../types';
import {
  createPayment,
  getPaymentByIdUnscoped,
  getPaymentByHash,
  updatePaymentStatus,
  type PaymentRow,
  type CreatePaymentInput,
} from './payments.repo';
import { createInvoice, getInvoice } from '../invoices/invoices.repo';
import { ApiError } from '../../middleware/error-handler';
import { createSettlement, getSettlementByPaymentId } from '../settlements/settlements.repo';
import type { SettlementProvider } from '../../lib/settlement/settlement-provider';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

function receiptNumber(year: number): string {
  const rand = randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  return `RC-${year}-${rand}`;
}

function invoiceNumber(): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export interface CreateLnpInput {
  tenantId: string;
  studentId: string;
  /** Existing invoice to charge; when omitted a new invoice is created. */
  invoiceId?: string;
  type: InvoiceType;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

export interface CreatedInvoicePayment {
  invoice: unknown;
  payment: Payment;
  lightning: {
    paymentRequest: string;
    paymentHash: string;
    sats: number;
    rate: number;
  };
}

export class PaymentService {
  constructor(
    private settlementProvider: SettlementProvider,
    private fx: FxService = new FxService(),
  ) {}

  /**
   * "Create University Invoice → Generate Lightning Invoice" — creates the
   * Bitcomut invoice record, computes the sats quote (snapshot), creates the
   * LNbits Lightning invoice, and records the Pending Payment.
   */
  async createInvoicePayment(input: CreateLnpInput): Promise<CreatedInvoicePayment> {
    const now = new Date();

    let invoice: Invoice;
    if (input.invoiceId) {
      const existing = await getInvoice(input.tenantId, input.invoiceId);
      if (!existing) {
        throw ApiError.badRequest('Invoice not found', 'INVOICE_NOT_FOUND');
      }
      invoice = existing;
    } else {
      const invoiceId = ids.invoice();
      invoice = await createInvoice({
        id: invoiceId,
        number: invoiceNumber(),
        tenantId: input.tenantId,
        studentId: input.studentId,
        type: input.type,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        dueDate: input.dueDate,
        status: 'Unpaid',
        created: now,
      });
    }

    // FX quote — snapshotted once, never recomputed.
    const { sats, rate } = await this.fx.quote(invoice.currency, invoice.amount);

    // LNbits Lightning invoice.
    const webhook = `${env.BITCOMUT_BASE_URL.replace(/\/$/, '')}/webhooks/lnbits`;
    let lnInvoice: LnbitsInvoice;
    let walletId: string | null = null;
    try {
      lnInvoice = await lnbits.createInvoice({
        amountSats: sats,
        memo: `${invoice.number ?? invoice.id} — ${invoice.description || invoice.type}`,
        webhook,
      });
      walletId = (await lnbits.checkWallet().catch(() => null))?.id ?? null;
    } catch (err) {
      logger.error({ err }, 'LNbits create invoice failed');
      throw err;
    }

    const paymentId = ids.payment();
    const reference = lnInvoice.payment_hash
      ? `lnbc_${lnInvoice.payment_hash.slice(0, 16)}`
      : `lnbc_${paymentId.slice(0, 12)}`;

    const payment = await createPayment({
      id: paymentId,
      reference,
      tenantId: input.tenantId,
      studentId: input.studentId,
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      btcSats: sats,
      exchangeRate: rate,
      method: 'Bitcoin / Lightning',
      network: 'Lightning Network',
      status: 'Pending',
      date: now,
      lnbitsPaymentHash: lnInvoice.payment_hash,
      lnbitsWalletId: walletId,
      paymentRequest: lnInvoice.payment_request,
    });

    this.emitPaymentEvent(input.tenantId, 'payment.created', payment, {
      studentName: '',
      invoiceDescription: invoice.description || invoice.type,
    });

    return {
      invoice: { ...invoice },
      payment,
      lightning: {
        paymentRequest: lnInvoice.payment_request,
        paymentHash: lnInvoice.payment_hash,
        sats,
        rate,
      },
    };
  }

  private emitPaymentEvent(
    tenantId: string,
    type: 'payment.created' | 'payment.detected' | 'payment.confirmed' | 'payment.failed' | 'settlement.processing' | 'settlement.completed',
    payment: Payment,
    ctx: { studentName: string; invoiceDescription: string },
  ) {
    bus.emitPayment(tenantId, {
      type,
      paymentId: payment.id,
      reference: payment.reference,
      studentId: payment.studentId,
      studentName: ctx.studentName,
      invoiceDescription: ctx.invoiceDescription,
      amount: payment.amount,
      currency: payment.currency,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create a Payment record (Pending). The Lightning invoice is created by the
   * caller before or after this; lnbitsPaymentHash is attached once known.
   */
  async record(input: Omit<CreatePaymentInput, 'id'>): Promise<Payment> {
    const payment = await createPayment({ ...input, id: ids.payment() });
    return payment;
  }

  /**
   * Confirm a payment on first observation of it being paid (webhook or poll).
   * Transitions Pending → Paid, freezes btc_sats/exchange_rate (already stored),
   * updates the parent invoice, generates the Receipt, emits payment.confirmed
   * and starts the settlement pipeline.
   */
  async confirmPayment(paymentHash: string): Promise<Payment | null> {
    const row = await getPaymentByHash(paymentHash);
    if (!row) return null;

    if (row.status === 'Paid' || row.status === 'Settlement Pending' || row.status === 'Settled') {
      // Already confirmed — idempotent.
      return row as unknown as Payment;
    }
    if (row.status === 'Failed') return row as unknown as Payment;

    const confirmedAt = new Date();

    return await pool.connect().then(async (client) => {
      try {
        await client.query('BEGIN');

        const updated = await client.query<PaymentRow>(
          `UPDATE payments SET status='Paid', confirmed_at=$2 WHERE id=$1 RETURNING *`,
          [row.id, confirmedAt],
        );
        const payRow = updated.rows[0];

        // invoice.amount_paid += payment amount; recompute invoice status
        await addToInvoicePaidNoClient(client, row.invoice_id, row.tenant_id, Number(row.amount));
        const invStatus = await recomputeInvoiceStatusNoClient(
          client,
          row.invoice_id,
          row.tenant_id,
        );
        void invStatus;

        // Receipt generated at confirmed.
        const receipt = await createReceiptNoClient(client, {
          id: ids.receipt(),
          number: receiptNumber(new Date().getFullYear()),
          tenantId: row.tenant_id,
          studentId: row.student_id,
          invoiceId: row.invoice_id,
          paymentId: row.id,
          amount: Number(row.amount),
          currency: row.currency,
          date: confirmedAt,
        });
        void receipt;

        await client.query('COMMIT');

        const payment = await getPaymentByIdUnscoped(row.id);
        if (!payment) return null;

        bus.emitPayment(row.tenant_id, {
          type: 'payment.confirmed',
          paymentId: payRow.id,
          reference: payRow.reference,
          studentId: payRow.student_id,
          studentName: row.student_name ?? '',
          invoiceDescription: row.invoice_description ?? '',
          amount: Number(payRow.amount),
          currency: payRow.currency,
          timestamp: confirmedAt.toISOString(),
        });

        // Kick off settlement (simulated).
        await this.startSettlement(payRow);

        return payment as unknown as Payment;
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err, paymentId: row.id }, 'confirmPayment failed');
        throw err;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Create the Settlement (Pending) for a confirmed payment and schedule the
   * simulated payout job. Sets Payment.status = 'Settlement Pending'.
   */
  async startSettlement(row: PaymentRow): Promise<void> {
    const existing = await getSettlementByPaymentId(row.id);
    if (existing) return;

    const year = new Date().getFullYear();
    const refTail = row.id.replace(/[^0-9]/g, '').slice(-3) || '0';
    const reference = `SET-${year}-${(randomBytes(2).readUInt16BE(0) % 900 + 100).toString().padStart(3, '0')}${refTail.slice(0, 1)}`;

    const settlement = await createSettlement({
      id: ids.settlement(),
      reference,
      tenantId: row.tenant_id,
      paymentId: row.id,
      studentId: row.student_id,
      btcSats: Number(row.btc_sats),
      localAmount: Number(row.amount),
      currency: row.currency,
      exchangeRate: Number(row.exchange_rate),
      fees: 0,
      netAmount: Number(row.amount),
      date: new Date(),
    });

    // Payment → Settlement Pending
    await updatePaymentStatus(row.id, 'Settlement Pending');

    bus.emitPayment(row.tenant_id, {
      type: 'settlement.processing',
      paymentId: row.id,
      reference: row.reference,
      studentId: row.student_id,
      studentName: row.student_name ?? '',
      invoiceDescription: row.invoice_description ?? '',
      amount: Number(row.amount),
      currency: row.currency,
      timestamp: new Date().toISOString(),
    });

    // Schedule simulated payout via the provider.
    await this.settlementProvider.initiate({
      id: settlement.id,
      reference: settlement.reference,
      tenantId: row.tenant_id,
      studentId: row.student_id,
      btcSats: Number(row.btc_sats),
      localAmount: Number(row.amount),
      currency: row.currency,
      exchangeRate: Number(row.exchange_rate),
    });
  }

  /** Cancel/fail a pending payment (e.g. invoice expired). */
  async failPayment(id: string): Promise<Payment | null> {
    const row = await getPaymentByIdUnscoped(id);
    if (!row) return null;
    const updated = await updatePaymentStatus(id, 'Failed');
    if (updated) {
      bus.emitPayment(row.tenant_id, {
        type: 'payment.failed',
        paymentId: row.id,
        reference: row.reference,
        studentId: row.student_id,
        studentName: '',
        invoiceDescription: '',
        amount: Number(row.amount),
        currency: row.currency,
        timestamp: new Date().toISOString(),
      });
    }
    return updated as unknown as Payment;
  }

  /** Reconcile a single payment by checking LNbits. Returns true if newly confirmed. */
  async reconcilePayment(paymentHash: string, paid: boolean): Promise<void> {
    if (!paid) return;
    await this.confirmPayment(paymentHash);
  }
}

// --- transaction-aware variants (used inside confirmPayment's txn) ----------

async function addToInvoicePaidNoClient(
  client: { query: (t: string, p: unknown[]) => Promise<{ rows: unknown[] }> },
  invoiceId: string,
  tenantId: string,
  amount: number,
): Promise<void> {
  await client.query(
    'UPDATE invoices SET amount_paid = amount_paid + $1 WHERE id=$2 AND tenant_id=$3',
    [amount, invoiceId, tenantId],
  );
}

async function recomputeInvoiceStatusNoClient(
  client: { query<T>(t: string, p: unknown[]): Promise<{ rows: T[] }> },
  invoiceId: string,
  tenantId: string,
): Promise<void> {
  const invRes = await client.query<InvoiceStatusRow>(
    'SELECT amount, amount_paid, due_date FROM invoices WHERE id=$1 AND tenant_id=$2',
    [invoiceId, tenantId],
  );
  if (!invRes.rows[0]) return;
  const { amount, amount_paid, due_date } = invRes.rows[0];
  const amt = Number(amount);
  const paid = Number(amount_paid);
  const now = new Date();
  const due = new Date(due_date);
  let status: InvoiceStatus;
  if (paid >= amt) status = 'Paid';
  else if (paid > 0) status = 'Partially Paid';
  else if (now > due) status = 'Overdue';
  else status = 'Unpaid';
  await client.query('UPDATE invoices SET status=$2 WHERE id=$1', [invoiceId, status]);
}

interface InvoiceStatusRow {
  amount: string;
  amount_paid: string;
  due_date: Date;
}

async function createReceiptNoClient(
  client: { query: (t: string, p: unknown[]) => Promise<{ rows: unknown[] }> },
  data: {
    id: string;
    number: string;
    tenantId: string;
    studentId: string;
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    date: Date;
  },
): Promise<unknown> {
  const res = await client.query(
    `INSERT INTO receipts (id, number, tenant_id, student_id, invoice_id, payment_id,
                           amount, currency, date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Issued') RETURNING *`,
    [
      data.id, data.number, data.tenantId, data.studentId, data.invoiceId,
      data.paymentId, data.amount, data.currency, data.date,
    ],
  );
  return res.rows[0];
}
