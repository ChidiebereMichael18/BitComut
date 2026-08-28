import { pool } from '../../config/db';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: string;
  created_at: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: Date;
  expires_at: Date;
}

function mapUser(r: UserRow): User {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    email: r.email,
    displayName: r.display_name,
    role: r.role,
    createdAt: r.created_at?.toISOString?.() ?? new Date(r.created_at).toISOString(),
  };
}

export async function createUser(data: {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
}) {
  const res = await pool.query<UserRow>(
    `INSERT INTO users (id, tenant_id, email, password_hash, display_name, role)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [data.id, data.tenantId, data.email, data.passwordHash, data.displayName, data.role],
  );
  return mapUser(res.rows[0]);
}

export async function findUserWithPassword(email: string) {
  const res = await pool.query<UserRow>('SELECT * FROM users WHERE email=$1', [email]);
  return res.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const res = await pool.query<UserRow>('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0] ? mapUser(res.rows[0]) : null;
}

export async function createSession(data: {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  await pool.query(
    `INSERT INTO sessions (id, user_id, token, expires_at)
     VALUES ($1,$2,$3,$4)`,
    [data.id, data.userId, data.token, data.expiresAt],
  );
}

/** Resolve a session token to its user + tenant, checking expiry. */
export async function findSession(token: string) {
  const res = await pool.query<SessionRow>(
    `SELECT s.id, s.user_id, s.expires_at, u.tenant_id, u.email, u.display_name, u.role, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token=$1
       AND s.expires_at > now()`,
    [token],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    sessionId: row.id,
    user: {
      id: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      createdAt: new Date(row.created_at).toISOString(),
    } satisfies User,
  };
}

export async function deleteSession(token: string) {
  await pool.query('DELETE FROM sessions WHERE token=$1', [token]);
}