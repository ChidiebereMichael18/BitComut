-- 006_student_auth.sql
-- Student accounts + sessions.
-- A student's existing record (created by the university) is linked to an
-- email + password so the student can log in and pay their own invoices.
-- Scoping is by (tenant_id, id) — the same student id may exist in several
-- universities, so email uniqueness is enforced per tenant.

ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS account_email TEXT;

CREATE TABLE IF NOT EXISTS student_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions(token);
CREATE INDEX IF NOT EXISTS idx_students_tenant_account_email ON students(tenant_id, account_email);
