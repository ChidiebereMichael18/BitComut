import { Router, Request } from "express";
import { pool } from "../db/pool";
import { paymentService } from "../services/payments";
import { audit } from "../services/audit";
import { getReceipt } from "../services/receipts";
import {
  createNotification,
  getNotifications,
  markNotificationRead,
  getUnreadNotificationCount,
} from "../services/notifications";
import { asyncHandler, HttpError } from "../middleware/handlers";
import { requireAuth, requireStudentAccess } from "../middleware/auth";
import { registerUser, signToken } from "../services/auth";

export const studentRouter = Router();

const validProfileFields = new Set([
  "name",
  "email",
  "phone",
  "country",
  "currency",
]);

function pluckProfile(body: any) {
  const out: Record<string, any> = {};
  for (const k of validProfileFields) {
    if (body && k in body && body[k] !== undefined) {
      out[k] = k === "email" ? String(body[k]).trim().toLowerCase() : body[k];
    }
  }
  return out;
}

// Verify that a payment belongs to a student (by owner_id) — used to bind the
// payment-action endpoints (quote/generate/confirm/receipt) to the caller.
async function assertStudentOwnsPayment(paymentId: string, studentId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT ti.student_id
       FROM payments p
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
      WHERE p.id = $1`,
    [paymentId]
  );
  if (!rows[0]) throw new HttpError(404, "Payment not found");
  if (rows[0].student_id !== studentId) {
    throw new HttpError(403, "You can only access your own payment");
  }
}

async function assertStudentOwnsInvoice(invoiceId: string, studentId: string): Promise<void> {
  const { rows } = await pool.query(`SELECT student_id FROM tuition_invoices WHERE id = $1`, [invoiceId]);
  if (!rows[0]) throw new HttpError(404, "Invoice not found");
  if (rows[0].student_id !== studentId) {
    throw new HttpError(403, "You can only access your own invoice");
  }
}

// Look up the authenticated student id from the token's owner.
function studentIdOf(req: Request): string {
  if (!req.user) throw new HttpError(401, "Authentication required");
  if (req.user.role !== "student" || !req.user.ownerId) {
    throw new HttpError(403, "A student token is required");
  }
  return req.user.ownerId;
}

// -------------------------------------------------------------
// Student Profile & University Network Enrollment
// -------------------------------------------------------------

// Register a new student profile
studentRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, country, currency = "NGN", profile_pic, password } = req.body;
    if (!name || !email || !country) {
      throw new HttpError(400, "name, email, and country are required");
    }

    const { rows } = await pool.query(
      `INSERT INTO students (name, email, phone, country, currency, profile_pic)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, phone = EXCLUDED.phone, country = EXCLUDED.country,
             currency = EXCLUDED.currency,
             profile_pic = COALESCE(EXCLUDED.profile_pic, students.profile_pic)
       RETURNING *`,
      [name, email.toLowerCase().trim(), phone ?? null, country, currency.toUpperCase(), profile_pic ?? null]
    );
    const student = rows[0];

    await audit({
      actor: "student",
      action: "student.registered",
      entity: "students",
      entityId: student.id,
      meta: { email: student.email, country: student.country },
    });

    let token: string | undefined;
    if (password) {
      const user = await registerUser({
        email: student.email,
        password,
        role: "student",
        ownerId: student.id,
      });
      token = signToken(user);
    }

    res.status(201).json(token ? { ...student, token } : student);
  })
);

// Everything below requires a valid student (or admin) token.
studentRouter.use(requireAuth);

// Get student profile
studentRouter.get(
  "/:id/profile",
  asyncHandler(async (req, res) => {
    requireStudentAccess(req, req.params.id);
    const { rows } = await pool.query(`SELECT * FROM students WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new HttpError(404, "Student not found");
    res.json(rows[0]);
  })
);

// Request enrollment / link with a university
studentRouter.post(
  "/enroll",
  asyncHandler(async (req, res) => {
    const { studentId, universityId, studentRef, department } = req.body;
    if (!studentId || !universityId || !studentRef) {
      throw new HttpError(400, "studentId, universityId, and studentRef are required");
    }
    requireStudentAccess(req, studentId);

    const stuRes = await pool.query(`SELECT * FROM students WHERE id = $1`, [studentId]);
    if (!stuRes.rows[0]) throw new HttpError(404, "Student not found");
    const student = stuRes.rows[0];

    const uniRes = await pool.query(`SELECT * FROM universities WHERE id = $1`, [universityId]);
    if (!uniRes.rows[0]) throw new HttpError(404, "University not found");
    const university = uniRes.rows[0];

    // Upsert / insert enrollment request
    const { rows } = await pool.query(
      `INSERT INTO student_enrollments (student_id, university_id, student_ref, department, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (university_id, student_ref) DO UPDATE
         SET student_id = EXCLUDED.student_id, department = EXCLUDED.department, status = 'pending', rejection_reason = NULL
       RETURNING *`,
      [studentId, universityId, studentRef.trim(), department ?? null]
    );
    const enrollment = rows[0];

    // Notify the university of the new pending enrollment
    await createNotification({
      recipientType: "university",
      recipientId: universityId,
      title: "New Student Connection Request",
      message: `${student.name} (Ref: ${studentRef}) has requested to connect to ${university.name}.`,
      type: "enrollment_request",
      data: {
        enrollmentId: enrollment.id,
        studentId,
        studentName: student.name,
        studentRef,
        department: department ?? null,
      },
    });

    await audit({
      actor: "student",
      action: "enrollment.requested",
      entity: "student_enrollments",
      entityId: enrollment.id,
      meta: { universityId, studentRef },
    });

    res.status(201).json({
      ...enrollment,
      university_name: university.name,
      university_country: university.country,
      university_currency: university.currency,
    });
  })
);

// View student's university connection requests and status
studentRouter.get(
  "/:id/enrollments",
  asyncHandler(async (req, res) => {
    requireStudentAccess(req, req.params.id);
    const { rows } = await pool.query(
      `SELECT se.*, u.name AS university_name, u.country AS university_country, u.currency AS university_currency
         FROM student_enrollments se
         JOIN universities u ON u.id = se.university_id
        WHERE se.student_id = $1
        ORDER BY se.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  })
);

// View student's in-app notifications
studentRouter.get(
  "/:id/notifications",
  asyncHandler(async (req, res) => {
    requireStudentAccess(req, req.params.id);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const notifications = await getNotifications("student", req.params.id, limit);
    const unreadCount = await getUnreadNotificationCount("student", req.params.id);
    res.json({ unreadCount, notifications });
  })
);

// Mark student notification as read
studentRouter.post(
  "/:id/notifications/:notificationId/read",
  asyncHandler(async (req, res) => {
    requireStudentAccess(req, req.params.id);
    const updated = await markNotificationRead(req.params.notificationId, req.params.id);
    if (!updated) throw new HttpError(404, "Notification not found");
    res.json(updated);
  })
);

// View all tuition invoices for a connected student
studentRouter.get(
  "/:id/invoices",
  asyncHandler(async (req, res) => {
    requireStudentAccess(req, req.params.id);
    const { rows } = await pool.query(
      `SELECT ti.id, ti.student_ref, ti.amount, ti.currency, ti.description, ti.status AS invoice_status,
              ti.created_at,
              u.id AS university_id, u.name AS university_name, u.country AS university_country,
              p.id AS payment_id, p.status AS payment_status, p.payment_code, p.qr,
              p.ln_payment_request AS bolt11, p.btc_amount, p.from_amount, p.from_currency,
              p.tx_reference
         FROM tuition_invoices ti
         JOIN universities u ON u.id = ti.university_id
         LEFT JOIN payments p ON p.invoice_id = ti.id
        WHERE ti.student_id = $1
           OR (ti.student_ref IN (
                SELECT student_ref FROM student_enrollments
                 WHERE student_id = $1 AND university_id = ti.university_id AND status = 'approved'
              ))
        ORDER BY ti.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  })
);

// -------------------------------------------------------------
// Legacy & Payment Rail Endpoints
// -------------------------------------------------------------

// 1. Select university (list universities)
studentRouter.get(
  "/universities",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT id, name, country, currency FROM universities WHERE is_verified = true`);
    res.json(rows);
  })
);

// 2. Select tuition invoice for a university
studentRouter.get(
  "/universities/:id/invoices",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, student_ref, amount, currency, description, status
       FROM tuition_invoices WHERE university_id = $1 AND status = 'unpaid'`,
      [req.params.id]
    );
    res.json(rows);
  })
);

// 2b. Pay using the university-issued payment code (student types/shares the
//     code or scans the university's QR). Returns the bolt11 + QR to scan.
//     Body: { code }  optional { universityId } to scope the lookup
studentRouter.post(
  "/payments/by-code",
  asyncHandler(async (req, res) => {
    const sid = studentIdOf(req);
    const { code, universityId } = req.body;
    if (!code) throw new HttpError(400, "code required");
    const result = await paymentService.getPaymentByCode(code, universityId);
    await assertStudentOwnsPayment(result.payment_id, sid);
    await audit({ actor: "student", action: "payment.code_used", entity: "payments", entityId: result.payment_id, meta: { code } });
    res.json(result);
  })
);

// 3. View exchange rate & get a LOCKED quote for a tuition invoice
//    Body: { invoiceId, fromCurrency }  (student's payment currency)
studentRouter.post(
  "/payments/quote",
  asyncHandler(async (req, res) => {
    const sid = studentIdOf(req);
    const { invoiceId, fromCurrency } = req.body;
    if (!invoiceId || !fromCurrency) throw new HttpError(400, "invoiceId and fromCurrency required");
    await assertStudentOwnsInvoice(invoiceId, sid);
    const result = await paymentService.quoteInvoice(invoiceId, fromCurrency);
    res.json(result);
  })
);

// 4. Generate Lightning payment against a locked quote
//    Body: { invoiceId, quoteId }
studentRouter.post(
  "/payments/generate",
  asyncHandler(async (req, res) => {
    const sid = studentIdOf(req);
    const { invoiceId, quoteId } = req.body;
    if (!invoiceId || !quoteId) throw new HttpError(400, "invoiceId and quoteId required");
    await assertStudentOwnsInvoice(invoiceId, sid);
    const result = await paymentService.generatePayment(invoiceId, quoteId);
    res.status(201).json(result);
  })
);

// 5. Complete payment (student states the Lightning payment was made)
//    For the demo with the simulated rail, this confirms + settles.
//    Body: { paymentId }
studentRouter.post(
  "/payments/confirm",
  asyncHandler(async (req, res) => {
    const sid = studentIdOf(req);
    const { paymentId } = req.body;
    if (!paymentId) throw new HttpError(400, "paymentId required");
    await assertStudentOwnsPayment(paymentId, sid);
    const result = await paymentService.simulatePaid(paymentId);
    await audit({ actor: "student", action: "payment.confirm", entity: "payments", entityId: paymentId });
    res.json(result);
  })
);

// 6. Receive confirmation / receipt (complete record incl. settlement + invoice)
studentRouter.get(
  "/payments/:id/receipt",
  asyncHandler(async (req, res) => {
    const sid = studentIdOf(req);
    await assertStudentOwnsPayment(req.params.id, sid);
    const receipt = await getReceipt(req.params.id);
    if (!receipt) throw new HttpError(404, "Payment not found");
    res.json(receipt);
  })
);
