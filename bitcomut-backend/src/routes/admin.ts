import { Router } from "express";
import { pool } from "../db/pool";
import { audit } from "../services/audit";
import { currentFiatPerBtc, listSupportedCurrencies } from "../services/fx";
import { getRailStatus } from "../services/payments";
import { asyncHandler, HttpError } from "../middleware/handlers";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

// Every admin route requires a valid admin token.
adminRouter.use(requireAuth, requireRole("admin"));

// --- manage universities ---
adminRouter.get(
  "/universities",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM universities ORDER BY created_at DESC`);
    res.json(rows);
  })
);

adminRouter.post(
  "/universities",
  asyncHandler(async (req, res) => {
    const { name, country, currency, swift_code, account_ref, profile_pic } = req.body;
    if (!name || !country || !currency) throw new HttpError(400, "name, country, currency required");
    const { rows } = await pool.query(
      `INSERT INTO universities (name, country, currency, swift_code, account_ref, profile_pic, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
      [name, country, currency, swift_code ?? null, account_ref ?? null, profile_pic ?? null]
    );
    await audit({ actor: "admin", action: "university.created", entity: "universities", entityId: rows[0].id });
    res.status(201).json(rows[0]);
  })
);

adminRouter.post(
  "/universities/:id/invoices",
  asyncHandler(async (req, res) => {
    const { student_ref, amount, currency, description } = req.body;
    if (!student_ref || !amount || !currency) throw new HttpError(400, "student_ref, amount, currency required");
    const { rows } = await pool.query(
      `INSERT INTO tuition_invoices (university_id, student_ref, amount, currency, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, student_ref, amount, currency, description ?? null]
    );
    await audit({ actor: "admin", action: "invoice.created", entity: "tuition_invoices", entityId: rows[0].id });
    res.status(201).json(rows[0]);
  })
);

// --- monitor transactions ---
adminRouter.get(
  "/transactions",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT p.id, p.tx_reference, p.from_currency, p.to_currency, p.from_amount,
              p.btc_amount, p.status, p.settled_at, p.created_at,
              u.name AS university_name, ti.student_ref
       FROM payments p
       JOIN tuition_invoices ti ON ti.id = p.invoice_id
       JOIN universities u ON u.id = ti.university_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  })
);

// --- monitor exchange rates ---
adminRouter.get(
  "/rates",
  asyncHandler(async (req, res) => {
    const { currency } = req.query;
    const code = (req.query.currency as string) ?? "USD";
    const fiatPerBtc = await currentFiatPerBtc(code.toUpperCase());
    res.json({ currency: code.toUpperCase(), fiatPerBtc, btcPerUnit: 1 / fiatPerBtc });
  })
);

// --- lightning rail / node connection status ---
adminRouter.get(
  "/rail",
  asyncHandler(async (_req, res) => {
    res.json(await getRailStatus());
  })
);

// --- list every African currency the platform supports ---
adminRouter.get(
  "/currencies",
  asyncHandler(async (_req, res) => {
    res.json({
      count: listSupportedCurrencies().length,
      currencies: listSupportedCurrencies(),
      btcUsd: await currentFiatPerBtc("USD"),
    });
  })
);

// --- view audit logs ---
adminRouter.get(
  "/audit",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json(rows);
  })
);
