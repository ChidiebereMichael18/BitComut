import { pool } from "../db/pool";

// Builds the canonical receipt for a payment, used by both the Student and
// University endpoints so every consumer sees the same complete record.
// A receipt ties together: transaction (payment) + Lightning/quote + invoice
// + the local-currency settlement record + receiving university.
export async function getReceipt(paymentId: string): Promise<any | null> {
  const { rows } = await pool.query(
    `SELECT
       p.id                                              AS payment_id,
       p.tx_reference,
       p.payment_method,
       p.status                                          AS payment_status,
       p.created_at                                      AS payment_created_at,
       p.settled_at                                      AS payment_settled_at,
       p.ln_payment_hash,
       p.ln_payment_request,

       q.from_currency,
       q.to_currency,
       q.from_amount,
       q.btc_amount,
       q.btc_rate,
       q.fx_usd_rate,

       ti.id                                             AS invoice_id,
       ti.student_ref,
       ti.amount                                         AS invoice_amount,
       ti.currency                                       AS invoice_currency,
       ti.description                                    AS invoice_description,
       ti.status                                         AS invoice_status,

       u.id                                              AS university_id,
       u.name                                            AS university_name,
       u.country                                         AS university_country,

       s.id                                              AS settlement_id,
       s.amount                                          AS settlement_amount,
       s.currency                                        AS settlement_currency,
       s.status                                          AS settlement_status,
       s.settled_at                                      AS settlement_settled_at
     FROM payments p
     JOIN fx_quotes q ON q.id = p.quote_id
     JOIN tuition_invoices ti ON ti.id = p.invoice_id
     JOIN universities u ON u.id = ti.university_id
     LEFT JOIN settlements s ON s.payment_id = p.id
     WHERE p.id = $1`,
    [paymentId]
  );
  return rows[0] ?? null;
}
