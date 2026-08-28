import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  BITCOMUT_BASE_URL: z.string().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  LNBITS_BASE_URL: z.string().min(1, 'LNBITS_BASE_URL is required'),
  LNBITS_ADMIN_KEY: z.string().default(''),
  LNBITS_INVOICE_KEY: z.string().default(''),
  LNBITS_WEBHOOK_SECRET: z.string().default('change-me-webhook-secret'),

  FX_PROVIDER: z.enum(['static', 'lnbits', 'external']).default('static'),
  BTC_RWF_RATE_FALLBACK: z.coerce
    .number()
    .positive()
    .default(480_000_000),

  JWT_SECRET: z.string().default('change-me'),
  COOKIE_NAME: z.string().default('bitcomut:tenant'),

  SETTLEMENT_DELAY_MS: z.coerce.number().default(15000),
  WITHDRAWAL_DELAY_MS: z.coerce.number().default(15000),

  RECONCILE_CRON: z.string().default('*/30 * * * * *'),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = result.data;
  return cached;
}

export const env: Env = loadEnv();
