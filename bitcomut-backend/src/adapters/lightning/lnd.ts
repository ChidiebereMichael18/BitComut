import fs from "fs";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { config } from "../../config";
import { LightningRail, PaymentRequest, GeneratedInvoice, PaymentStatus, NodeBalance } from "./types";

// Real LND gRPC adapter.
//
// Talks to a running LND daemon over gRPC using the official lightning.proto
// (self-contained — no imports). It authenticates with the node's tls.cert and
// admin.macaroon, exactly like lndconnect / lncli do.
//
// The rail is only selected when LND_TLS_CERT_PATH and LND_MACAROON_PATH are
// both set in .env (see currentRailKind in services/payments.ts), so leaving
// them blank keeps the app safely on the simulated rail.
const PROTO_PATH = path.resolve(__dirname, "../../../proto/lightning.proto");

// Load the lnrpc.lightning service definition from the bundled proto.
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lightning = (protoDescriptor as any).lnrpc.lightning;

function credentials(): grpc.ChannelCredentials {
  const cert = fs.readFileSync(config.LND_TLS_CERT_PATH);
  return grpc.credentials.createSsl(cert);
}

// LND expects the macaroon as a hex string on the 'macaroon' metadata key.
function macaroonMetadata(): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add("macaroon", fs.readFileSync(config.LND_MACAROON_PATH).toString("hex"));
  return metadata;
}

export class LndRail implements LightningRail {
  readonly kind = "lnd";

  private host: string;
  private client: any;

  constructor() {
    if (!config.LND_TLS_CERT_PATH || !config.LND_MACAROON_PATH) {
      throw new Error("LND_TLS_CERT_PATH / LND_MACAROON_PATH not configured");
    }
    this.host = config.LND_GRPC_HOST || "localhost:10009";
    this.client = new lightning(
      this.host,
      credentials(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any
    );
  }

  private request<TReq, TRes>(method: string): (req: TReq) => Promise<TRes> {
    return (req: TReq) =>
      new Promise<TRes>((resolve, reject) => {
        const meta = macaroonMetadata();
        this.client[method](req, meta, (err: Error | null, res: TRes) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
  }

  async createInvoice(req: PaymentRequest): Promise<GeneratedInvoice> {
    const addInvoice = this.request<any, any>("AddInvoice");
    const res = await addInvoice({ value: req.amountSat, memo: req.memo ?? "" });
    // r_hash is returned as a base64 string (with keepCase the field is r_hash).
    const hashB64 = res.r_hash ?? res.r_hash_str ?? "";
    const paymentHash = Buffer.from(hashB64, "base64").toString("hex");
    return {
      paymentRequest: res.payment_request,
      paymentHash,
      addIndex: res.add_index ? String(res.add_index) : undefined,
    };
  }

  async lookupInvoice(paymentHash: string): Promise<PaymentStatus> {
    const lookup = this.request<any, any>("LookupInvoice");
    const res = await lookup({ r_hash_str: paymentHash });
    return {
      settled: !!res.settled,
      amountSat: res.amt_paid_sat != null ? Number(res.amt_paid_sat) : null,
      preimage: res.r_preimage ? Buffer.from(res.r_preimage, "base64").toString("hex") : null,
    };
  }

  async getBalance(): Promise<NodeBalance> {
    const wallet = this.request<any, any>("WalletBalance");
    const channel = this.request<any, any>("ChannelBalance");
    const walletRes = await wallet({});
    let channelSat = 0;
    try {
      const channelRes = await channel({});
      channelSat = channelRes.balance != null ? Number(channelRes.balance) : 0;
    } catch {
      // channel balance is optional
    }
    const onChainSat = Number(walletRes.total_balance ?? walletRes.confirmed_balance ?? 0);
    return { totalSat: onChainSat + channelSat, onChainSat, channelSat };
  }

  close(): void {
    try {
      this.client.close();
    } catch {
      /* ignore */
    }
  }
}
