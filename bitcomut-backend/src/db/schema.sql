-- ============================================================
--  BitPulse schema
--  Bitcoin-powered cross-border education payments
--  Corridor MVP: NGN (Nigeria) -> RWF (Rwanda)
-- ============================================================

CREATE TABLE IF NOT EXISTS universities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  country       TEXT NOT NULL,
  currency      TEXT NOT NULL,          -- local currency code, e.g. RWF
  swift_code    TEXT,
  account_ref   TEXT,                   -- local settlement account reference
  profile_pic   TEXT,                   -- served URL/path or raw URL of the university logo/photo
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered student profiles
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  country       TEXT NOT NULL,          -- e.g. Nigeria, NG
  currency      TEXT NOT NULL DEFAULT 'NGN', -- student's payment currency
  profile_pic   TEXT,                   -- served URL/path or raw URL of the student's photo
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auth accounts (login) for students, universities and admins.
-- A user links to its owner row (owner_id) for students/universities, or is a
-- standalone admin when role = 'admin'.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- scrypt hash
  role          TEXT NOT NULL,          -- 'student' | 'university' | 'admin'
  owner_id      UUID,                   -- students.id or universities.id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In case the table already exists in an existing DB:
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Student-University network links / enrollment applications
CREATE TABLE IF NOT EXISTS student_enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id     UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  student_ref       TEXT NOT NULL,      -- student matriculation / ID number
  department        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  rejection_reason  TEXT,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_uni_student_ref UNIQUE (university_id, student_ref)
);

CREATE TABLE IF NOT EXISTS tuition_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id),
  student_id    UUID REFERENCES students(id), -- linked registered student
  student_ref   TEXT NOT NULL,          -- internal student identifier
  amount        NUMERIC(20,8) NOT NULL, -- amount in university local currency
  currency      TEXT NOT NULL,          -- e.g. RWF
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid | paid | settled
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In case tuition_invoices table already exists in existing DBs:
ALTER TABLE tuition_invoices ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id);

-- In case the tables exist in existing DBs, add the profile picture columns:
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_pic TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS profile_pic TEXT;

-- University login email (needed for authentication).
ALTER TABLE universities ADD COLUMN IF NOT EXISTS email TEXT;

-- In case the users table already exists in an existing DB, make sure it has all columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_owner ON users(role, owner_id) WHERE owner_id IS NOT NULL;

-- A locked exchange-rate quote generated when the payment invoice is created.
CREATE TABLE IF NOT EXISTS fx_quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES tuition_invoices(id),
  from_currency TEXT NOT NULL,          -- e.g. NGN (student's currency)
  to_currency   TEXT NOT NULL,          -- e.g. RWF
  btc_rate      NUMERIC(20,8) NOT NULL, -- BTC per unit of from_currency
  fx_usd_rate   NUMERIC(20,8) NOT NULL, -- inferred / reference rate
  from_amount   NUMERIC(20,8) NOT NULL,
  btc_amount    NUMERIC(20,8) NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,   -- quote locked for a short window
  status        TEXT NOT NULL DEFAULT 'active',  -- active | expired | used
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A payment transaction along the rail.
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES tuition_invoices(id),
  quote_id      UUID NOT NULL REFERENCES fx_quotes(id),
  from_currency TEXT NOT NULL,
  to_currency   TEXT NOT NULL,
  from_amount   NUMERIC(20,8) NOT NULL,  -- amount student paid in local currency
  btc_amount    NUMERIC(20,8) NOT NULL,  -- BTC sent over Lightning
  payment_method TEXT NOT NULL DEFAULT 'lightning',  -- card | mobile_money | lightning
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | failed | settled
  ln_payment_hash TEXT,
  ln_payment_request TEXT,
  payment_code   TEXT,                    -- short human code student can type
  qr             TEXT,                    -- QR payload/data for scanning (the bolt11)
  tx_reference  TEXT,                    -- human/audit reference
  settled_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Local-currency settlement record delivered to the university.
CREATE TABLE IF NOT EXISTS settlements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID NOT NULL REFERENCES payments(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  amount        NUMERIC(20,8) NOT NULL,  -- in university local currency
  currency      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | completed
  settled_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable audit trail for reconciliation / accounting.
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         TEXT NOT NULL,          -- e.g. student, admin, system
  action        TEXT NOT NULL,
  entity        TEXT NOT NULL,
  entity_id     UUID,
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In-app notifications for students and universities.
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type  TEXT NOT NULL,          -- 'student' | 'university'
  recipient_id    UUID NOT NULL,          -- student_id or university_id
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT NOT NULL,          -- 'enrollment_request', 'enrollment_approved', 'enrollment_rejected', 'invoice_issued', 'payment_received', 'payment_settled'
  data            JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fx_quotes_invoice ON fx_quotes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payment ON settlements(payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_uni ON student_enrollments(university_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_tuition_invoices_student ON tuition_invoices(student_id);
