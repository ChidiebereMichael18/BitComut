import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { bus, type BusPayload } from '../lib/realtime/bus';
import { pool } from '../config/db';
import { logger } from '../config/logger';

interface ClientConn {
  ws: WebSocket;
  tenantId: string | null;
}

/**
 * Resolve a tenant reference to its real backend id. Accepts either a tenant
 * id (`tn_...`) or a tenant slug (`kigali-international-university`); the
 * frontend only knows slugs, so this keeps WS auth free of an extra lookup.
 */
async function resolveTenant(value: string): Promise<string | null> {
  if (!value) return null;
  const q = await pool.query<{ id: string }>(
    'SELECT id FROM tenants WHERE id=$1 OR slug=$1',
    [value],
  );
  return q.rows[0]?.id ?? null;
}

/**
 * WebSocket realtime server.
 *
 * One WS connection per tenant (clients pass `?tenantId=` on connect, or send a
 * `{ type: 'subscribe', tenantId }` message). The server subscribes to the
 * realtime bus (which only emits on real DB state transitions) and fans events
 * out to the matching tenant room.
 */
export class RealtimeServer {
  private wss: WebSocketServer;
  private clients = new Set<ClientConn>();
  private unsubscribe: () => void;

  constructor(server: Server, opts: { path?: string } = {}) {
    const path = opts.path ?? '/ws';
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url ?? '', 'http://localhost');
      const tenantParam = url.searchParams.get('tenantId');
      const conn: ClientConn = { ws, tenantId: null };
      this.clients.add(conn);
      void resolveTenant(tenantParam ?? '').then((id) => {
        if (id) conn.tenantId = id;
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg?.type === 'subscribe' && typeof msg.tenantId === 'string') {
            void resolveTenant(msg.tenantId).then((id) => {
              if (id) conn.tenantId = id;
            });
          }
        } catch {
          /* ignore malformed */
        }
      });

      ws.on('close', () => {
        this.clients.delete(conn);
      });
    });

    this.unsubscribe = bus.subscribe((payload: BusPayload) => {
      this.dispatch(payload);
    });
  }

  private dispatch(payload: BusPayload) {
    const out = this.toClientMessage(payload);
    for (const conn of this.clients) {
      if (!conn.tenantId) continue;
      if (conn.tenantId !== payload.tenantId) continue;
      if (conn.ws.readyState === 1) {
        conn.ws.send(JSON.stringify(out));
      }
    }
  }

  private toClientMessage(payload: BusPayload): unknown {
    switch (payload.kind) {
      case 'payment':
        return payload.data; // { type: 'payment.confirmed', ... }
      case 'withdrawal':
        return {
          type: 'withdrawal.status_changed',
          id: payload.data.id,
          reference: payload.data.reference,
          status: payload.data.status,
          updatedAt: payload.data.updatedAt,
        };
      case 'settlement':
        return {
          type: 'settlement.status_changed',
          id: payload.data.id,
          reference: payload.data.reference,
          status: payload.data.status,
          tenantId: payload.data.tenantId,
          paymentId: payload.data.paymentId,
          updatedAt: payload.data.updatedAt,
        };
    }
  }

  close(): void {
    this.unsubscribe();
    for (const conn of this.clients) conn.ws.close();
    this.wss.close();
    logger.info('Realtime server closed');
  }
}
