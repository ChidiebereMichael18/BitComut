import { pool } from "../db/pool";

export interface AuditEntry {
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,$5)`,
    [entry.actor, entry.action, entry.entity, entry.entityId ?? null, JSON.stringify(entry.meta ?? {})]
  );
}
