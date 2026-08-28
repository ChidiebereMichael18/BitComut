import { pool } from "../db/pool";

export interface CreateNotificationInput {
  recipientType: "student" | "university";
  recipientId: string;
  title: string;
  message: string;
  type:
    | "enrollment_request"
    | "enrollment_approved"
    | "enrollment_rejected"
    | "invoice_issued"
    | "payment_received"
    | "payment_settled";
  data?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<any> {
  const { rows } = await pool.query(
    `INSERT INTO notifications
       (recipient_type, recipient_id, title, message, type, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.recipientType,
      input.recipientId,
      input.title,
      input.message,
      input.type,
      JSON.stringify(input.data ?? {}),
    ]
  );
  return rows[0];
}

export async function getNotifications(
  recipientType: "student" | "university",
  recipientId: string,
  limit = 50
): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT * FROM notifications
      WHERE recipient_type = $1 AND recipient_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
    [recipientType, recipientId, limit]
  );
  return rows;
}

export async function markNotificationRead(
  notificationId: string,
  recipientId?: string
): Promise<any> {
  const whereRecipient = recipientId ? " AND recipient_id = $2" : "";
  const params = recipientId ? [notificationId, recipientId] : [notificationId];
  const { rows } = await pool.query(
    `UPDATE notifications
        SET is_read = true
      WHERE id = $1${whereRecipient}
      RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function getUnreadNotificationCount(
  recipientType: "student" | "university",
  recipientId: string
): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS unread_count
       FROM notifications
      WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = false`,
    [recipientType, recipientId]
  );
  return rows[0]?.unread_count ?? 0;
}
