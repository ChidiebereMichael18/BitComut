// Live test: Bitcoin as a currency & Lightning settlement of BTC amounts.
//
// Verifies that an invoice can be denominated in BTC and that students can pay
// in BTC (or fiat that auto-converts to BTC) — all settling over Lightning.
//
// Run with: node test-bitcoin-currency.js
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

const stamp = Date.now();
let failures = 0;
function check(label, ok, extra) {
  console.log(`   ${ok ? "PASS" : "FAIL"} : ${label}${extra ? "  [" + extra + "]" : ""}`);
  if (!ok) failures++;
}

(async () => {
  console.log("===============================================================");
  console.log(" BITPULSE: BITCOIN-CURRENCY & LIGHTNING SETTLEMENT LIVE TEST");
  console.log("===============================================================\n");

  // 1. BTC is a supported FX target (1 BTC = 1 BTC)
  console.log("1. BTC as an FX currency:");
  const rates = await req("GET", "/api/admin/rates?currency=BTC");
  check("rates?currency=BTC -> 200", rates.status === 200, JSON.stringify(rates.data));
  check("fiatPerBtc(BTC) === 1", rates.data?.fiatPerBtc === 1, `fiatPerBtc=${rates.data?.fiatPerBtc}`);

  // 2. University registered with BTC currency
  console.log("\n2. Register university with currency=BTC:");
  const uni = await req("POST", "/api/admin/universities", {
    name: `Bitcoin Univ ${stamp}`, country: "Rwanda", currency: "BTC",
    swift_code: "BTCRWRW", account_ref: "BTC-MAIN",
  });
  check("BTC university registers -> 201, currency=BTC", uni.status === 201 && uni.data.currency === "BTC");

  // 3. BTC-denominated invoice + auto Lightning payment
  console.log("\n3. BTC-denominated invoice with auto Lightning payment:");
  const btcAmt = 0.001; // 0.001 BTC = 100_000 sats
  const inv = await req("POST", `/api/university/${uni.data.id}/invoices`, {
    student_ref: "BTC-STU-001", amount: btcAmt, currency: "BTC",
    description: "Bitcoin-denominated semester", autoGeneratePayment: true,
  });
  check("BTC invoice created + auto-payment -> 201", inv.status === 201, `status=${inv.status}`);
  const pr = inv.data.payment;
  const expectedSats = Math.round(btcAmt * 100_000_000);
  check("Lightning sats == 0.001 BTC (100000 sats)", pr?.amountSat === expectedSats, `amountSat=${pr?.amountSat} expected=${expectedSats}`);
  check("bolt11 payment request generated", !!pr?.bolt11, pr?.bolt11?.slice(0, 20) + "...");
  check("payment code + QR present", !!pr?.paymentCode && !!pr?.qr);

  // 4. Student pays the BTC invoice by code and settles over Lightning
  console.log("\n4. Settle the BTC invoice over Lightning (pay by code):");
  const bycode = await req("POST", "/api/student/payments/by-code", { code: pr.paymentCode });
  check("student resolves payment by code -> 200", bycode.status === 200);
  const confirm = await req("POST", "/api/student/payments/confirm", { paymentId: pr.paymentId });
  check("payment settled over Lightning -> completed", confirm.data?.status === "completed", `status=${confirm.data?.status}`);
  const receipt = await req("GET", `/api/student/payments/${pr.paymentId}/receipt`);
  check("receipt shows BTC amount", receipt.data?.btc_amount, `btc=${receipt.data?.btc_amount}`);

  // 5. Student whose payment currency is BTC pays a FIAT (RWF) invoice
  console.log("\n5. Student (currency=BTC) pays a fiat RWF invoice:");
  const fiatUni = await req("POST", "/api/admin/universities", {
    name: `Fiat Univ ${stamp}`, country: "Rwanda", currency: "RWF",
  });
  const fiatInv = await req("POST", `/api/university/${fiatUni.data.id}/invoices`, {
    student_ref: "FIAT-001", amount: 50000, currency: "RWF", description: "fiat sem",
  });
  const btcStudent = await req("POST", "/api/student/register", {
    name: "BTC Payer", email: `btcpay.${stamp}@example.com`, country: "Rwanda", currency: "BTC",
  });
  const quote = await req("POST", "/api/student/payments/quote", {
    invoiceId: fiatInv.data.invoice.id, fromCurrency: "BTC",
  });
  check("student paying in BTC gets a quote -> 200", quote.status === 200, JSON.stringify(quote.data?.quote?.btc_amount));
  check("quote from_currency is BTC", quote.data?.quote?.from_currency === "BTC");

  console.log(`\n===============================================================`);
  console.log(failures === 0 ? " BITCOIN-CURRENCY TESTS PASSED — BTC invoice + Lightning settlement work" : ` FAILURES: ${failures}`);
  console.log("===============================================================");
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("TEST ERROR:", e); process.exit(1); });
