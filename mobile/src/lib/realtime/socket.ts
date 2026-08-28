import { wsUrl } from "@/lib/api/client"
import type { PaymentEvent } from "@/lib/events"

export type RealtimeMessage =
  | PaymentEvent
  | { type: string; [key: string]: unknown }

interface SocketEntry {
  socket: WebSocket | null
  listeners: Set<(msg: RealtimeMessage) => void>
  refs: number
  timer?: ReturnType<typeof setTimeout>
}

const sockets = new Map<string, SocketEntry>()

export function subscribeToRealtime(
  slug: string,
  listener: (msg: RealtimeMessage) => void
): () => void {
  let entry = sockets.get(slug)
  if (!entry) {
    entry = { socket: null, listeners: new Set(), refs: 0 }
    sockets.set(slug, entry)
  }
  entry.listeners.add(listener)
  entry.refs += 1
  if (!entry.socket) openSocket(slug, entry)

  return () => {
    const cur = sockets.get(slug)
    if (!cur || cur !== entry) return
    cur.listeners.delete(listener)
    cur.refs -= 1
    if (cur.refs > 0) return
    if (cur.timer) clearTimeout(cur.timer)
    cur.socket?.close()
    sockets.delete(slug)
  }
}

function openSocket(slug: string, entry: SocketEntry): void {
  if (typeof WebSocket === "undefined") return
  let socket: WebSocket
  try {
    socket = new WebSocket(wsUrl(`/ws?tenantId=${encodeURIComponent(slug)}`))
  } catch {
    return
  }
  entry.socket = socket

  socket.onmessage = (e: MessageEvent) => {
    let msg: RealtimeMessage
    try {
      msg = JSON.parse(String(e.data)) as RealtimeMessage
    } catch {
      return
    }
    for (const l of entry.listeners) l(msg)
  }

  socket.onclose = () => {
    if (sockets.get(slug) !== entry) return
    entry.socket = null
    if (entry.refs <= 0) return
    entry.timer = setTimeout(() => {
      if (entry.refs > 0 && sockets.get(slug) === entry) {
        openSocket(slug, entry)
      }
    }, 3000)
  }
}
