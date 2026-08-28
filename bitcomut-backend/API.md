# BitPulse — API Documentation

Base URL: `http://localhost:4000`
All requests/responses use **JSON**. The server listens on the port configured in `.env` (`PORT`, default `4000`).

**CORS:** enabled for all origins (`app.use(cors())`), so a browser frontend on any host/port can call the API.

**Error format:** all errors return a JSON body `{ "error": "<message>" }`. Common status codes:

| Code | Meaning |
|------|---------|
| `400` | Missing/invalid required field(s) |
| `404` | Resource not found (also returned when a cross-university id is used — see scoping) |
| `500` | Server error / FX unavailable |

> **Data isolation (important):** every `/:universityId/...` endpoint is scoped to that university. Trying to read, approve, or pay another university's record by guessing its `id` returns `404` — universities can never see each other's students, payments, receipts, or conversions.

---

## Currency codes

- `BTC` is supported as both a **source and target** currency (universities may invoice directly in BTC; students may pay in BTC).
- 41 **African fiat currencies** are supported. List them with `GET /api/admin/currencies`.
- Fiat → fiat conversions route through BTC. `1 BTC = 1 BTC` (identity) internally.

---

## Health

### `GET /health`
Server liveness + active payment rail.

```json
{
  "ok": true,
  "service": "bitpulse",
  "corridor": "CURRENCY_NGN->CURRENCY_RWF",
  "rail": "simulated",
  "configured": "simulated",
  "active": "simulated",
  "detail": "...",
  "healthy": true
}
```

---

# Uploads — `/api/upload`

Profile pictures (avatars/logos) are uploaded as **multipart/form-data** files. The backend stores the image under `public/uploads/` and serves it back at `/uploads/<file>`. The stored URL is written to the owner's `profile_pic` field.

### `POST /api/upload/profile-pic`
Multipart form fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `profile_pic` | file | yes | image; max **5 MB**; JPEG / PNG / WebP / GIF only |
| `kind` | text | yes | `student` or `university` |
| `id` | text | yes | the owner's UUID |

**Response `200`:**
```json
{ "ok": true, "url": "http://localhost:4000/uploads/1787866864597-abc123.png", "profile_pic": "http://localhost:4000/uploads/1787866864597-abc123.png", "id": "...", "name": "..." }
```

**Errors:** `400` missing file / non-image / invalid kind; `404` owner id not found.

The `profile_pic` URL is also returned in the student profile (`GET /api/student/:id/profile`), the university list, and the student register / university create responses. It can also be set directly via JSON (see those routes below). Configure the public base with `BASE_URL` in `.env` (defaults to `http://localhost:PORT`).

---

# Student App — `/api/student`

## Register a student

### `POST /register`
Creates a student profile. **Upsert by email** — re-registering the same email updates `name`, `phone`, `country`, `currency` and returns the same `id` (no duplicate row).

**Body:**
```json
{
  "name": "Amina Nkusi",
  "email": "amina@example.com",
  "phone": "+250700000000",
  "country": "Rwanda",
  "currency": "RWF",
  "profile_pic": "https://example.com/amina.png"
}
```
- `name`, `email`, `country` — **required**
- `currency` — optional, defaults to `NGN`; uppercased automatically
- `phone` — optional
- `profile_pic` — optional URL (or use the upload endpoint); on a re-register of the same email, an omitted `profile_pic` **keeps** any previously uploaded picture
- `email` — trimmed + lowercased automatically

**Response `201`:** the student row (`id`, `name`, `email`, `phone`, `country`, `currency`, ...).

## Get student profile

### `GET /:id/profile`
Returns the student record. `404` if not found.

## Enroll at / connect with a university

### `POST /enroll`
Requests a connection to a university. Upserts on `(university_id, student_ref)`. Keeps `status = 'pending'` and notifies the university.

**Body:**
```json
{
  "studentId": "<student-id>",
  "universityId": "<university-id>",
  "studentRef": "STU-2026-001",
  "department": "Computer Science"
}
```
- `studentId`, `universityId`, `studentRef` — **required**
- `department` — optional

**Response `201`:** the enrollment record + `university_name`, `university_country`, `university_currency`. `404` if student or university not found.

## List student's enrollments

### `GET /:id/enrollments`
All connection requests for this student, newest first, each joined with the university name/country/currency.

## Student notifications

### `GET /:id/notifications?limit=50`
```json
{ "unreadCount": 2, "notifications": [ { "id": "...", "title": "...", "message": "...", "type": "...", "data": {}, "read": false, "created_at": "..." } ] }
```
`limit` defaults to 50, capped at 100.

### `POST /:id/notifications/:notificationId/read`
Marks a notification read. `404` if not found or not owned by this student.

## Student invoices

### `GET /:id/invoices`
All tuition invoices for a **connected** (approved enrollment) student, including linked payment details (`payment_code`, `qr`, `bolt11`, `btc_amount`, `from_amount`, `from_currency`, `tx_reference`, `payment_status`) and university info.

## Select a university

### `GET /universities`
List verified universities:
```json
[ { "id": "...", "name": "...", "country": "...", "currency": "RWF" } ]
```

### `GET /universities/:id/invoices`
List **unpaid** invoices for a university:
```json
[ { "id": "...", "student_ref": "...", "amount": 50000, "currency": "RWF", "description": "...", "status": "unpaid" } ]
```

---

# Payment flow (student)

## Resolve a payment by code

### `POST /payments/by-code`
Used when the student types/shares the university's **payment code** or scans its QR. Returns the Bolt 11 + QR to scan.

**Body:**
```json
{ "code": "ABC123", "universityId": "<optional-scope>" }
```
- `code` — **required**
- `universityId` — optional; scopes the lookup to that university

## Locked FX quote

### `POST /payments/quote`
Locks an exchange rate for an invoice, converting the invoice amount into the student's payment currency (routed via BTC). Quotes expire after 5 minutes.

**Body:**
```json
{ "invoiceId": "<invoice-id>", "fromCurrency": "NGN" }
```
- `invoiceId`, `fromCurrency` — **required**

Paying in **BTC** against a fiat invoice returns the payable amount **in BTC** (fiat amount converted to Bitcoin).

**Response:** `{ "invoice": {...}, "quote": { "id": "...", "from_currency": "NGN", "to_currency": "RWF", "btc_rate": ..., "fx_usd_rate": ..., "from_amount": ..., "btc_amount": ..., "expires_at": "..." }, "fromAmount": ... }`

## Generate Lightning payment

### `POST /payments/generate`
Creates the actual Lightning invoice (Bolt 11) for the exact satoshi amount against a locked quote.

**Body:** `{ "invoiceId": "...", "quoteId": "..." }`

**Response `201`:** `{ "quote": {...}, "invoice": { "paymentHash": "...", "paymentRequest": "lnbc...", "amountSat": ... }, "paymentId": "...", "txReference": "..." }`

## Confirm / complete payment

### `POST /payments/confirm`
For the **simulated rail**, confirms and settles the payment. With a real node, settlement only occurs once the Bolt 11 is paid on-chain over Lightning.

**Body:** `{ "paymentId": "..." }`

## Receipt

### `GET /payments/:id/receipt`
Complete record: payment + quoted amounts + settlement + invoice line. `404` if not found.

---

# University Dashboard — `/api/university`

## Enrollment management

### `GET /:universityId/enrollments?status=pending`
List enrollment/connection requests for this university. Optional `status` filter (`pending` | `approved` | `rejected`). Joins full student details.

### `POST /:universityId/enrollments/:enrollmentId/approve`
Approves a pending enrollment and notifies the student. `404` if the enrollment doesn't belong to this university.

**Response:** `{ "ok": true, "message": "...", "enrollment": {...} }`

### `POST /:universityId/enrollments/:enrollmentId/reject`
Rejects an enrollment. `404` if not in this university.

**Body (optional):**
```json
{ "reason": "Student record could not be verified" }
```

**Response:** `{ "ok": true, "message": "...", "enrollment": {...} }`

### `GET /:universityId/students`
All **approved** students in this university's network (with `enrollment_id`, `student_ref`, `department`, `approved_at`).

## Invoices

### `POST /:universityId/invoices`
Issue a tuition invoice for a student. If `autoGeneratePayment` is `true`, it also creates the real Lightning payment immediately (returns `payment`). Otherwise, if the student is approved, they're notified.

**Body:**
```json
{
  "student_ref": "STU-2026-001",
  "amount": 0.001,
  "currency": "BTC",
  "description": "Spring semester",
  "autoGeneratePayment": true
}
```
- `student_ref`, `amount`, `currency` — **required** (currency may be any supported fiat or `BTC`)

**Response `201`:** `{ "invoice": {...}, "payment": null | { "paymentId": "...", "paymentCode": "...", "qr": "...", "bolt11": "lnbc...", "amountSat": 100000 } }`

### `POST /:universityId/invoices/:invoiceId/create-payment`
Create the Lightning payment for an existing invoice (distribute `payment_code`/QR to the student). `404` if the invoice isn't in this university.

## Notifications (university)

### `GET /:universityId/notifications?limit=50`
### `POST /:universityId/notifications/:notificationId/read`
Same shape as the student notification endpoints.

## Balance & ledger

### `GET /:universityId/balance`
The **platform Lightning node** balance — sats available on the node (on-chain + channels).

```json
{ "rail": "simulated", "totalSat": 1000000, "onChainSat": 1000000, "channelSat": 0 }
```
With a real LND node this calls `WalletBalance` + `ChannelBalance` over gRPC.

### `GET /:universityId/ledger`
The university's **private ledger** in its own currency.

```json
{
  "universityId": "a3a22cdd-...",
  "received": 50000,
  "settled": 50000,
  "pending": 0,
  "paid_count": 1,
  "pending_count": 0
}
```
- `received`/`paid_count` — sum/count of payments in status `paid` or `settled`
- `settled` — sum of settled payments
- `pending`/`pending_count` — sum/count of `pending` payments

## Payments

### `GET /:universityId/payments`
All incoming payments for this university (real-time by polling), each joined with its invoice and settlement record.

### `GET /:universityId/payments/by-code/:code`
Look up a payment by its short code, **scoped** to this university. Returns `404` for foreign codes.

### `GET /:universityId/payments/:paymentId/conversion`
The fiat/BTC conversion details for a payment (`btc_amount`, `from_amount`, `from_currency`, `to_currency`, `btc_rate`, `fx_usd_rate`). `404` if the payment isn't in this university.

### `GET /:universityId/payments/:paymentId/receipt`
Receipt for a single payment. `404` if not in this university.

## Settlements

### `GET /:universityId/settlements`
Track settlement records for this university (each joined with `tx_reference` and `student_ref`).

---

# Admin Dashboard — `/api/admin`

## Universities

### `GET /universities`
List all universities, newest first (`*` columns).

### `POST /universities`
Register a university. Sets `is_verified = true`.

**Body:** `{ "name": "...", "country": "Rwanda", "currency": "RWF", "swift_code": "...", "account_ref": "...", "profile_pic": "..." }`
- `name`, `country`, `currency` — **required** (currency may be any supported fiat or `BTC`)
- `swift_code`, `account_ref` — optional
- `profile_pic` — optional URL/logo (or use the upload endpoint)

**Response `201`:** the created university row.

### `POST /universities/:id/invoices`
Create an invoice directly on behalf of a university.

**Body:** `{ "student_ref": "...", "amount": 50000, "currency": "RWF", "description": "..." }`
- `student_ref`, `amount`, `currency` — **required**

**Response `201`:** the created invoice row.

## Monitoring

### `GET /transactions`
All payments platform-wide, newest first (joined with university + student ref).

### `GET /rates?currency=RWF`
Current BTC conversion rate for a currency.

```json
{ "currency": "RWF", "fiatPerBtc": 57123.4, "btcPerUnit": 0.0000175 }
```
Works for `BTC` too (`fiatPerBtc: 1`).

### `GET /rail`
Live payment-rail status (configured vs. active, and why):
```json
{ "configured": "simulated", "active": "simulated", "detail": "..." }
```

### `GET /currencies`
Every supported currency with live-rate availability + current BTC/USD price:
```json
{
  "count": 41,
  "currencies": [ { "code": "RWF", "name": "Rwandan Franc", "country": "Rwanda", "hasLiveRate": true } ],
  "btcUsd": 80000
}
```

### `GET /audit?limit=100`
Audit trail, newest first. `limit` defaults to 100, capped at 500.

---

## Payment statuses

| Status | Meaning |
|--------|---------|
| `pending` | Quote/generated but not yet paid |
| `paid` | Bolt 11 seen, student states paid |
| `settled` | Fully settled to the university |
| `completed` | Terminal success state (receipt) |

## Invoice statuses

| Status | Meaning |
|--------|---------|
| `unpaid` | Issued, not yet paid |
| `paid` | Payment confirmed |

---

## Example: full cross-border flow (curl)

```bash
# 1. Admin registers a university (RWF)
curl -X POST http://localhost:4000/api/admin/universities \
  -H "Content-Type: application/json" \
  -d '{"name":"Kigali Intl University","country":"Rwanda","currency":"RWF"}'

# 2. Student registers
curl -X POST http://localhost:4000/api/student/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Amina","email":"amina@example.com","country":"Nigeria","currency":"NGN"}'

# 3. Student requests connection, university approves
curl -X POST http://localhost:4000/api/student/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId":"...","universityId":"...","studentRef":"STU-001"}'
curl -X POST http://localhost:4000/api/university/<uniId>/enrollments/<enrollId>/approve

# 4. University issues a BTC invoice with an instant Lightning payment
curl -X POST http://localhost:4000/api/university/<uniId>/invoices \
  -H "Content-Type: application/json" \
  -d '{"student_ref":"STU-001","amount":0.001,"currency":"BTC","autoGeneratePayment":true}'
# -> returns payment.paymentCode + payment.bolt11 + payment.qr

# 5. Student resolves by code, gets a locked quote, generates, confirms
curl -X POST http://localhost:4000/api/student/payments/by-code \
  -H "Content-Type: application/json" -d '{"code":"<paymentCode>"}'
curl -X POST http://localhost:4000/api/student/payments/quote \
  -H "Content-Type: application/json" -d '{"invoiceId":"...","fromCurrency":"NGN"}'
curl -X POST http://localhost:4000/api/student/payments/generate \
  -H "Content-Type: application/json" -d '{"invoiceId":"...","quoteId":"..."}'
curl -X POST http://localhost:4000/api/student/payments/confirm \
  -H "Content-Type: application/json" -d '{"paymentId":"..."}'

# 6. University checks node balance + its own ledger
curl http://localhost:4000/api/university/<uniId>/balance
curl http://localhost:4000/api/university/<uniId>/ledger
```
