import { pool } from "../db/pool";
import { audit } from "./audit";
import { createQuote, getActiveQuote, BTC_SATS_PER, convertFiatToFiat, convertToBtc } from "./fx";
import { generatePaymentCode, generateQrDataUrl } from "./qr";
import { LightningRail } from "../adapters/lightning/types";
import { settleToUniversity } from "../adapters/settlement";
import { HttpError } from "../middleware/handlers";
import { createNotification } from "./notifications";

export interface PaymentFlowResult {
  quote: any;
  invoice: any;
  paymentId: string;
  txReference: string;
}

export class PaymentService {
  constructor(private rail: LightningRail) {}

  // student: select university invoice -> get locked quote
  async quoteInvoice(invoiceId: string, fromCurrency: string): Promise<any> {
    const { rows } = await pool.query(
      `SELECT * FROM tuition_invoices WHERE id = $1`,
      [invoiceId]
    );
    if (!rows[0]) throw new Error("Invoice not found");
    const invoice = rows[0];

    // Student pays in their own currency (fromCurrency). The invoice is
    // denominated in the university's currency, so convert the amount the
    // student must pay into fromCurrency (routed via BTC).
    const toId_ = (invoice.currency as string).replace(/^CURRENCY_/, "").toUpperCase();
    const fromId_ = (fromCurrency as string).replace(/^CURRENCY_/, "").toUpperCase();
    // When the student pays in BTC against a fiat-denominated invoice, they owe
    // the fiat amount expressed in BTC (payable in Bitcoin, settled over
    // Lightning). Every other case converts payer -> invoice currency via BTC.
    const payableAmount =
      toId_ === fromId_
        ? Number(invoice.amount)
        : fromId_ === "BTC"
          ? await convertToBtc(toId_, Number(invoice.amount))
          : await convertFiatToFiat(fromId_, toId_, Number(invoice.amount));

    const quote = await createQuote({
      invoiceId,
      fromCurrency,
      toCurrency: invoice.currency,
      fromAmount: payableAmount,
    });

    return { invoice, quote, fromAmount: payableAmount };
  }

  // student: generate a Lightning invoice against a locked quote
  async generatePayment(invoiceId: string, quoteId: string): Promise<PaymentFlowResult> {
    const quote = await getActiveQuote(quoteId);
    if (!quote) throw new Error("Quote expired or not found");

    // BTC amount is deterministic from the locked quote.
    const btcAmount = Number(quote.btc_amount);
    const amountSat = Math.round(btcAmount * BTC_SATS_PER);

    // Create the Lightning invoice for that many sats.
    const invoice = await this.rail.createInvoice({
      amountSat,
      memo: `Tuition payment invoice ${invoiceId}`,
    });

    const { rows } = await pool.query(
      `INSERT INTO payments
         (invoice_id, quote_id, from_currency, to_currency, from_amount, btc_amount,
          status, ln_payment_hash, ln_payment_request, tx_reference)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9)
       RETURNING *`,
      [
        invoiceId,
        quoteId,
        quote.from_currency,
        quote.to_currency,
        quote.from_amount,
        btcAmount,
        invoice.paymentHash,
        invoice.paymentRequest,
        "TX-" + Date.now().toString(36).toUpperCase(),
      ]
    );

    await audit({ actor: "student", action: "payment.generated", entity: "payments", entityId: rows[0].id, meta: { quoteId, btcAmount } });

    return { quote, invoice, paymentId: rows[0].id, txReference: rows[0].tx_reference };
  }

  // University-issued Lightning invoice for a tuition payment.
  //
  // The university creates the real Lightning invoice and distributes the
  // payment_code / QR to the student. The student scans the QR (scannable by
  // any Lightning wallet) or types the payment_code to pay. The transaction is
  // confirmed only once the bolt11 invoice is settled on the node — this
  // matches the "paid only when invoice is confirmed" rule.
  async createUniversityPayment(invoiceId: string, derivative: "from_amount" | "btc_amount" = "from_amount"): Promise<any> {
    const invoiceRes = await pool.query(
      `SELECT tu.*, u.id AS uni_id, u.name AS uni_name, u.currency AS uni_currency
         FROM tuition_invoices tu
         JOIN universities u ON u.id = tu.university_id
        WHERE tu.id = $1 AND tu.status = 'unpaid'`,
      [invoiceId]
    );
    const invoice = invoiceRes.rows[0];
    if (!invoice) throw new Error("Invoice not found or not unpaid");

    // If student_id is not already linked on the invoice, check if an approved enrollment exists
    let studentId = invoice.student_id;
    if (!studentId) {
      const enrollRes = await pool.query(
        `SELECT student_id FROM student_enrollments
          WHERE university_id = $1 AND student_ref = $2 AND status = 'approved'`,
        [invoice.uni_id, invoice.student_ref]
      );
      if (enrollRes.rows[0]) {
        studentId = enrollRes.rows[0].student_id;
        await pool.query(`UPDATE tuition_invoices SET student_id = $1 WHERE id = $2`, [studentId, invoiceId]);
      }
    }

    // Lock a quote from the university's local currency to its own currency
    // (the university is the origin and the recipient in this corridor).
    const quote = await createQuote({
      invoiceId,
      fromCurrency: invoice.uni_currency,
      toCurrency: invoice.uni_currency,
      fromAmount: Number(invoice.amount),
    });

    const btcAmount = Number(quote.btc_amount);
    const amountSat = Math.round(btcAmount * BTC_SATS_PER);

    // Real Lightning invoice (bolt11) the student will scan / copy.
    const ln = await this.rail.createInvoice({
      amountSat,
      memo: `Tuition ${invoice.student_ref}`,
    });

    const paymentCode = generatePaymentCode();
    const qr = await generateQrDataUrl(ln.paymentRequest);

    const { rows } = await pool.query(
      `INSERT INTO payments
         (invoice_id, quote_id, from_currency, to_currency, from_amount, btc_amount,
          status, ln_payment_hash, ln_payment_request, payment_code, qr, tx_reference)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10,'TX-'||$11)
       RETURNING *`,
      [
        invoiceId,
        quote.id,
        invoice.uni_currency,
        invoice.uni_currency,
        Number(invoice.amount),
        btcAmount,
        ln.paymentHash,
        ln.paymentRequest,
        paymentCode,
        qr,
        Date.now().toString(36).toUpperCase(),
      ]
    );
    const p = rows[0];

    await audit({ actor: "university", action: "payment.invoice_created", entity: "payments", entityId: p.id, meta: { invoiceId, paymentCode } });

    if (studentId) {
      await createNotification({
        recipientType: "student",
        recipientId: studentId,
        title: "New Tuition Invoice Issued",
        message: `${invoice.uni_name || "Your university"} has issued a tuition invoice of ${invoice.amount} ${invoice.uni_currency} for reference ${invoice.student_ref}.`,
        type: "invoice_issued",
        data: {
          invoiceId,
          paymentId: p.id,
          paymentCode,
          amount: Number(invoice.amount),
          currency: invoice.uni_currency,
          studentRef: invoice.student_ref,
        },
      });
    }

    return {
      paymentId: p.id,
      paymentCode,
      qr,
      bolt11: ln.paymentRequest,
      // Wallet-scannable payload is the bolt11 itself:
      lightning: ln.paymentRequest,
      amountSat,
      universityCurrency: invoice.uni_currency,
      amount: Number(invoice.amount),
      studentRef: invoice.student_ref,
      status: "pending",
      rail: this.rail.kind,
    };
  }

  // Find a payment (and its bolt11/QR) by its short payment_code, within a
  // given university's scope so nothing mixes across universities.
  async getPaymentByCodeScope(paymentCode: string, universityId: string): Promise<any> {
    const { rows } = await pool.query(
      `SELECT p.*, p.qr, p.ln_payment_request AS bolt11
         FROM payments p
         JOIN tuition_invoices ti ON ti.id = p.invoice_id
        WHERE p.payment_code = $1 AND ti.university_id = $2`,
      [paymentCode, universityId]
    );
    if (!rows[0]) throw new HttpError(404, "Payment code not found in this university");
    return rows[0];
  }

  // Student-facing lookup by short payment_code (university scoped when
  // universityId is provided, otherwise global). Returns the shareable payment
  // details the student needs to scan / copy and complete payment.
  async getPaymentByCode(paymentCode: string, universityId?: string): Promise<any> {
    const uniWhere = universityId ? " AND ti.university_id = $2" : "";
    const params = universityId ? [paymentCode, universityId] : [paymentCode];
    const { rows } = await pool.query(
      `SELECT p.id AS payment_id, p.status, p.from_amount, p.from_currency,
              p.btc_amount, p.payment_code, p.qr, p.ln_payment_request AS bolt11,
              ti.student_ref, ti.amount AS invoice_amount, ti.currency AS invoice_currency,
              u.name AS university
         FROM payments p
         JOIN tuition_invoices ti ON ti.id = p.invoice_id
         JOIN universities u ON u.id = ti.university_id
        WHERE p.payment_code = $1${uniWhere}`,
      params
    );
    if (!rows[0]) throw new HttpError(404, "Payment code not found");
    return rows[0];
  }

  // Check the Lightning node's balance (ops view).
  async getNodeBalance(): Promise<any> {
    const bal = await this.rail.getBalance();
    return { rail: this.rail.kind, ...bal };
  }

  // Per-university ledger: how much has been received / settled in its local
  // currency. This is the university's private balance under its own scope.
  async getUniversityLedger(universityId: string): Promise<any> {
    const { rows } = await pool.query(
      `SELECT tu.university_id,
              COALESCE(SUM(CASE WHEN p.status IN ('paid','settled') THEN p.from_amount ELSE 0 END),0) AS received,
              COALESCE(SUM(CASE WHEN p.status = 'settled' THEN p.from_amount ELSE 0 END),0) AS settled,
              COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.from_amount ELSE 0 END),0) AS pending,
              COUNT(*) FILTER (WHERE p.status IN ('paid','settled')) AS paid_count,
              COUNT(*) FILTER (WHERE p.status = 'pending') AS pending_count
         FROM payments p
         JOIN tuition_invoices tu ON tu.id = p.invoice_id
        WHERE tu.university_id = $1
        GROUP BY tu.university_id`,
      [universityId]
    );
    return rows[0] ?? { received: 0, settled: 0, pending: 0, paid_count: 0, pending_count: 0 };
  }

  // After Lightning payment is detected, confirm + settle in local currency.
  async confirmAndSettle(paymentId: string, paymentHash: string): Promise<any> {
    const status = await this.rail.lookupInvoice(paymentHash);
    if (!status.settled) throw new Error("Payment not yet settled on the rail");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      const payment = rows[0];
      if (!payment) throw new Error("Payment not found");
      if (payment.status === "settled") return payment;

      await client.query(
        `UPDATE payments SET status = 'confirmed', settled_at = now() WHERE id = $1`,
        [paymentId]
      );
      await client.query(
        `UPDATE tuition_invoices SET status = 'paid' WHERE id = $1`,
        [payment.invoice_id]
      );
      await client.query(`UPDATE fx_quotes SET status = 'used' WHERE id = $1`, [payment.quote_id]);

      const inv = await client.query(`SELECT * FROM tuition_invoices WHERE id = $1`, [payment.invoice_id]);
      const invoice = inv.rows[0];

      await client.query(
        `INSERT INTO settlements (payment_id, university_id, amount, currency, status)
         VALUES ($1,$2,$3,$4,'pending')`,
        [paymentId, invoice.university_id, invoice.amount, invoice.currency]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    await audit({ actor: "system", action: "payment.confirmed", entity: "payments", entityId: paymentId });
    return this.completeSettlementFlow(paymentId);
  }

  // Marks a local-currency settlement as completed (called by settlement adapter).
  async completeSettlement(paymentId: string, universityId: string, currency: string, amount: number): Promise<any> {
    const { rows } = await pool.query(
      `UPDATE settlements SET status = 'completed', settled_at = now()
       WHERE payment_id = $1 RETURNING *`,
      [paymentId]
    );
    const settlement = rows[0] ?? {
      payment_id: paymentId,
      university_id: universityId,
      amount,
      currency,
      status: "completed",
      settled_at: new Date(),
    };

    await pool.query(`UPDATE payments SET status = 'settled' WHERE id = $1`, [paymentId]);
    await audit({ actor: "system", action: "settlement.completed", entity: "settlements", entityId: settlement.id, meta: { amount, currency } });

    // Notify university
    await createNotification({
      recipientType: "university",
      recipientId: universityId,
      title: "Tuition Payment Settled",
      message: `Settlement of ${amount} ${currency} completed for payment reference ${settlement.id || paymentId}.`,
      type: "payment_settled",
      data: { paymentId, amount, currency, settlementId: settlement.id },
    });

    // Notify student if linked
    const invRes = await pool.query(
      `SELECT ti.student_id, ti.student_ref, u.name AS university_name
         FROM payments p
         JOIN tuition_invoices ti ON ti.id = p.invoice_id
         JOIN universities u ON u.id = ti.university_id
        WHERE p.id = $1`,
      [paymentId]
    );
    if (invRes.rows[0]?.student_id) {
      await createNotification({
        recipientType: "student",
        recipientId: invRes.rows[0].student_id,
        title: "Payment Settled",
        message: `Your payment of ${amount} ${currency} to ${invRes.rows[0].university_name} has settled successfully.`,
        type: "payment_settled",
        data: { paymentId, amount, currency, studentRef: invRes.rows[0].student_ref },
      });
    }

    return settlement;
  }

  private async completeSettlementFlow(paymentId: string): Promise<any> {
    const { rows } = await pool.query(
      `SELECT p.*, s.university_id, ti.amount AS invoice_amount, ti.currency AS invoice_currency
       FROM payments p
       JOIN settlements s ON s.payment_id = p.id
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
       WHERE p.id = $1`,
      [paymentId]
    );
    const row = rows[0];
    const res = await settleToUniversity(row.university_id, row.invoice_currency, Number(row.invoice_amount));
    if (res.ok) {
      return this.completeSettlement(paymentId, row.university_id, row.invoice_currency, Number(row.invoice_amount));
    }
    throw new Error("Settlement failed");
  }

  // For the simulated rail — marks an invoice as paid (demo convenience).
  async simulatePaid(paymentId: string): Promise<any> {
    const { rows } = await pool.query(`SELECT * FROM payments WHERE id = $1`, [paymentId]);
    const payment = rows[0];
    if (!payment) throw new Error("Payment not found");
    // If the rail can simulate settlement (mock mode), mark it settled first
    // so the confirm step mirrors a real LND-settled payment.
    const sim = (this.rail as any).simulateSettlement;
    if (typeof sim === "function") {
      await sim.call(this.rail, payment.ln_payment_hash);
    }
    return this.confirmAndSettle(paymentId, payment.ln_payment_hash);
  }
}

// Rail selection:
//   1. Voltage cloud (hosted LND over REST) when VOLTAGE_ENABLED=true in .env
//   2. Local LND over gRPC when LND paths are set
//   3. Simulated (default) — keeps the MVP demo light on a 4GB machine.
import { SimulatedRail } from "../adapters/lightning/simulated";
import { LndRail } from "../adapters/lightning/lnd";
import { VoltageRail } from "../adapters/lightning/voltage";
import { config } from "../config";

// The configured (desired) rail before any safety fallback.
export function configuredRailKind(): "voltage" | "lnd" | "simulated" {
  if (config.VOLTAGE_ENABLED) return "voltage";
  if (config.LND_TLS_CERT_PATH && config.LND_MACAROON_PATH) return "lnd";
  return "simulated";
}

// The rail actually active at runtime. If a real node is requested but not
// configured/reachable, we fall back to the simulator so the server never
// dies at startup — a half-configured .env must not take the API down.
export function currentRailKind(): "voltage" | "lnd" | "simulated" {
  const desired = configuredRailKind();
  if (desired === "voltage") {
    // URL may be auto-discovered from VOLTAGE_INFRA_KEY, but the admin
    // macaroon is always required (it can only be supplied manually).
    if (config.VOLTAGE_MACAROON) return "voltage";
    console.warn("[rail] VOLTAGE_ENABLED=true but VOLTAGE_MACAROON missing — falling back to simulated.");
    return "simulated";
  }
  if (desired === "lnd") {
    if (config.LND_TLS_CERT_PATH && config.LND_MACAROON_PATH) return "lnd";
    return "simulated";
  }
  return "simulated";
}

export function buildPaymentService(): PaymentService {
  let rail: LightningRail;
  const kind = currentRailKind();
  if (kind === "voltage") {
    rail = new VoltageRail();
  } else if (kind === "lnd") {
    rail = new LndRail();
  } else {
    rail = new SimulatedRail();
  }
  return new PaymentService(rail);
}
export interface RailStatus {
  configured: "voltage" | "lnd" | "simulated";
  active: "voltage" | "lnd" | "simulated";
  healthy: boolean;
  detail?: string;
}
export async function getRailStatus(): Promise<RailStatus> {
  const configured = configuredRailKind();
  const active = currentRailKind();
  let detail: string | undefined;
  let healthy = active === "simulated";
  if (active === "simulated" && configured !== "simulated") {
    detail =
      configured === "voltage"
        ? "VOLTAGE_ENABLED=true but VOLTAGE_MACAROON is empty — running on simulated rail (set the admin macaroon to go live)."
        : "LND requested but LND_TLS_CERT_PATH/LND_MACAROON_PATH are empty — running on simulated rail.";
  }
  return { configured, active, healthy, detail };
}

export const paymentService = buildPaymentService();
