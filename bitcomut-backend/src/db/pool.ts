import { Pool } from "pg";
import { config } from "../config";

export const pool = new Pool({
  host: config.PGHOST,
  port: config.PGPORT,
  user: config.PGUSER,
  password: config.PGPASSWORD,
  database: config.PGDATABASE,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function connectDb(): Promise<void> {
  await pool.query("SELECT 1");
  console.log("[db] PostgreSQL connected");
}
