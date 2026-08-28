-- 001_init.sql
-- Bitcomut core schema (multi-tenant, tenant_id scoped everywhere)
-- Source of truth for the domain model. Frontend is authoritative for shapes.

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT NOT NULL,
  currency TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  settlement_currency TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  country TEXT NOT NULL,
  campus_name TEXT NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  established TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logo_color TEXT NOT NULL
);

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  program TEXT NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active','Inactive','Graduated')),
  created_at TIMESTAMPTZ,
  UNIQUE (tenant_id, id)
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,                      -- INV-YYYY-XXXX (server-assigned)
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id),
  type TEXT NOT NULL CHECK (type IN ('Tuition','Registration','Application Fee','Examination Fee','Accommodation','Library Fee')),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Unpaid','Partially Paid','Paid','Overdue','Cancelled')),
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,               -- lnbc_<ref>, from LNbits payment hash/bolt11
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  btc_sats BIGINT NOT NULL,
  exchange_rate NUMERIC(20,0) NOT NULL,  -- local currency per 1 BTC, snapshotted at capture
  method TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid','Pending','Processing','Failed','Refunded','Settlement Pending','Settled')),
  date TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  settlement_date TIMESTAMPTZ,
  lnbits_payment_hash TEXT,              -- for webhook/status reconciliation
  lnbits_wallet_id TEXT
);

CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,               -- SET-YYYY-NNN
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  btc_sats BIGINT NOT NULL,
  local_amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate NUMERIC(20,0) NOT NULL,
  fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending','Processing','Settled','Failed')),
  date TIMESTAMPTZ NOT NULL
);

CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  payment_id TEXT NOT NULL REFERENCES payments(id),
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Issued','Void'))
);

CREATE TABLE payment_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank','mobile_money')),
  label TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  number TEXT NOT NULL,
  provider TEXT,
  currency TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE withdrawals (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,               -- SET-YYYY-NNN style
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_account_id TEXT NOT NULL REFERENCES payment_accounts(id),
  bank_account_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending','Processing','Completed','Failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE idempotency_keys (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

-- indexes for the list/search endpoints
CREATE INDEX idx_payments_tenant_status ON payments(tenant_id, status);
CREATE INDEX idx_payments_tenant_reference ON payments(tenant_id, reference);
CREATE INDEX idx_invoices_tenant_student ON invoices(tenant_id, student_id);
CREATE INDEX idx_students_tenant_name ON students(tenant_id, name);
CREATE INDEX idx_withdrawals_tenant_status ON withdrawals(tenant_id, status);
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_hash ON payments(lnbits_payment_hash);
CREATE INDEX idx_invoices_number ON invoices(tenant_id, number);
