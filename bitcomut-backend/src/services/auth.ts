import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool";
import { config } from "../config";
import { HttpError } from "../middleware/handlers";

export type Role = "student" | "university" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  ownerId: string | null;
}

export interface TokenPayload {
  sub: string; // users.id
  role: Role;
  ownerId: string | null;
}

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS, (err, derived) => {
      if (err) return reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS, (err, derived) => {
      if (err) return reject(err);
      const a = Buffer.from(hash, "hex");
      const b = derived;
      resolve(a.length === b.length && crypto.timingSafeEqual(a, b));
    });
  });
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = { sub: user.id, role: user.role, ownerId: user.ownerId };
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    if (!decoded || !decoded.sub) throw new Error("invalid token");
    return { sub: decoded.sub, role: decoded.role, ownerId: decoded.ownerId ?? null };
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const res = await pool.query("SELECT id, email, role, owner_id FROM users WHERE id = $1", [id]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return { id: r.id, email: r.email, role: r.role as Role, ownerId: r.owner_id };
}

export async function findUserByEmail(email: string): Promise<
  (AuthUser & { password_hash: string }) | null
> {
  const res = await pool.query("SELECT id, email, role, owner_id, password_hash FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return { id: r.id, email: r.email, role: r.role as Role, ownerId: r.owner_id, password_hash: r.password_hash };
}

export interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  ownerId?: string | null;
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || password.length < 8) {
    throw new HttpError(400, "Valid email and password of at least 8 characters are required");
  }
  const existing = await findUserByEmail(email);
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const res = await pool.query(
    "INSERT INTO users (email, password_hash, role, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, email, role, owner_id",
    [email, passwordHash, input.role, input.ownerId ?? null]
  );
  const r = res.rows[0];
  return { id: r.id, email: r.email, role: r.role as Role, ownerId: r.owner_id };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const user = await findUserByEmail(email.toLowerCase().trim());
  if (!user) throw new HttpError(401, "Invalid email or password");
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new HttpError(401, "Invalid email or password");
  return { id: user.id, email: user.email, role: user.role, ownerId: user.ownerId };
}

export async function seedAdmin(): Promise<void> {
  const email = config.ADMIN_EMAIL.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    // Ensure the seeded admin stays an admin role (idempotent).
    return;
  }
  const passwordHash = await hashPassword(config.ADMIN_PASSWORD);
  await pool.query(
    "INSERT INTO users (email, password_hash, role, owner_id) VALUES ($1, $2, 'admin', NULL) ON CONFLICT (email) DO NOTHING",
    [email, passwordHash]
  );
  console.log(`[auth] Seeded admin account: ${email}`);
}
