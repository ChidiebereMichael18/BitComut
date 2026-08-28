# BitComut Backend ⇄ Frontend Synchronization Audit

**Date:** 2026-08-28
**Auditor:** automated review + live runtime exercise
**Scope:** `BItComutHelper/backendsample` (Express 5 + Postgres backend) vs `BitComut/frontend` (Next.js 16 app), plus the LNbits sandbox dependency and the `BitComut/mobile` app.
**Status of environment during audit:** backend live on `:4000` (started via `tsx src/server.ts`), LNbits Docker live on `:5000` (FakeWallet funding source), local Postgres on `:5432`, DB migrated + seeded. Frontend **not** running during the audit (its own `dev-server.log` shows a healthy recent run).

---

## 1. Executive summary

The two systems are **structurally very close but not connected and not contract-identical**. The backend is a real, working implementation: it boots, migrates, seeds, talks to a live LNbits sandbox, creates real Lightning invoices, confirms paid payments, drives the whole state machine (invoice → payment → settlement → withdrawal), and pushes per-tenant realtime events over a WebSocket. I exercised this end-to-end against the running server and it works.

However, the **frontend makes zero HTTP/WS calls by design today** — every service, the settlement client, and the realtime layer are backed by mocks (`src/lib/mock/*`, `src/lib/api/settlement.ts`, `src/lib/events/demo-source.ts`). Nothing in the frontend consumes the backend API, so the two halves cannot currently run as one system. Beyond that, the wire contracts diverge in several places (dashboard stats, chart period, students list pagination, settlement balance `currency`, withdrawal reference prefix, payment-account masking, tenancy cookie semantics, and more — detailed in §3).

**The single biggest finding:** there is no integration layer on the frontend. Adding `fetch`/WS consumers and aligning the §3 mismatches is the entire remaining "make it work together" work. Everything backend-side is in place and proven working.

### What works (proven live)
- Full payment lifecycle: `POST /api/payments` created a real LNbits invoice (5208 sats, rate 480,000,000 RWF/BTC), confirmation → `Paid`, settlement `Pending → Processing → Settled`, payment → `Settled`, receipt issued, withdrawal `Pending → Processing → Completed`, balances updated.
- Realtime WS fan-out per tenant with correct message types (`payment.created/confirmed`, `settlement.status_changed`, `settlement.completed`, `withdrawal.status_changed`).
- Multi-tenancy: 3 seeded tenants, `X-Tenant-Slug` header switching works.
- Error format `{ error: { code, message, details? } }` consistent; zod validation returns field-level details.
- LNbits reconcile poller compensates for broken webhook delivery (see §4.3).

### What is broken or missing
1. Frontend is mock-only — no fetch/axios/WS/`process.env` usage anywhere in `frontend/src`; no `route.ts`/middleware.
2. Webhook delivery from the LNbits container to the backend is **rejected** ("Callback not allowed… Netloc: localhost:4000"); reconcile polling is the only reason payments still get confirmed.
3. Backend `node_modules/.bin` is missing → every npm script (`dev`, `build`, `start`, `test`, `typecheck`, `lint`) fails with *"not recognized as an internal or external command"*. Server runs only because it was launched directly.
4. Backend ships **zero test files** although `vitest`/`supertest` are configured devDeps (`npm test` finds nothing). Frontend has **no test script** at all.
5. Tenancy cookie semantics differ: frontend writes the tenant **slug** into `bitcomut:tenant`; backend treats the value as a tenant **ID**. Confirmed live: a slug cookie silently falls back to the first tenant.
6. Payment-account API returns the **raw, unmasked** account number (`number: "0788123456"`) — a data-exposure issue.
7. Contract mismatches exist even where code is "wired-ready" (dashboard stats shape, chart periods `12M` vs `90D`, `ChartPoint` keys, students list pagination, settlement balance missing `currency`, withdrawal refs `WD-` vs frontend `SET-`).

---

## 2. Inventory

### 2.1 Frontend (`BitComut/frontend`)
- **Stack:** Next.js 16.3.3 (Turbopack), React 19.2.8, zod 4.4.3, radix-ui, recharts, sonner, Tailwind 4. Scripts: `dev`, `build`, `start`, `lint` (no `test`).
- **No `.env*` files; no `NEXT_PUBLIC_*`; no HTTP client, no `fetch`, no `axios`, no `WebSocket`, no `EventSource`.**
- Types (`src/lib/types.ts`): InvoiceType, InvoiceStatus, PaymentStatus, SettlementStatus, WithdrawalStatus, StudentStatus, PaymentAccountType, PaymentMethod, PaymentNetwork, Student, Invoice, Payment, Settlement, Receipt, PaymentAccount, Withdrawal, SettlementBalance, Tenant, University.
- Mock data layer: `src/lib/mock/db.ts` + per-tenant datasets; `src/lib/mock/tenant-data.ts` (extra students/invoices registered client-side); `src/lib/services/*` (students, invoices, payments, settlements, withdrawals, analytics, chart) — all `delay()`-wrapped mock reads.
- Settlement client `src/lib/api/settlement.ts`: simulated `getBalance`, `requestWithdrawal`, `listWithdrawals`, `getWithdrawal`, methods (list/create/delete), `subscribe(slug, cb)` (cb takes **no payload**); withdrawal references generated as `SET-<year>-<n>`; store key `bitcomut:banks:<slug>`.
- Realtime: `src/lib/events.ts` (PaymentEventType includes `payment.created|detected|confirmed|failed|settlement.processing|settlement.completed`), `demo-source.ts` (demo payments `PAY-DEMO-…`), `real-time-provider.tsx` (subscribes, keeps 20 latest).
- Tenancy: cookie + localStorage key `bitcomut:tenant`; default slug `kigali-international-university`; server actions `setTenantCookie`, `clearTenantCookie`, `onboardTenant`, `addStudentToTenant`, `addInvoiceToTenant`, `importStudentsToTenant` — all persist into **localStorage/mock**, not an API.
- Routes exercised: `/dashboard` (+ students, students/[id], invoices, invoices/new, invoices/[id], payments, payments/[id], receipts, receipts/[id], settlements, settings, settings/profile, settings/preferences), `/login`, `/signup`, `/forgot-password`.
- Seeded tenants (`src/lib/tenants.ts`): `tn_kiu` Kigali International University · RWF, `tn_uon` University of Nairobi · KES, `tn_cu` Cavendish University Uganda · UGX. (Extra tenant slugs can appear from client-registered tenants in `localStorage["bitcomut:tenants"]`.)

### 2.2 Backend (`BItComutHelper/backendsample`)
- **Stack:** Express 5.2.1, pg, zod 3.23.8, pino/pino-http, ws, node-cron, multer, express-rate-limit, cookie-parser, cors, bcryptjs/jsonwebtoken (installed but **unused**). `type: commonjs`, TS via `tsx`, output `dist/`. No lockfile.
- Scripts: `build` (tsc), `dev` (nodemon), `start` (node dist), `migrate`/`seed` (tsx), `test` (vitest run — **0 tests exist**), `test:watch`, `typecheck`, `lint` (eslint — **no eslint config present**).
- Middleware: tenant resolution (`X-Tenant-Slug` header → `bitcomut:tenant` cookie-as-ID → first seeded tenant), zod `validateBody`/`validateQuery`, `ApiError` error handler (`{ error: { code, message, details? } }`), idempotency via `Idempotency-Key` header + `idempotency_keys` table, JSON rawBody capture for webhook HMAC.
- Routes (all under `/api` except webhooks & health): students (list/create/import/template/get/invoices/payments), invoices (list/get/create/create-payment-bundle), payments (list/get/create → invoice+payment+LN invoice), settlement (withdraw/balance/withdrawals/methods), settlements (list/get), receipts (list/get), dashboard (stats/chart), university (get/put), tenants (list), `POST /webhooks/lnbits`, `GET /health`.
- Realtime: `RealtimeServer` on `/ws` with `?tenantId=` / `subscribe` message scoping; bus publishes `{ tenantId, kind: payment|settlement|withdrawal, data }` → clients receive `payment.*`, `settlement.status_changed`, `withdrawal.status_changed`.
- Workers: Settlement + Withdrawal workers (tick on boot + every 5s, DB-backed job state machine), Reconcile worker (polls LNbits per `RECONCILE_CRON`).
- Providers: `SimulatedSettlementProvider` (DB `settlement_jobs`, `SETTLEMENT_DELAY_MS`), `StaticFxProvider` (RWF=480M, KES=RWF/3.15, UGX=RWF/1.32; unknown currencies fall back to the base rate), LNbits client (checkbox health non-fatal).
- Schema: `sql/001_init.sql` (tenants, students, invoices, payments, settlements, receipts, payment_accounts, withdrawals, idempotency_keys) + `sql/002_jobs.sql` (settlement_jobs, withdrawal_jobs); `schema_migrations` created at runtime by `scripts/migrate.ts`.
- IDs: backend `tn_/st_/inv_/pm_/stl_/rc_/wd_/pa_/job_` + `inv_`; references `INV-YYYY-XXXX`, `SET-YYYY-NNN`, `WD-YYYY-NNN`, `RC-YYYY-XXXX`. `ids.ts` helpers for `invoiceNumber`/`setNumber` exist but the routes/service build references inline with different formats.
- `.env`: concretely configured (see §5); seeded data present (3 tenants × 10 students × 10 invoices).

### 2.3 LNbits sandbox (`BItComutHelper/lnbits`)
- Official LNbits repo checked out; runs via Docker Compose (`lnbits-lnbits-1`, `lnbits-db-1` postgres:15). `LNBITS_BACKEND_WALLET_CLASS=FakeWallet` — centralised fake funding (no real BTC; wallet balances settable via admin UI).
- Wallet referenced by the backend `.env` has balance 1,000,000,000 msat; the backend can create invoices through it.
- **Callback policy blocks `http://localhost:4000/webhooks/lnbits`** (see §4.3).

### 2.4 `BitComut/backend` and `BitComut/mobile`
- `BitComut/backend`: a **stub** — `package.json` with express/pg/dotenv only; no source, no scripts. Not the real backend (that is `backendsample`).
- `BitComut/mobile`: an Expo app with real screens (auth, pay, lightning, method, success, history, profile) and contexts (`auth-context`, `payment-context`) but **zero API calls** — no fetch/axios/WS. It hardcodes country BTC rates (e.g. RWF `138,500,000` per BTC) that **conflict** with the backend static FX (RWF `480,000,000`). Displayed for completeness; not part of the main sync contract.

---

## 3. Contract diff table

Legend: ✅ aligned · ⚠️ mismatch/needs alignment · ❌ missing/blocked · ❓ unverified or N/A

| # | Contract point | Frontend (source of truth) | Backend | Verdict | Notes |
|---|---|---|---|---|---|
| 1 | InvoiceType | 6 values incl. `Library Fee` | same 6 | ✅ | CHECK mirrors |
| 2 | InvoiceStatus | 5 values | same 5 | ✅ | |
| 3 | PaymentStatus | 7 values incl. `Settlement Pending` | same 7 | ✅ | |
| 4 | SettlementStatus | 4 values | same 4 | ✅ | |
| 5 | WithdrawalStatus | 4 values | same 4 | ✅ | |
| 6 | StudentStatus | Active/Inactive/Graduated | same + CHECK | ✅ | |
| 7 | PaymentAccountType / Method / Network | as defined | same | ✅ | |
| 8 | ReceiptStatus | `Issued/Void` | same | ✅ | Backend-only emit; frontend `Receipt` type matches |
| 9 | Tenant shape | camelCase; `createdAt` | **types.ts declares `created_at` (snake)**; wires return `createdAt` | ⚠️ | Verified live: `GET /api/tenants` → `createdAt`. Fix `modules/types.ts` line 66 |
| 10 | Student | camelCase incl. `createdAt?` | camelCase | ⚠️ | List response is **paginated** `{data,total,page,limit}` vs frontend flat `StudentSummary[]`; consumers (`students-manager`, `create-invoice-form`) need adaptation |
| 11 | Invoice | `id` **is** the number in mock (`INV-YYYY-XXXX`), `tenantId` omitted in mock objects | `id`=`inv_*`, separate `number`=`INV-YYYY-XXXX` | ⚠️ | Field set identical; ID/number duality differs; `POST /api/invoices` returns `number | undefined` | 
| 12 | Payment | camelCase; extra joined fields none | camelCase; safe extras | ✅ | `mapPayment` drops `studentName` though queries join it |
| 13 | Settlement | reference `SET-YYYY-NNN` | `SET-YYYY-NNN` | ✅ | |
| 14 | Withdrawal | reference **`SET-YYYY-NNN`** (mock `seqCounter`) | reference **`WD-YYYY-NNN`** | ⚠️ | Prefix mismatch, plus `id wd_*` (both) and backend adds `tenantId` (harmless), backend never populates `masked` |
| 15 | PaymentAccount `masked` | display `"{label} · •••• {last4}"`; spec: raw number never leaves server | `masked = "{provider||label} · •••• {last4}"` AND **raw `number` returned in `number` field** | ❌ | Confirmed live on POST + GET methods: full number `0788123456` exposed; formatting uses provider when set |
| 16 | SettlementBalance | **includes `currency`** | omits `currency` | ❌ | Verified live response keys; frontend `getBalance` returns `currency`. Missing key breaks consumers |
| 17 | DashboardStats | `{totalReceived, totalChangePct, todayAmount, todayCount, pendingPayments, pendingAttention, settledCount, totalPayments, settlementRate}` | `{totalReceived, totalInvoiced, totalOutstanding, totalWithdrawn, collectionRate, settlementRate, todayAmount, recentPayments}` | ❌ | Only 3 field names overlap; `recentPayments` rows are raw **snake_case** joined rows (verified live) |
| 18 | ChartPoint | `{date, volume, count}`; ranges `7D\|30D\|90D` | `{label, amount, count}`; ranges `7D\|30D\|12M` | ❌ | Verified live: `period=90D` → 400 VALIDATION_ERROR; key names differ (also `amount` vs `volume`) |
| 19 | Create invoice payload | `{studentId, type, description, amount, currency, dueDate}` | same schema | ✅ | Field-for-field match |
| 20 | Create payment payload | **no frontend equivalent** (pay flow is demo events) | `{studentId, type, description, amount, currency, dueDate}` → invoice+payment+LN invoice | ❓ | No parity function to wire against; `POST /api/payments` requires `studentId`/invoice bundled |
| 21 | CSV import | columns `student_id,name,email,status`; template download; summary `{imported,updated,duplicates,failed:number}` | `student_id,name,email,status` template identical; **`failed` is `Array<{student_id,errors}>`**, not a number; import is multipart `file` upload | ⚠️ | Columns/template align; `failed` type differs; delivery mechanism differs (server action vs multipart) |
| 22 | Tenancy cookie | cookie/localStorage `bitcomut:tenant` = tenant **slug** | middleware reads cookie as tenant **ID** (or `X-Tenant-Slug` header, unused by FE) | ❌ | Verified live: slug cookie falls back to first tenant (data would be wrong for Nairobi/Cavendish) |
| 23 | Error format | none (no HTTP) | `{error:{code,message,details?}}` uniform | ❓ | Backend consistent; frontend must adopt it |
| 24 | Idempotency | **no concept** (no HTTP layer) | `Idempotency-Key` **required** on POST students/import/payments/withdraw/methods; **absent** on POST invoices | ⚠️ | FE must add header support; note invoice endpoint inconsistent |
| 25 | Realtime events | `PaymentEventType` includes `payment.detected`; `subscribe(cb)` cb has **no payload**; no `withdrawal.*` event type in `events.ts` | WS sends `{type:'withdrawal.status_changed', id, reference, status, updatedAt}` + `settlement.status_changed` + `payment.*`; `payment.detected` **never emitted**; `failed` only via `failPayment` (unwired) | ⚠️ | WS payload → frontend subscriber signature must change; event-type parity needs decision (`detected` unused on both; withdrawal event missing from frontend `events.ts`) |
| 26 | Settlement progress | simulated with timers | DB-backed jobs (`settlement_jobs`/`withdrawal_jobs`) | ✅ | Conceptually aligned; backend is restart-safe |
| 27 | FX | mock only; no `sats` display source | static rates RWF 480M / KES / UGX; snapshot at capture | ⚠️ | Frontend must render only rate/sats returned by API; mobile hardcodes RWF 138.5M (conflicts) |
| 28 | Receipt | `ReceiptDetail extends Receipt` (matches) | `{id, number, tenantId, studentId, invoiceId, paymentId, amount, currency, date, status}` | ✅ | |
| 29 | Amount precision | JS number | `NUMERIC(14,2)` | ⚠️ | Node pg returns strings → number conversion OK; watch rounding with currencies (RWF/UGX have 0 minor units) |
| 30 | Auth/sessions | signup/login/forgot-password pages exist (mock) | **no auth routes**; bcryptjs/jsonwebtoken installed but unused; tenancy via cookie/header only | ⚠️ | Sign-up page writes localStorage only; no `/api/auth` counterpart |
| 31 | University settings | FE settings form edits name/shortName/etc. | `PUT /api/university` full-field map (camel→snake) | ✅ | Shape parity |
| 32 | Students list spinner/search | client-side search/pagination over flat array | server-side `search`/`page`/`limit` | ⚠️ | See #10 |
| 33 | LN integration | none in FE | BOLT11 `paymentRequest`, `paymentHash`, `sats`, `rate` returned; reconcile + webhook (see §4) | ✅ | Backend-proven; FE would display QR/lightning string |
| 34 | Webhook authenticity | n/a | payment-hash DB lookup is the gate; HMAC **lenient** when using default secret (verified) | ⚠️ | Set a strong secret + enforce signature for production |

---

## 4. Runtime findings (live exercise on 2026-08-28)

All probes performed against the **already-running** backend (`:4000`), Dockerized LNbits (`:5000`) and local Postgres (`:5432`).

### 4.1 Health & data
- `GET /health` → `{"status":"ok"}`.
- `GET /api/tenants` → 3 seeded tenants (`tn_kigali`, `tn_nairobi`, `tn_cavendish`), 10 students each, `createdAt` camelCase on the wire (see #9).
- `GET /api/dashboard/stats` → `totalReceived=50000`, `todayAmount=50000`, plus the prior day's E2E payment in `recentPayments` (snake_case row, `status: Settled`).

### 4.2 End-to-end flow (fresh, exercised via API + WS listener on `tn_kigali`)
1. `POST /api/payments` (with `Idempotency-Key`) → **201-style bundle**: invoice `inv_c980828b6f16` (INV-2026-9617), payment `pm_950031273304` (Pending), real LNbits BOLT11 for **5,208 sats** at rate 480,000,000 — LNbits integration confirmed working (`lnbits_wallet_id: null` because `checkWallet` is best-effort).
2. Confirmation was driven through **`POST /webhooks/lnbits`** with the real invoice `payment_hash` (`{amount: 25000000, status: "SUCCESS"}` → `{ok:true, handled:true, paymentId}`), because the LNbits sandbox **cannot self-pay** and creating/funding a *payer* wallet via API requires a user token (`401 Missing user ID or access token`). Unknown-hash webhook correctly returned `handled:false`, proving the payment-hash gate.
3. WS messages observed in order:
   - `payment.created` → `payment.confirmed` → `settlement.processing` (kind `payment`)
   - `settlement.status_changed` (Processing → Settled, `stl_971e188eee7b / SET-2026-8153`)
   - `settlement.completed`
   - `withdrawal.status_changed` (Processing → Completed, `wd_b8988c4deffd / WD-2026-4418`)
4. `GET /api/payments/:id/settlement` → Settled; `GET /api/payments/:id/receipt` → `RC-2026-5738`.
5. `GET /api/settlement/balance?currency=RWF` → `totalCollected=75000, availableBalance=75000` (no `currency` key — see #16).
6. `POST /api/settlement/withdraw` → `WD-2026-4418`, auto-completed by the withdrawal worker.
7. Contract checks reproduced: `POST /api/payments` without key → `400 IDEMPOTENCY_KEY_REQUIRED`; `GET /api/dashboard/chart?period=90D` → `400 VALIDATION_ERROR` (see #18); methods list returns raw number (see #15).

**Conclusion:** backend pipeline Pending → Paid → Settlement Pending → Settled + receipt + withdrawal + WS events works and is correct.

### 4.3 LNbits webhook delivery is broken (reconcile saves the day)
`docker logs lnbits-lnbits-1` shows:
```
WARNING | Invalid webhook URL http://localhost:4000/webhooks/lnbits:
        Callback not allowed. URL: http://localhost:4000/webhooks/lnbits. Netloc: localhost:4000.
WARNING | Could not send webhook to http://localhost:4000/webhooks/lnbits
```
Root causes: (a) LNbits core callback-host policy rejects `localhost`, and (b) from inside the container `localhost` is the container itself, not the host. The earlier real-world payment (`pm_66d8fc82a8bf`) was confirmed **only because the Reconcile worker polls LNbits every 15 s** (`.env RECONCILE_CRON=*/15 * * * * *`). Webhooks are therefore **non-functional in this setup today**; the poller is the active confirmation path.

### 4.4 Frontend runtime evidence
- `dev-server.log` (most recent run): all `/dashboard/*`, `/login`, `/signup`, `/forgot-password` compiled and 200; `onboardTenant(...)` and `clearTenantCookie()` server actions invoked. Radial "initials" error at `header.tsx:171` seen in an earlier log is **fixed** in current source (uses `{profile.initials}`).
- Frontend `node_modules/.bin` exists → its `dev/build/lint` scripts runnable.

### 4.5 Test/CI status
- Backend `npm test` (vitest): **no test files present** — the suite is configured but empty.
- Backend `npm run lint`: fails before eslint runs — no config and (see §5) binaries missing.
- Backend `npm run typecheck`: `tsc` not found (see §5).
- Frontend: no `test` script at all.

---

## 5. Environment / configuration issues

1. **`node_modules/.bin` missing in `backendsample`** (while `node_modules/` packages exist). Every npm script (`dev`, `build`, `start`, `test`, `typecheck`, `lint`) fails with "`tsc`/`vitest`/`eslint`/… not recognized". The server runs only because it was launched as `node .../tsx/dist/cli.mjs src/server.ts` directly. Fix: re-run `npm install` (or `npm rebuild`) in `backendsample`. Also note **no `package-lock.json`** exists → non-reproducible installs.
2. **Secrets in `.env` (do not commit / do not screenshot):**
   - `DATABASE_URL=postgres://postgres:<password>@localhost:5432/bitcomut` — contain a real password (masked here).
   - `LNBITS_ADMIN_KEY=ec1f3f…` and `LNBITS_INVOICE_KEY=d9a171…` — real wallet keys for the sandbox.
   - `LNBITS_WEBHOOK_SECRET=change-me-webhook-secret` and `JWT_SECRET=change-me` — **placeholders**; the webhook handler intentionally stays lenient when this default is used (verified: an unsigned webhook was accepted if the `payment_hash` matched). Suitable for the sandbox only.
3. **Webhook URL (`BITCOMUT_BASE_URL=http://localhost:4000`) is not reachable/allowed by the LNbits container** (see §4.3). Recommend `BITCOMUT_BASE_URL=http://host.docker.internal:4000` **plus** allowing that host in LNbits admin settings; otherwise webhooks remain dead and everything depends on the poller.
4. **LNbits currency/rate drift:** backend static FX says RWF 480,000,000/BTC; `BitComut/mobile` hardcodes 138,500,000/BTC. If mobile is part of the product, this is a 3.5× discrepancy that will show as wildly different SAT amounts.
5. **No frontend env/config** for a backend URL (nothing to put it in yet — the integration layer doesn't exist). `CORS_ORIGIN=http://localhost:3000` is already configured on the backend, so CORS is ready.
6. Backend `lint` has no ESLint config file (`.eslintrc*`/`eslint.config.*` absent) even though the script references `eslint`.

---

## 6. Prioritized fix list

### P0 — required to run the two systems together
1. **Wire the frontend to the backend.** Replace mock service bodies and `api/settlement.ts` with real `fetch` + a real WS client (backend socket is at `/ws?tenantId=…`). Add a `NEXT_PUBLIC_API_URL` / backend URL config. Everything else only matters once this exists.
2. **Fix tenancy resolution.** Make the backend cookie path accept a tenant **slug** (as frontend sends) in addition to ID — 1-line query change in `src/middleware/tenant.ts` — OR have the frontend send the tenant ID. Header `X-Tenant-Slug` already works but is unused. (Design choice; see open questions.)
3. **Align the wire contract** (blocking clean rendering):
   - Settlement balance: return/add `currency` (matches frontend `SettlementBalance`).
   - Dashboard stats: reconcile FE expectations (`todayCount`, `pendingPayments`, `settledCount`, `totalPayments`, `totalChangePct`) with backend outputs (`totalInvoiced`, `totalOutstanding`, `totalWithdrawn`, `collectionRate`) — pick one canonical shape; map `recentPayments` to camelCase.
   - Chart: add `90D` (or map FE range) and output `{date, volume, count}` keys.
   - Students list: adapt FE consumers to paginated `{data,total,page,limit}`.
   - Withdrawal: decide reference prefix (`SET-` vs `WD-`) and populate `masked`.
4. **Fix webhook delivery** (see §5.3) or explicitly rely on reconcile; document the recon path.
5. **Restore npm scripts** in `backendsample` (re-run `npm install`) and add at least one smoke test so `npm test` is meaningful; remove the empty `test:/typecheck`/`lint` expectations or wire them up (add eslint config + a test file).

### P1 — security / data integrity
6. **Stop leaking raw account numbers.** Return only `masked` (or a last-4 field) from methods list/create; keep raw data server-side (`payment-accounts.repo.ts`).
7. **Strengthen webhook auth** when not using the default secret (enforce `X-LNbits-Signature` once a real secret is set). Already behaves correctly if a non-default secret is configured.
8. Replace placeholder `JWT_SECRET`/webhook secret for anything beyond local.
9. Add composite-tenancy FKs (`invoices.student_id`, `settlements.student_id`, `receipts.student_id`, `payments.invoice_id`, `withdrawals.payment_account_id`) so cross-tenant rows are impossible (schema hardening).

### P2 — parity & polish
10. Unify reference generation: `ids.ts` helpers diverge from inline generation in `payments.service.ts`, `settlements`, and `withdrawals` routes (verified: `INV-`/`SET-`/`WD-`/`RC-` built in 4 places).
11. Add idempotency to `POST /api/invoices` for consistency (every other mutating POST requires it).
12. Population/polish: `mapPayment` currently drops joined `studentName`/`invoiceDescription` (used by WS confirm events from a separate query); consider including them for list UIs.
13. Define parity for realtime event types: `payment.detected` is declared but never emitted on either side; `payment.failed` is only reachable via an unwired `failPayment`; frontend `events.ts` lacks `withdrawal.status_changed`. Align the type unions intentionally.
14. Mobile: align `btcRate` values with backend FX or fetch rates (`LNBITS_FX`/backend feed) before it ships a pay flow.

---

## 7. Open questions

1. **Integration approach:** is the intended plan to (a) keep the mock layer as a dev fallback behind an interface and add a real transport (recommended), or (b) swap straight to the backend API? The mock split (`services/*` + `api/settlement.ts` + `events/demo-source.ts`) suggests (a) was the plan.
2. **Tenancy identifier of record:** should the cookie/`localStorage` store the tenant **slug** or the tenant **ID**? Frontend and backend must agree (currently they don't — #22).
3. **How does a real student pay?** The frontend "pay" experience is driven by demo events and a mock `requestWithdrawal`; the backend exposes `POST /api/payments` (creates payment earliest) and the mobile app has its own pay screens. Is the intended flow "university creates invoice → student pays BOLT11 via LNbits → webhook reconciles"? If so, the frontend admin doesn't call `POST /api/payments` at all — only reads state via WS. Clarify who creates payments.
4. **`payment.detected`/`failed`:** should the backend emit them (e.g., detect a matching inbound invoice before settlement) to match the frontend event model, or prune them from the contract?
5. **Dashboard stats:** do product owners want the backend's financial KPIs (totalInvoiced/outstanding/collectionRate) *and* the frontend's operational KPIs (pendingCounts/todayCount/settledCount), or one unified schema?
6. **LNbits ops:** is the webhook callback-host policy something we may change (admin settings), or is the reconcile poller the intended production path? Is there an LNbits superuser key available for creating/funding sandbox wallets via API (the current `.env` only has wallet keys)?
7. **Backend auth:** there are no auth routes; `/signup` only registers a local mock tenant. Is authentication planned for the backend (bcryptjs + jsonwebtoken are already in deps) or is tenancy-by-header sufficient for this stage?

---

## 8. Auto-fix (allowable trivia)

**None applied.** The only purely "trivial" item — the `created_at` vs `createdAt` field name in `backendsample/src/modules/types.ts:66` — touches a type that is mirrored from the frontend and central to the contract; a cross-repo edit here is better done deliberately alongside the P0 wiring (and the wire already returns `createdAt`, so it's cosmetic in the type file only). All other mismatches are behavioral (dashboard stats, chart periods, tenancy semantics, ID prefixes, account-number masking) and were left untouched pending the design decisions in §7. This audit is read-only.