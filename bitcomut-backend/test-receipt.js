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
  const uni = await post("/api/admin/universities", {
    name: "Rwanda National University", country: "Rwanda", currency: "RWF", swift_code: "RNURRWRW", account_ref: "RNU-9",
  });
  const inv = await post(`/api/admin/universities/${uni.id}/invoices`, {
    student_ref: "STU-NG-050", amount: 2600000, currency: "RWF", description: "Semester 2026 tuition",
  });
  const q = await post("/api/student/payments/quote", { invoiceId: inv.id, fromCurrency: "NGN" });
  const g = await post("/api/student/payments/generate", { invoiceId: inv.id, quoteId: q.quote.id });
  await post("/api/student/payments/confirm", { paymentId: g.paymentId });

  // STUDENT RECEIPT
  const rec = await get(`/api/student/payments/${g.paymentId}/receipt`);
  console.log("=== STUDENT RECEIPT ===");
  console.log(JSON.stringify(rec, null, 2));

  // UNIVERSITY RECEIPT (must match shape)
  const urec = await get(`/api/university/${uni.id}/payments/${g.paymentId}/receipt`);
  console.log("\n=== UNIVERSITY RECEIPT (keys present) ===");
  const need = [
    "payment_id", "tx_reference", "payment_status", "payment_method",
    "invoice_id", "student_ref", "invoice_amount", "invoice_currency",
    "settlement_id", "settlement_amount", "settlement_currency", "settlement_status",
    "university_id", "university_name", "btc_rate", "fx_usd_rate", "from_amount", "btc_amount",
  ];
  const missing = need.filter((k) => !(k in rec));
  console.log("missing keys:", missing.length ? missing : "NONE");
  if (missing.length) process.exitCode = 1;

  console.log("\npayment_id       :", urec.payment_id);
  console.log("invoice_id       :", urec.invoice_id);
  console.log("settlement_id    :", urec.settlement_id);
  console.log("settlement  :", urec.settlement_amount, urec.settlement_currency, "=>", urec.settlement_status);
  console.log("student_ref      :", urec.student_ref, "| university:", urec.university_name);
  console.log("paid :", urec.from_amount, urec.from_currency, "| btc:", urec.btc_amount, "| rate:", urec.btc_rate);

  // UNIVERSITY incoming payments list now includes settlement linkage
  const up = await get(`/api/university/${uni.id}/payments`);
  console.log("\n=== UNIVERSITY PAYMENTS LIST (with settlement) ===");
  up.forEach((p) =>
    console.log(p.tx_reference, "| inv:", p.invoice_id, "| settlement:", p.settlement_id, "| status:", p.status)
  );
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
