-- 002_jobs.sql
-- Internal job/state tables for the settlement + withdrawal workers (simulated
-- payout provider). These drive state transitions off the database so they
-- survive server restarts, instead of in-memory setTimeout hacks.

CREATE TABLE IF NOT EXISTS settlement_jobs (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,  -- denormalized for worker scoping
  provider_ref TEXT,
  state TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (state IN ('scheduled','processing','settled','failed')),
  run_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_jobs_due
  ON settlement_jobs(state, run_at);

CREATE TABLE IF NOT EXISTS withdrawal_jobs (
  id TEXT PRIMARY KEY,
  withdrawal_id TEXT NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  provider_ref TEXT,
  state TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (state IN ('scheduled','processing','completed','failed')),
  run_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawal_jobs_due
  ON withdrawal_jobs(state, run_at);
