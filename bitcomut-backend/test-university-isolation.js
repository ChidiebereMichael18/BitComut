// Isolation / scoping test: University A must NOT be able to see
// University B's data (students, enrollments, invoices, payments, receipts,
// conversions, settlements, ledger), and vice-versa.
//
// Run with: node test-university-isolation.js
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

let failures = 0;
function check(label, ok) {
  console.log(`   ${ok ? "PASS" : "LEAK/FAIL"} : ${label}`);
  if (!ok) failures++;
}

// Set up a university with one approved student + a settled payment.
async function setupUni(uniName, currency, studentName, studentRef, amount) {
  const uni = await req("POST", "/api/admin/universities", {
    name: `${uniName} ${Date.now()}${Math.random().toString(36).slice(2,6)}`,
    country: "Rwanda", currency, swift_code: "X" + currency, account_ref: currency + "-ACC",
  });
  const stu = await req("POST", "/api/student/register", {
    name: studentName, email: `iso.${studentName}.${Date.now()}${Math.random().toString(36).slice(2,6)}@example.com`,
    country: "Nigeria", currency: "NGN",
  });
  const enroll = await req("POST", "/api/student/enroll", {
    studentId: stu.data.id, universityId: uni.data.id, studentRef,
  });
  await req("POST", `/api/university/${uni.data.id}/enrollments/${enroll.data.id}/approve`);
  const inv = await req("POST", `/api/university/${uni.data.id}/invoices`, {
    student_ref: studentRef, amount, currency, description: `Tuition ${uniName}`, autoGeneratePayment: true,
  });
  const paymentId = inv.data.payment.paymentId;
  const paymentCode = inv.data.payment.paymentCode;
  await req("POST", "/api/student/payments/confirm", { paymentId });
  return { uniId: uni.data.id, studentId: stu.data.id, studentRef, paymentId, paymentCode, invoiceId: inv.data.invoice.id };
}

(async () => {
  console.log("===============================================================");
  console.log(" BITPULSE: UNIVERSITY DATA-ISOLATION LIVE TEST");
  console.log(" (Uni A must not see Uni B's records, and vice-versa)");
  console.log("===============================================================\n");

  // Two fully-provisioned, unrelated universities.
  const A = await setupUni("University Alpha", "RWF", "Ada Alpha", "ALPHA-001", 600000);
  const B = await setupUni("University Beta", "KES", "Ben Beta", "BETA-001", 100000);
  // A third university so we can also test that a completely separate one is blocked.
  const C = await setupUni("University Gamma", "GHS", "Cee Gamma", "GAMMA-001", 3000);

  console.log(`Setup: UniA=${A.uniId.slice(0,8)} UniB=${B.uniId.slice(0,8)} UniC=${C.uniId.slice(0,8)}`);
  console.log(`       A payment=${A.paymentId.slice(0,8)} B payment=${B.paymentId.slice(0,8)}\n`);

  // ============ 1. University-scoped list endpoints ============
  console.log("1. Scoped LIST endpoints (should return only own data):");
  const aStudents = await req("GET", `/api/university/${A.uniId}/students`);
  const bStudents = await req("GET", `/api/university/${B.uniId}/students`);
  check("A sees only its own student (no B/C student names)", aStudents.data.every((s) => !/Beta|Gamma/.test(s.name)));
  check("B sees only its own student (no A/C student names)", bStudents.data.every((s) => !/Alpha|Gamma/.test(s.name)));

  const aEnroll = await req("GET", `/api/university/${A.uniId}/enrollments`);
  check("A enrollments contain no B/C refs", aEnroll.data.every((e) => e.student_ref.startsWith("ALPHA")));

  const aPayments = await req("GET", `/api/university/${A.uniId}/payments`);
  check("A payments exclude B's tx (by student ref)", aPayments.data.every((p) => p.student_ref.startsWith("ALPHA")));

  const aLedger = await req("GET", `/api/university/${A.uniId}/ledger`);
  check("A ledger reflects only A settlement", String(aLedger.data.settled) === "600000.00000000");

  const aSettlements = await req("GET", `/api/university/${A.uniId}/settlements`);
  check("A settlements are A-only", aSettlements.data.every((s) => s.student_ref.startsWith("ALPHA")));

  // ============ 2. Scoped lookup endpoints (should 404 cross-uni) ============
  console.log("\n2. Scoped LOOKUP endpoints (cross-uni must be blocked):");
  const aCode = A.paymentCode;
  const crossCode = await req("GET", `/api/university/${B.uniId}/payments/by-code/${aCode}`);
  check("B cannot look up A's payment by code (expect 404)", crossCode.status === 404);

  // Verify same code IS visible within own university
  const ownCode = await req("GET", `/api/university/${A.uniId}/payments/by-code/${aCode}`);
  check("A CAN look up its own payment by code (expect 200)", ownCode.status === 200);

  // ============ 3. NOTIFICATIONS are scoped ============
  console.log("\n3. Notifications isolation:");
  const aNotif = await req("GET", `/api/university/${A.uniId}/notifications`);
  const bNotif = await req("GET", `/api/university/${B.uniId}/notifications`);
  check("No cross-university notification received", !aNotif.data.notifications.some((n) => /Beta/.test(JSON.stringify(n))));
  check("No cross-university notification received (B)", !bNotif.data.notifications.some((n) => /Alpha/.test(JSON.stringify(n))));

  // ============ 4. Pay by code is student-global (expected behavior) ============
  console.log("\n4. Student student-global pay-by-code (expected: any valid code resolves):");
  const globalCode = await req("POST", "/api/student/payments/by-code", { code: aCode });
  check("Student can resolve a valid code (platform-wide, by design)", globalCode.status === 200 && !!globalCode.data.bolt11);

  // ============ 5. THE TWO SUSPECT LEAKS: receipt + conversion ============
  console.log("\n5. Cross-university RECEIPT & CONVERSION (by known foreign paymentId):");
  const foreignReceipt = await req("GET", `/api/university/${B.uniId}/payments/${A.paymentId}/receipt`);
  check("B cannot read A's receipt (expect 404/blocked)", foreignReceipt.status !== 200);

  const foreignConversion = await req("GET", `/api/university/${B.uniId}/payments/${A.paymentId}/conversion`);
  check("B cannot read A's payment conversion (expect 404/blocked)", foreignConversion.status !== 200);

  // ============ 6. Cross-university 'wrong uni' approve/reject ============
  console.log("\n6. Cross-university approve/reject must be blocked:");
  const otherEnroll = await req("GET", `/api/university/${A.uniId}/enrollments`);
  const aEnrollId = otherEnroll.data.find((e) => e.student_ref.startsWith("ALPHA"))?.id;
  const BApprovesA = await req("POST", `/api/university/${B.uniId}/enrollments/${aEnrollId}/approve`);
  check("B cannot approve A's enrollment (expect 404)", BApprovesA.status === 404);

  console.log(`\n===============================================================`);
  console.log(failures === 0 ? " ISOLATION TEST PASSED — NO CROSS-UNIVERSITY LEAKS" : ` ISOLATION FAILURES: ${failures} leak(s) found`);
  console.log("===============================================================");
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("TEST ERROR:", e); process.exit(1); });
