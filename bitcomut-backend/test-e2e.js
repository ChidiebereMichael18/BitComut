const BASE = "http://localhost:4000";

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(path + " -> " + res.status + " " + (await res.text()));
  return res.json();
}
async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(path + " -> " + res.status + " " + (await res.text()));
  return res.json();
}

(async () => {
  // Admin: university + invoice
  const uni = await post("/api/admin/universities", {
    name: "Kigali University",
    country: "Rwanda", currency: "RWF", swift_code: "KIGALRWRW", account_ref: "KU-0001",
  });
  const inv = await post(`/api/admin/universities/${uni.id}/invoices`, {
    student_ref: "STU-NG-002", amount: 2600000, currency: "RWF", description: "Tuition 2026",
  });
  console.log("university:", uni.name, uni.id);
  console.log("invoice:", inv.id, inv.amount, inv.currency);

  // Student: locked FX quote (pay NGN for RWF invoice)
  const q = await post("/api/student/payments/quote", {
    invoiceId: inv.id, fromCurrency: "NGN",
  });
  console.log("\n--- LOCKED QUOTE ---");
  console.log("quote_id:", q.quote.id);
  console.log("btc_rate (BTC per NGN):", q.quote.btc_rate);
  console.log("btc_amount:", q.quote.btc_amount);
  console.log("expires_at:", q.quote.expires_at);
  console.log("status:", q.quote.status);

  // Student: generate Lightning payment
  const g = await post("/api/student/payments/generate", { invoiceId: inv.id, quoteId: q.quote.id });
  console.log("\n--- LIGHTNING PAYMENT GENERATED ---");
  console.log("payment_id:", g.paymentId);
  console.log("tx_reference:", g.txReference);
  console.log("payment_request:", g.invoice.paymentRequest);
  console.log("payment_hash:", g.invoice.paymentHash);

  // Student: confirm payment (rail settles)
  const c = await post("/api/student/payments/confirm", { paymentId: g.paymentId });
  console.log("\n--- SETTLEMENT ---");
  console.log("settlement status:", c.status, "settled_at:", c.settled_at);

  // Student: receipt
  const rec = await get(`/api/student/payments/${g.paymentId}/receipt`);
  console.log("\n--- RECEIPT ---");
  console.log("tx:", rec.tx_reference, "| paid", rec.from_amount, rec.from_currency, "-> BTC", rec.btc_amount, "-> university", rec.university_name);
  console.log("btc_rate:", rec.btc_rate, "| status:", rec.payment_status, "| settlement:", rec.settlement_status, rec.settlement_amount, rec.settlement_currency);

  // University dashboard
  const up = await get(`/api/university/${uni.id}/payments`);
  console.log("\n--- UNIVERSITY PAYMENTS ---");
  up.forEach((p) => console.log(p.tx_reference, p.status, p.invoice_currency, p.invoice_amount, "from", p.from_currency, p.from_amount));

  const conv = await get(`/api/university/${uni.id}/payments/${g.paymentId}/conversion`);
  console.log("\n--- FIAT/BTC CONVERSION ---");
  console.log(conv);

  const sett = await get(`/api/university/${uni.id}/settlements`);
  console.log("\n--- SETTLEMENTS ---");
  sett.forEach((s) => console.log(s.status, s.currency, s.amount, "for", s.tx_reference));

  // Admin audit trail
  const audit = await get("/api/admin/audit?limit=20");
  console.log("\n--- AUDIT LOG (last 6) ---");
  audit.slice(0, 6).forEach((a) => console.log(a.action, a.entity, "->", a.actor));
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
