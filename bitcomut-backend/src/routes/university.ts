import { Router } from "express";
import { pool } from "../db/pool";
import { getReceipt } from "../services/receipts";
import { buildPaymentService } from "../services/payments";
import { audit } from "../services/audit";
import {
  createNotification,
  getNotifications,
  markNotificationRead,
  getUnreadNotificationCount,
} from "../services/notifications";
import { asyncHandler, HttpError } from "../middleware/handlers";
import { requireAuth, requireUniversityAccess } from "../middleware/auth";

export const universityRouter = Router();
const payments = buildPaymentService();

// Every university-account route requires a valid university (or admin) token.
universityRouter.use(requireAuth);

function guardUniversity(req: any, universityId: string): void {
  requireUniversityAccess(req, universityId);
}

// Ensure a payment belongs to the given university; throws 404 otherwise so a
// university can never read another university's records by guessing a payment id.
async function assertPaymentInUniversity(paymentId: string, universityId: string): Promise<any> {
  const { rows } = await pool.query(
    `SELECT p.id
       FROM payments p
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
      WHERE p.id = $1 AND ti.university_id = $2`,
    [paymentId, universityId]
  );
  if (!rows[0]) throw new HttpError(404, "Payment not found in this university");
  return rows[0];
}

// -------------------------------------------------------------
// Student Network Enrollment & Approvals
// -------------------------------------------------------------

// List student enrollment/connection requests for this university
universityRouter.get(
  "/:universityId/enrollments",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { status } = req.query;
    const statusWhere = status ? " AND se.status = $2" : "";
    const params = status ? [req.params.universityId, String(status)] : [req.params.universityId];

    const { rows } = await pool.query(
      `SELECT se.id, se.student_ref, se.department, se.status, se.rejection_reason,
              se.approved_at, se.created_at,
              s.id AS student_id, s.name AS student_name, s.email AS student_email,
              s.phone AS student_phone, s.country AS student_country, s.currency AS student_currency
         FROM student_enrollments se
         JOIN students s ON s.id = se.student_id
        WHERE se.university_id = $1${statusWhere}
        ORDER BY se.created_at DESC`,
      params
    );
    res.json(rows);
  })
);

// Approve a student's enrollment after checking against university records/DB
universityRouter.post(
  "/:universityId/enrollments/:enrollmentId/approve",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { universityId, enrollmentId } = req.params;

    const enrollRes = await pool.query(
      `SELECT se.*, u.name AS university_name, s.name AS student_name
         FROM student_enrollments se
         JOIN universities u ON u.id = se.university_id
         JOIN students s ON s.id = se.student_id
        WHERE se.id = $1 AND se.university_id = $2`,
      [enrollmentId, universityId]
    );
    const enrollment = enrollRes.rows[0];
    if (!enrollment) throw new HttpError(404, "Enrollment request not found in this university");

    const { rows } = await pool.query(
      `UPDATE student_enrollments
          SET status = 'approved', approved_at = now(), rejection_reason = NULL
        WHERE id = $1
        RETURNING *`,
      [enrollmentId]
    );
    const updated = rows[0];

    // Disptach in-app notification to the student
    await createNotification({
      recipientType: "student",
      recipientId: enrollment.student_id,
      title: "Enrollment Approved!",
      message: `Congratulations ${enrollment.student_name}! ${enrollment.university_name} has verified your student record (${enrollment.student_ref}) and approved your connection.`,
      type: "enrollment_approved",
      data: {
        universityId,
        universityName: enrollment.university_name,
        enrollmentId,
        studentRef: enrollment.student_ref,
      },
    });

    await audit({
      actor: "university",
      action: "enrollment.approved",
      entity: "student_enrollments",
      entityId: enrollmentId,
      meta: { universityId, studentId: enrollment.student_id, studentRef: enrollment.student_ref },
    });

    res.json({
      ok: true,
      message: "Student enrollment approved successfully",
      enrollment: updated,
    });
  })
);

// Reject a student's enrollment if not found or invalid
universityRouter.post(
  "/:universityId/enrollments/:enrollmentId/reject",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { universityId, enrollmentId } = req.params;
    const { reason } = req.body;

    const enrollRes = await pool.query(
      `SELECT se.*, u.name AS university_name
         FROM student_enrollments se
         JOIN universities u ON u.id = se.university_id
        WHERE se.id = $1 AND se.university_id = $2`,
      [enrollmentId, universityId]
    );
    const enrollment = enrollRes.rows[0];
    if (!enrollment) throw new HttpError(404, "Enrollment request not found in this university");

    const rejectionMsg = reason || "Student record could not be verified in the university database";

    const { rows } = await pool.query(
      `UPDATE student_enrollments
          SET status = 'rejected', rejection_reason = $2
        WHERE id = $1
        RETURNING *`,
      [enrollmentId, rejectionMsg]
    );
    const updated = rows[0];

    // Dispatch notification to student
    await createNotification({
      recipientType: "student",
      recipientId: enrollment.student_id,
      title: "Enrollment Verification Failed",
      message: `${enrollment.university_name} could not verify your student ID (${enrollment.student_ref}): ${rejectionMsg}`,
      type: "enrollment_rejected",
      data: {
        universityId,
        enrollmentId,
        studentRef: enrollment.student_ref,
        reason: rejectionMsg,
      },
    });

    await audit({
      actor: "university",
      action: "enrollment.rejected",
      entity: "student_enrollments",
      entityId: enrollmentId,
      meta: { universityId, studentId: enrollment.student_id, studentRef: enrollment.student_ref, reason: rejectionMsg },
    });

    res.json({
      ok: true,
      message: "Student enrollment rejected",
      enrollment: updated,
    });
  })
);

// List all approved students in this university's network
universityRouter.get(
  "/:universityId/students",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.email, s.phone, s.country, s.currency,
              se.id AS enrollment_id, se.student_ref, se.department, se.approved_at
         FROM student_enrollments se
         JOIN students s ON s.id = se.student_id
        WHERE se.university_id = $1 AND se.status = 'approved'
        ORDER BY se.approved_at DESC`,
      [req.params.universityId]
    );
    res.json(rows);
  })
);

// Issue a tuition invoice for a student (automatically links approved student & notifies them)
universityRouter.post(
  "/:universityId/invoices",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { universityId } = req.params;
    const { student_ref, amount, currency, description, autoGeneratePayment = false } = req.body;
    if (!student_ref || !amount || !currency) {
      throw new HttpError(400, "student_ref, amount, and currency are required");
    }

    const uniRes = await pool.query(`SELECT * FROM universities WHERE id = $1`, [universityId]);
    if (!uniRes.rows[0]) throw new HttpError(404, "University not found");
    const university = uniRes.rows[0];

    // Check if an approved student enrollment exists
    const enrollRes = await pool.query(
      `SELECT student_id FROM student_enrollments
        WHERE university_id = $1 AND student_ref = $2 AND status = 'approved'`,
      [universityId, student_ref.trim()]
    );
    const studentId = enrollRes.rows[0]?.student_id ?? null;

    const { rows } = await pool.query(
      `INSERT INTO tuition_invoices (university_id, student_id, student_ref, amount, currency, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [universityId, studentId, student_ref.trim(), amount, currency, description ?? null]
    );
    const invoice = rows[0];

    await audit({
      actor: "university",
      action: "invoice.created",
      entity: "tuition_invoices",
      entityId: invoice.id,
      meta: { universityId, studentRef: student_ref, amount, currency },
    });

    let paymentDetails: any = null;
    if (autoGeneratePayment) {
      paymentDetails = await payments.createUniversityPayment(invoice.id);
    } else if (studentId) {
      // Notify student that a new invoice has been issued
      await createNotification({
        recipientType: "student",
        recipientId: studentId,
        title: "New Tuition Invoice Issued",
        message: `${university.name} has issued a tuition invoice of ${amount} ${currency} (Student Ref: ${student_ref}).`,
        type: "invoice_issued",
        data: {
          invoiceId: invoice.id,
          universityId,
          universityName: university.name,
          studentRef: student_ref,
          amount: Number(amount),
          currency,
        },
      });
    }

    res.status(201).json({
      invoice,
      payment: paymentDetails,
    });
  })
);

// View notifications for this university
universityRouter.get(
  "/:universityId/notifications",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const notifications = await getNotifications("university", req.params.universityId, limit);
    const unreadCount = await getUnreadNotificationCount("university", req.params.universityId);
    res.json({ unreadCount, notifications });
  })
);

// Mark university notification as read
universityRouter.post(
  "/:universityId/notifications/:notificationId/read",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const updated = await markNotificationRead(req.params.notificationId, req.params.universityId);
    if (!updated) throw new HttpError(404, "Notification not found");
    res.json(updated);
  })
);

// -------------------------------------------------------------
// Lightning & Payment Endpoints
// -------------------------------------------------------------

// Create the real Lightning invoice for a tuition payment. The university
// distributes the returned payment_code + QR to the student, who scans/copies
// it to pay. Transaction confirms only when the bolt11 settles on the node.
universityRouter.post(
  "/:universityId/invoices/:invoiceId/create-payment",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    // scope check: the invoice must belong to this university
    const { rows } = await pool.query(
      `SELECT 1 FROM tuition_invoices WHERE id = $1 AND university_id = $2`,
      [req.params.invoiceId, req.params.universityId]
    );
    if (!rows[0]) throw new HttpError(404, "Invoice not found in this university");
    const result = await payments.createUniversityPayment(req.params.invoiceId);
    res.status(201).json(result);
  })
);

// Check the Lightning node's balance (platform ops view).
universityRouter.get(
  "/:universityId/balance",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    res.json(await payments.getNodeBalance());
  })
);

// Per-university private ledger: received / settled / pending in local currency.
universityRouter.get(
  "/:universityId/ledger",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    res.json({ universityId: req.params.universityId, ...(await payments.getUniversityLedger(req.params.universityId)) });
  })
);

// Look up a payment by its short payment_code — scoped to this university.
universityRouter.get(
  "/:universityId/payments/by-code/:code",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const result = await payments.getPaymentByCodeScope(req.params.code, req.params.universityId);
    res.json(result);
  })
);

// View incoming payments (real-time updates by polling)
// Each row also carries its linked settlement record (if any).
universityRouter.get(
  "/:universityId/payments",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { rows } = await pool.query(
      `SELECT p.id, p.tx_reference, p.from_currency, p.to_currency, p.from_amount,
              p.btc_amount, p.status, p.settled_at, p.created_at,
              ti.student_ref, ti.amount AS invoice_amount, ti.currency AS invoice_currency,
              ti.id AS invoice_id, ti.student_id,
              s.id AS settlement_id, s.amount AS settlement_amount,
              s.currency AS settlement_currency, s.status AS settlement_status
       FROM payments p
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
       LEFT JOIN settlements s ON s.payment_id = p.id
       WHERE ti.university_id = $1
       ORDER BY p.created_at DESC`,
      [req.params.universityId]
    );
    res.json(rows);
  })
);

// See fiat/BTC conversion for a given payment
universityRouter.get(
  "/:universityId/payments/:paymentId/conversion",
   asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    await assertPaymentInUniversity(req.params.paymentId, req.params.universityId);
    const { rows } = await pool.query(
      `SELECT p.btc_amount, p.from_amount, p.from_currency, p.to_currency,
              q.btc_rate, q.fx_usd_rate
       FROM payments p
       JOIN fx_quotes q ON q.id = p.quote_id
       WHERE p.id = $1`,
      [req.params.paymentId]
    );
    if (!rows[0]) throw new HttpError(404, "Payment not found");
    res.json(rows[0]);
  })
);

// Track settlement status
universityRouter.get(
  "/:universityId/settlements",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    const { rows } = await pool.query(
      `SELECT s.id, s.amount, s.currency, s.status, s.settled_at,
              p.tx_reference, ti.student_ref
       FROM settlements s
       JOIN payments p ON p.id = s.payment_id
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
       WHERE s.university_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.universityId]
    );
    res.json(rows);
  })
);

// Generate payment receipt for a payment (complete incl. settlement + invoice)
universityRouter.get(
  "/:universityId/payments/:paymentId/receipt",
  asyncHandler(async (req, res) => {
    guardUniversity(req, req.params.universityId);
    await assertPaymentInUniversity(req.params.paymentId, req.params.universityId);
    const receipt = await getReceipt(req.params.paymentId);
    if (!receipt) throw new HttpError(404, "Payment not found");
    res.json(receipt);
  })
);
