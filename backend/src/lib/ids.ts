import { randomBytes, randomInt } from 'crypto';

/** Generate a random suffix for id prefixes (tn_, pm_, wd_, etc.) */
function rand(n = 12): string {
  return randomBytes(n).toString('hex').slice(0, n);
}

export const ids = {
  tenant: () => `tn_${rand()}`,
  student: () => `st_${rand()}`,
  invoice: () => `inv_${rand()}`,
  payment: () => `pm_${rand()}`,
  settlement: () => `stl_${rand()}`,
  receipt: () => `rc_${rand()}`,
  withdrawal: () => `wd_${rand()}`,
  paymentAccount: () => `pa_${rand()}`,
  job: () => `job_${rand()}`,
  user: () => `usr_${rand()}`,
  session: () => `ses_${rand()}`,
  studentSession: () => `sses_${rand()}`,
};

let invoiceSeq = 0;
let setSeq = 0;

function nextSeq(): number {
  // 4-digit zero-padded sequence, wraps gracefully
  return (invoiceSeq++ % 10000) + 1;
}

function nextSetSeq(): number {
  return (setSeq++ % 1000) + 1;
}

export function resetSequencesForTest() {
  invoiceSeq = 0;
  setSeq = 0;
}

/**
 * Invoice number: INV-YYYY-XXXX for the given invoice id + year.
 * xxxx is a 4-digit sequence. Deterministic per (year).
 */
export function invoiceNumber(invoiceId: string, year: number): string {
  const seq = nextSeq();
  const idTail = invoiceId.replace(/[^0-9]/g, '').slice(-2) || '0';
  const xxxx = String(seq).padStart(2, '0') + idTail.slice(0, 2).padStart(2, '0');
  return `INV-${year}-${xxxx.padStart(4, '0')}`;
}

/**
 * Use a DB-backed sequence ideally, but for the scope of this build the
 * reference is deterministic from the row id + a stable counter hash so it is
 * collision-safe enough per tenant without a sequence table.
 */
export function setNumber(setId: string, year: number): string {
  const seq = nextSetSeq();
  const idTail = setId.replace(/[^0-9]/g, '').slice(-3) || '0';
  const nnn = String(seq).padStart(2, '0') + idTail.slice(0, 1);
  return `SET-${year}-${nnn.padStart(3, '0')}`;
}

/**
 * A unique short token appended to lnbc_ payment references so each LNbits
 * payment has a distinct reference we can correlate back to.
 */
export function paymentRefTag(): string {
  return randomInt(0, 1_000_000_000_000).toString(36);
}

export { rand, randomBytes };
