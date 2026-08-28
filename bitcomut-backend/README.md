# BitPulse Backend

Bitcoin-powered cross-border education payments. Students pay in **local currency**;
the system converts to **BTC**, moves it over the **Lightning Network**, and settles to
the university in its **local currency**. End users never need to touch Bitcoin.

**MVP corridor:** Nigeria (NGN) → Rwanda (RWF)

```
Student (NGN) → Platform → Lightning → FX conversion → Local settlement → University (RWF)
```

## Architecture

| Layer | Tech |
|-------|------|
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL 16 (Docker) |
| Lightning | **Voltage cloud LND over REST** (hosted — no WSL/local node) |
| FX rates | Provider key in `.env` (CoinGecko public fallback) |
| Settlement | Simulated for MVP, real adapter pluggable |

Core design: the payment "rail" is abstracted (`src/adapters/lightning`) so the app runs
fully with a **simulated** rail, and switches to a **real Voltage hosted node** (REST) the
moment its credentials are present — no WSL, no local Lightning needed.

## Project layout

```
src/
  server.ts                 Express app entry
  config/                   env loading + validation (zod)
  db/                       pool, schema.sql, migrate.ts
  services/
    fx.ts                   FX engine (quote generation, lock, conversion)
    payments.ts             payment orchestrator (quote → invoice → confirm → settle)
    audit.ts                audit trail writer
  adapters/
    lightning/types.ts      LightningRail interface
    lightning/voltage.ts    Voltage cloud LND (REST) adapter  [VOLTAGE_ENABLED=true]
    lightning/lnd.ts        local LND (gRPC) adapter
    lightning/simulated.ts  mock rail (default, light on 4GB machine)
    settlement/             local-currency settlement adapter
  routes/
    student.ts              Student App API
    university.ts           University Dashboard API
    admin.ts                Admin Dashboard API
  middleware/handlers.ts    error handling
```

## Getting started

```bash
# 1. Start PostgreSQL
docker compose up -d db

# 2. Configure
copy .env.example .env        # then fill in your keys

# 3. Apply schema
npm install
npm run migrate

# 4. Run
npm run dev                   # http://localhost:4000
# or build + run
npm run build && npm start
```

To smoke-test the whole flow (quote → lightning → settle → receipts):

```bash
node test-e2e.js
```

## Using a real Lightning node (Voltage cloud — no WSL)

Voltage runs your LND node in the cloud, so you connect over HTTPS/REST directly and
**never need WSL or a local node** (great on a 4GB machine).

1. Create a node in the [Voltage dashboard](https://app.voltage.cloud/) (testnet for the demo, mainnet later).
2. From the node's **Node Details** tile copy the **REST URL** (port 8080).
3. From the **Admin Macaroon** tile **download/hex** the macaroon.
4. Set in `.env`:
   ```
   VOLTAGE_ENABLED=true
   VOLTAGE_LND_URL=https://xxxx.lnd.voltageapp.io:8080
   VOLTAGE_MACAROON=<your hex macaroon>
   ```
5. Restart the backend. The `/health` endpoint will report `"rail":"voltage"` instead
   of `"simulated"`.

> Only for a self-hosted local node (not needed with Voltage): run
> `bash scripts/setup-wsl-lnd.sh` inside WSL and use the LND_* options instead.

## API

### Student App
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/student/universities` | select university |
| GET | `/api/student/universities/:id/invoices` | select tuition invoice |
| POST | `/api/student/payments/quote` | locked FX quote `{invoiceId, fromCurrency}` |
| POST | `/api/student/payments/generate` | generate Lightning invoice `{invoiceId, quoteId}` |
| POST | `/api/student/payments/confirm` | complete payment `{paymentId}` |
| GET | `/api/student/payments/:id/receipt` | confirmation / receipt |

### University Dashboard
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/university/:id/payments` | view incoming payments |
| GET | `/api/university/:id/payments/:pid/conversion` | fiat/BTC conversion |
| GET | `/api/university/:id/settlements` | track settlement |
| GET | `/api/university/:id/payments/:pid/receipt` | generate receipt |

### Admin Dashboard
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/admin/universities` | manage universities (+ invoices) |
| GET | `/api/admin/transactions` | monitor transactions |
| GET | `/api/admin/rates` | monitor exchange rates |
| GET | `/api/admin/audit` | view audit logs |

## Notes on the 4GB machine

- **No WSL or local node needed with Voltage** — the hosted node runs in the cloud, so
  your machine stays fast. `.wslconfig` only matters if you run a local LND.
- The **simulated rail** is the default so the MVP demo runs light; Voltage activates
  automatically once `VOLTAGE_ENABLED=true` + node URL + macaroon are set.
- PostgreSQL runs in Docker to keep things self-contained.
