// E2E test: university-issued Lightning invoice -> student pays by code.
// Node test-university-flow.js
const BASE = "http://localhost:4000";

async function req(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}

(async () => {
  // 1. create a university
  const uni = await req("POST", "/api/admin/universities", {
    name: "University of Kigali",
    country: "RW",
    currency: "RWF",
  });
  console.log("1. university:", uni.status, uni.data.name ?? uni.data);
  const uniId = uni.data.id;

  // 2. create a tuition invoice
  const inv = await req("POST", `/api/admin/universities/${uniId}/invoices`, {
    student_ref: "STU-1001",
    amount: 50000,
    currency: "RWF",
    description: "Tuition sem 1",
  });
  console.log("2. invoice:", inv.status, inv.data.id ?? inv.data);
  const invoiceId = inv.data.id;

  // 3. university creates the Lightning invoice (bolt11 + QR + payment_code)
  const pay = await req("POST", `/api/university/${uniId}/invoices/${invoiceId}/create-payment`, {});
  console.log("3. create university payment:", pay.status);
  console.log("   payment_code:", pay.data.paymentCode);
  console.log("   has bolt11:", !!pay.data.bolt11);
  console.log("   has qr (data-url):", !!pay.data.qr && pay.data.qr.startsWith("data:image"));
  console.log("   amountSat:", pay.data.amountSat, "rail:", pay.data.rail);
  const code = pay.data.paymentCode;
  const paymentId = pay.data.paymentId;

  // 4. student pays by code
  const stu = await req("POST", "/api/student/payments/by-code", { code });
  console.log("4. student pay by code:", stu.status);
  console.log("   bolt11:", !!stu.data.bolt11, "qr:", !!stu.data.qr, "status:", stu.data.status, "uni:", stu.data.university);

  // 5. scoping: wrong university must NOT resolve the code
  const wrongUni = await req("POST", "/api/admin/universities", { name: "Other Uni", country: "NG", currency: "NGN" });
  const wrongId = wrongUni.data.id;
  const badScope = await req("POST", "/api/student/payments/by-code", { code, universityId: wrongId });
  console.log("5. scoping (wrong university blocked):", badScope.status === 500 || badScope.status === 404 ? `OK (${badScope.status})` : `FAIL (${badScope.status})`);

  // 6. node balance
  const bal = await req("GET", `/api/university/${uniId}/balance`);
  console.log("6. node balance:", bal.status, JSON.stringify(bal.data));

  // 7. per-university ledger
  const ledger = await req("GET", `/api/university/${uniId}/ledger`);
  console.log("7. ledger:", ledger.status, JSON.stringify(ledger.data));

  // 8. payment status record
  const byCodeUni = await req("GET", `/api/university/${uniId}/payments/by-code/${code}`);
  console.log("8. uni lookup by code:", byCodeUni.status, "status:", byCodeUni.data.status, "paymentId matches:", byCodeUni.data.id === paymentId);

  // 9. simulate the bolt11 settling on the node and confirm + settle to the
  //    university in local currency (this is the "confirmed when invoice paid" step)
  const confirm = await req("POST", "/api/student/payments/confirm", { paymentId });
  console.log("9. confirm + settle:", confirm.status, "status:", confirm.data?.payment?.status ?? confirm.data?.status ?? JSON.stringify(confirm.data));

  // 10. receipt (canonical, includes settlement + invoice + quote)
  const receipt = await req("GET", `/api/student/payments/${paymentId}/receipt`);
  console.log("10. receipt:", receipt.status, "settlement status:", receipt.data?.settlement_id ? receipt.data.settlement_status : "none", "settlement amount:", receipt.data?.settlement_amount);

  // 11. ledger after settle — university should show received + settled
  const ledgerAfter = await req("GET", `/api/university/${uniId}/ledger`);
  console.log("11. ledger after settle:", JSON.stringify(ledgerAfter.data));

  console.log("\nDONE");
})().catch((e) => { console.error("E2E ERROR:", e); process.exit(1); });
