import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default("development"),

  PGHOST: z.string().default("localhost"),
  PGPORT: z.coerce.number().default(5432),
  PGUSER: z.string().default("bitpulse"),
  PGPASSWORD: z.string().default("CHANGE_ME"),
  PGDATABASE: z.string().default("bitpulse"),

  FX_PROVIDER_ID: z.string().optional().default("coingecko"),
  FX_API_KEY: z.string().optional().default(""),

  LND_GRPC_HOST: z.string().default("localhost:10009"),
  LND_TLS_CERT_PATH: z.string().default(""),
  LND_MACAROON_PATH: z.string().default(""),
  LND_NETWORK: z.enum(["regtest", "testnet", "mainnet"]).default("regtest"),

  // Voltage cloud LND (hosted node over REST — no WSL needed).
  VOLTAGE_LND_URL: z.string().optional().default(""),
  VOLTAGE_MACAROON: z.string().optional().default(""),
  VOLTAGE_INFRA_KEY: z.string().optional().default(""),
  VOLTAGE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  CORRIDOR_FROM: z.string().default("CURRENCY_NGN"),
  CORRIDOR_TO: z.string().default("CURRENCY_RWF"),

  SETTLEMENT_MODE: z.enum(["simulated", "real"]).default("simulated"),

  UPLOAD_DIR: z.string().default(path.resolve(__dirname, "../../public/uploads")),
  // Public base URL used to build absolute profile-picture URLs.
  BASE_URL: z.string().optional().default(""),

  // Authentication (JWT).
  JWT_SECRET: z.string().default("dev-insecure-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("24h"),

  // Seed admin account created at startup (used to protect /api/admin/*).
  ADMIN_EMAIL: z.string().default("admin@bitpulse.local"),
  ADMIN_PASSWORD: z.string().default("change-me-admin"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const config = parsed.data;
