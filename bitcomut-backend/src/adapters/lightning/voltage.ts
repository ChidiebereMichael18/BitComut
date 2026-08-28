import { config } from "../../config";
import { LightningRail, PaymentRequest, GeneratedInvoice, PaymentStatus, NodeBalance } from "./types";

// Voltage cloud LND adapter using plain REST over HTTPS.
//
// Voltage exposes the full LND REST API on each hosted node (port 8080),
// authenticated with the node's Admin macaroon sent as a hex-encoded
// `Grpc-Metadata-macaroon` header. This means the backend can talk to a
// real Lightning node directly from Windows — no WSL, no local node.
//
// The node's REST URL can be provided explicitly (VOLTAGE_LND_URL) or, as a
// convenience, auto-resolved from the Voltage infrastructure API using the
// VOLTAGE_INFRA_KEY (Node Details / Connect tile still shows it directly).
export class VoltageRail implements LightningRail {
  readonly kind = "voltage";

  private url: string | null = null;
  private macaroon: string;

  constructor() {
    if (!config.VOLTAGE_MACAROON) {
      throw new Error("VOLTAGE_MACAROON not configured");
    }
    this.macaroon = config.VOLTAGE_MACAROON;
    if (config.VOLTAGE_LND_URL) {
      this.url = config.VOLTAGE_LND_URL.replace(/\/+$/, "");
    }
  }

  // Resolve the node REST base URL on first use: explicit env is preferred,
  // otherwise try the Voltage infra API (best-effort) and cache the result.
  private async ensureUrl(): Promise<string> {
    if (this.url) return this.url;
    if (!config.VOLTAGE_INFRA_KEY) {
      throw new Error("VOLTAGE_LND_URL not configured");
    }
    const discovered = await discoverNodeRestUrl(config.VOLTAGE_INFRA_KEY);
    if (!discovered) throw new Error("Could not auto-discover Voltage node (set VOLTAGE_LND_URL)");
    this.url = discovered;
    return this.url;
  }

  private async headers(): Promise<Record<string, string>> {
    const url = await this.ensureUrl();
    void url;
    return {
      "Content-Type": "application/json",
      "Grpc-Metadata-macaroon": this.macaroon,
    };
  }

  async createInvoice(req: PaymentRequest): Promise<GeneratedInvoice> {
    const url = await this.ensureUrl();
    const res = await fetch(`${url}/v1/invoices`, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify({ value: req.amountSat, memo: req.memo ?? "" }),
    });
    if (!res.ok) {
      throw new Error(`Voltage createInvoice failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      payment_request: string;
      r_hash: string;
      add_index?: string;
    };
    return {
      paymentRequest: data.payment_request,
      paymentHash: toHex(bufferFromBase64(data.r_hash)),
      addIndex: data.add_index ? String(data.add_index) : undefined,
    };
  }

  async lookupInvoice(paymentHash: string): Promise<PaymentStatus> {
    const url = await this.ensureUrl();
    // LND REST lookupInvoice takes the base64-encoded r_hash.
    const b64 = bufferToBase64(hexToBuffer(paymentHash));
    const res = await fetch(`${url}/v1/invoice/${b64}`, {
      method: "GET",
      headers: await this.headers(),
    });
    if (!res.ok) {
      throw new Error(`Voltage lookupInvoice failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { settled: boolean; amt_paid_sat?: string };
    return { settled: data.settled, amountSat: data.amt_paid_sat ? Number(data.amt_paid_sat) : null };
  }

  async getBalance(): Promise<NodeBalance> {
    const url = await this.ensureUrl();
    // LND REST: wallet balance (on-chain) + channel balance.
    const walletRes = await fetch(`${url}/v1/balance/wallet`, { method: "GET", headers: await this.headers() });
    if (!walletRes.ok) throw new Error(`Voltage wallet balance failed: ${walletRes.status} ${await walletRes.text()}`);
    const wallet = (await walletRes.json()) as { total_balance: string; confirmed_balance: string };

    let channelSat = 0;
    try {
      const chRes = await fetch(`${url}/v1/balance/channels`, { method: "GET", headers: await this.headers() });
      if (chRes.ok) {
        const ch = (await chRes.json()) as { balance?: string };
        channelSat = ch.balance ? Number(ch.balance) : 0;
      }
    } catch {
      // channel balance is optional — ignore if unavailable
    }

    const onChainSat = Number(wallet.total_balance ?? wallet.confirmed_balance ?? 0);
    return { totalSat: onChainSat + channelSat, onChainSat, channelSat };
  }
}

// ---------------------------------------------------------------------------
// Best-effort auto-discovery of the node REST URL from the Voltage API.
// Returns e.g. "https://myvoltagenode.m.voltageapp.io:8080" or null.
// ---------------------------------------------------------------------------
async function discoverNodeRestUrl(infraKey: string): Promise<string | null> {
  const hosts = ["https://api.voltage.cloud", "https://api.voltage.io", "https://api.voltageapp.io"];
  const auth = { "X-VOLTAGE-AUTH": infraKey, Accept: "application/json", "Content-Type": "application/json" };

  for (const host of hosts) {
    try {
      const orgRes = await fetch(`${host}/organizations`, { headers: auth });
      if (!orgRes.ok) continue;
      const orgData = (await orgRes.json()) as { organizations?: { id?: string }[] };
      const orgs = orgData.organizations ?? orgData as unknown as { id?: string }[];
      const orgList = Array.isArray(orgs) ? orgs : [];
      for (const org of orgList) {
        if (!org?.id) continue;
        const nodeRes = await fetch(`${host}/organizations/${org.id}/nodes`, { headers: auth });
        if (!nodeRes.ok) continue;
        const nodeData = (await nodeRes.json()) as { nodes?: { api_endpoint?: string; status?: string }[] };
        const nodes = nodeData.nodes ?? [];
        const node = nodes.find((n) => n.status === "running") ?? nodes[0];
        if (node?.api_endpoint) {
          return `https://${node.api_endpoint.replace(/\.$/, "")}:8080`;
        }
      }
    } catch {
      // try next host
    }
  }
  return null;
}

// --- small base64/hex helpers ---------------------------------
function bufferFromBase64(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}
function toHex(buf: Buffer): string {
  return buf.toString("hex");
}
function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}
function bufferToBase64(buf: Buffer): string {
  return buf.toString("base64");
}
