import { pool } from '../../config/db';
import type { Student } from '../types';

interface StudentAuthRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  program: string;
  year: string;
  status: string;
  created_at: Date | null;
  password_hash: string | null;
  account_email: string | null;
}

function mapStudent(r: StudentAuthRow): Student & { hasAccount: boolean } {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.account_email ?? r.email,
    phone: r.phone,
    program: r.program,
    year: r.year,
    status: r.status as Student['status'],
    createdAt: r.created_at ? r.created_at.toISOString() : null,
    hasAccount: Boolean(r.password_hash),
  };
}

/** Fetch a student by (tenant,id) including its auth columns (or null). */
export async function getStudentForAuth(
  tenantId: string,
  studentId: string,
): Promise<Student & { hasAccount: boolean } | null> {
  const res = await pool.query<StudentAuthRow>(
    `SELECT * FROM students WHERE tenant_id=$1 AND id=$2`,
    [tenantId, studentId],
  );
  return res.rows[0] ? mapStudent(res.rows[0]) : null;
}

/** Fetch a student by (tenant, accountEmail) — used for login. */
export async function getStudentByAccountEmail(
  tenantId: string,
  accountEmail: string,
): Promise<Student & { hasAccount: boolean } | null> {
  const res = await pool.query<StudentAuthRow>(
    `SELECT * FROM students WHERE tenant_id=$1 AND account_email=$2`,
    [tenantId, accountEmail],
  );
  return res.rows[0] ? mapStudent(res.rows[0]) : null;
}

/** Check if any student in the tenant already uses this account email. */
export async function accountEmailTaken(
  tenantId: string,
  accountEmail: string,
): Promise<boolean> {
  const res = await pool.query<{ c: string }>(
    `SELECT COUNT(*) c FROM students WHERE tenant_id=$1 AND account_email=$2`,
    [tenantId, accountEmail],
  );
  return Number(res.rows[0].c) > 0;
}

/** Link a student record to an email + password hash (idempotent set). */
export async function setStudentCredentials(data: {
  tenantId: string;
  studentId: string;
  accountEmail: string;
  passwordHash: string;
}): Promise<void> {
  await pool.query(
    `UPDATE students
     SET account_email=$3, password_hash=$4
     WHERE tenant_id=$1 AND id=$2`,
    [data.tenantId, data.studentId, data.accountEmail, data.passwordHash],
  );
}

/** Fetch the raw password hash for a student (login verification). */
export async function getStudentCredentials(
  tenantId: string,
  studentId: string,
): Promise<{ password_hash: string | null } | null> {
  const res = await pool.query<{ password_hash: string | null }>(
    `SELECT password_hash FROM students WHERE tenant_id=$1 AND id=$2`,
    [tenantId, studentId],
  );
  return res.rows[0] ?? null;
}

export async function createStudentSession(data: {
  id: string;
  studentId: string;
  tenantId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  await pool.query(
    `INSERT INTO student_sessions (id, student_id, tenant_id, token, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [data.id, data.studentId, data.tenantId, data.token, data.expiresAt],
  );
}

interface StudentSessionRow {
  session_id: string;
  student_id: string;
  tenant_id: string;
  name: string;
  account_email: string;
  program: string;
  year: string;
  status: string;
  created_at: Date | null;
  expires_at: Date;
}

/**
 * Resolve a student session token to the student + tenant, checking expiry.
 * Returns the password_hash too so routes can scope to the correct student.
 */
export async function findStudentSession(token: string) {
  const res = await pool.query<StudentSessionRow>(
    `SELECT ss.id AS session_id, ss.student_id, ss.tenant_id, ss.expires_at,
            s.name, s.account_email, s.program, s.year, s.status, s.created_at
     FROM student_sessions ss
     JOIN students s ON s.id = ss.student_id AND s.tenant_id = ss.tenant_id
     WHERE ss.token=$1 AND ss.expires_at > now()`,
    [token],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    sessionId: row.session_id,
    token,
    studentId: row.student_id,
    tenantId: row.tenant_id,
    student: {
      id: row.student_id,
      tenantId: row.tenant_id,
      name: row.name,
      email: row.account_email ?? row.student_id,
      program: row.program,
      year: row.year,
      status: row.status,
      createdAt: row.created_at ? row.created_at.toISOString() : null,
    } as Student,
  };
}

export async function deleteStudentSession(token: string): Promise<void> {
  await pool.query('DELETE FROM student_sessions WHERE token=$1', [token]);
}
