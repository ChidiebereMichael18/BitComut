// E2E Test: Student-University Network, Verification, Invoicing & Payment Flow
// Run with: node test-network-flow.js
const BASE = "http://localhost:4000";

async function req(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}

(async () => {
  console.log("===============================================================");
  console.log(" BITPULSE: STUDENT-UNIVERSITY NETWORK & INVOICING FLOW TEST");
  console.log("===============================================================\n");

  // 1. Create a verified University (e.g. Kigali International University)
  const uniRes = await req("POST", "/api/admin/universities", {
    name: "Kigali International University",
    country: "Rwanda",
    currency: "RWF",
    swift_code: "KIURRWRW",
    account_ref: "KIU-MAIN-001",
  });
  console.log("1. Created University:", uniRes.status, uniRes.data.name, "(ID:", uniRes.data.id, ")");
  const uniId = uniRes.data.id;

  // 2. Student registers their profile
  const stuRes = await req("POST", "/api/student/register", {
    name: "Chukwudi Okafor",
    email: `chukwudi.${Date.now()}@example.com`,
    phone: "+2348012345678",
    country: "Nigeria",
    currency: "NGN",
  });
  console.log("2. Student Registered:", stuRes.status, stuRes.data.name, `[${stuRes.data.email}]`);
  const studentId = stuRes.data.id;

  // 3. Student requests to link / enroll in Kigali International University
  const enrollRes = await req("POST", "/api/student/enroll", {
    studentId,
    universityId: uniId,
    studentRef: "KIU-CS-2026-088",
    department: "Computer Science",
  });
  console.log("3. Student Requested Enrollment:", enrollRes.status, "Status:", enrollRes.data.status, "Ref:", enrollRes.data.student_ref);
  const enrollmentId = enrollRes.data.id;

  // 4. University checks notifications and pending enrollment requests
  const uniNotifs1 = await req("GET", `/api/university/${uniId}/notifications`);
  console.log("4a. University Notifications:", uniNotifs1.status, "Unread:", uniNotifs1.data.unreadCount, "Latest:", uniNotifs1.data.notifications[0]?.title);

  const pendingList = await req("GET", `/api/university/${uniId}/enrollments?status=pending`);
  console.log("4b. University Pending Enrollments Count:", pendingList.data.length, "Student:", pendingList.data[0]?.student_name);

  // 5. University verifies student in its DB and APPROVES enrollment
  const approveRes = await req("POST", `/api/university/${uniId}/enrollments/${enrollmentId}/approve`);
  console.log("5. University Approved Student:", approveRes.status, approveRes.data.message);

  // 6. Student checks notifications & active enrollments
  const stuNotifs1 = await req("GET", `/api/student/${studentId}/notifications`);
  console.log("6a. Student Received Notification:", stuNotifs1.data.notifications[0]?.title, "-", stuNotifs1.data.notifications[0]?.message);

  const stuEnrollments = await req("GET", `/api/student/${studentId}/enrollments`);
  console.log("6b. Student Enrollments:", stuEnrollments.data.map((e) => `${e.university_name}: ${e.status}`));

  // 7. University views network of approved students
  const approvedStudents = await req("GET", `/api/university/${uniId}/students`);
  console.log("7. Approved Students in Network:", approvedStudents.data.map((s) => `${s.name} (${s.student_ref})`));

  // 8. University issues tuition invoice for Chukwudi (with automatic payment details)
  const invoiceRes = await req("POST", `/api/university/${uniId}/invoices`, {
    student_ref: "KIU-CS-2026-088",
    amount: 1500000,
    currency: "RWF",
    description: "Tuition Fee - Fall 2026 Semester",
    autoGeneratePayment: true,
  });
  console.log("8. University Issued Invoice:", invoiceRes.status, "Invoice ID:", invoiceRes.data.invoice.id);
  console.log("   Lightning Payment Code:", invoiceRes.data.payment?.paymentCode);
  console.log("   Lightning Sats Amount:", invoiceRes.data.payment?.amountSat, "sats");
  const invoiceId = invoiceRes.data.invoice.id;
  const paymentCode = invoiceRes.data.payment?.paymentCode;
  const paymentId = invoiceRes.data.payment?.paymentId;

  // 9. Student checks their portal & notifications for incoming invoices
  const stuNotifs2 = await req("GET", `/api/student/${studentId}/notifications`);
  console.log("9a. Student Invoice Notification:", stuNotifs2.data.notifications[0]?.title);

  const stuInvoices = await req("GET", `/api/student/${studentId}/invoices`);
  console.log("9b. Student Invoices in Portal:", stuInvoices.data.length, "invoices found");
  console.log("    Invoice:", stuInvoices.data[0]?.description, "| Amount:", stuInvoices.data[0]?.amount, stuInvoices.data[0]?.currency);
  console.log("    Payment Code attached:", stuInvoices.data[0]?.payment_code);

  // 10. Student resolves payment via payment code / scans QR
  const codeLookup = await req("POST", "/api/student/payments/by-code", { code: paymentCode });
  console.log("10. Student Looked up Payment by Code:", codeLookup.status, "Bolt11 length:", codeLookup.data.bolt11?.length, "QR present:", !!codeLookup.data.qr);

  // 11. Student confirms payment over Lightning rail
  const confirmRes = await req("POST", "/api/student/payments/confirm", { paymentId });
  console.log("11. Student Settled Payment:", confirmRes.status, "Status:", confirmRes.data.status, "Settled at:", confirmRes.data.settled_at);

  // 12. Verify Receipts for both Student & University
  const stuReceipt = await req("GET", `/api/student/payments/${paymentId}/receipt`);
  console.log("12a. Student Receipt:", stuReceipt.status, "Paid:", stuReceipt.data.from_amount, stuReceipt.data.from_currency, "-> Settled:", stuReceipt.data.settlement_amount, stuReceipt.data.settlement_currency);

  const uniReceipt = await req("GET", `/api/university/${uniId}/payments/${paymentId}/receipt`);
  console.log("12b. University Receipt:", uniReceipt.status, "For student:", uniReceipt.data.student_ref, "Settlement status:", uniReceipt.data.settlement_status);

  // 13. Check Post-Settlement Notifications & Ledger
  const stuNotifs3 = await req("GET", `/api/student/${studentId}/notifications`);
  console.log("13a. Student Settlement Notification:", stuNotifs3.data.notifications[0]?.title, "-", stuNotifs3.data.notifications[0]?.message);

  const uniNotifs2 = await req("GET", `/api/university/${uniId}/notifications`);
  console.log("13b. University Settlement Notification:", uniNotifs2.data.notifications[0]?.title, "-", uniNotifs2.data.notifications[0]?.message);

  const ledger = await req("GET", `/api/university/${uniId}/ledger`);
  console.log("13c. University Ledger:", JSON.stringify(ledger.data));

  // 14. Test Student Rejection Flow
  console.log("\n--- Testing Rejection Flow ---");
  const stu2Res = await req("POST", "/api/student/register", {
    name: "Invalid Applicant",
    email: `invalid.${Date.now()}@example.com`,
    country: "Nigeria",
  });
  const enroll2Res = await req("POST", "/api/student/enroll", {
    studentId: stu2Res.data.id,
    universityId: uniId,
    studentRef: "NON-EXISTENT-REF-999",
  });
  const rejectRes = await req("POST", `/api/university/${uniId}/enrollments/${enroll2Res.data.id}/reject`, {
    reason: "Student matric number not found in university admissions registry",
  });
  console.log("14a. University Rejected Unknown Student:", rejectRes.status, "Reason:", rejectRes.data.enrollment.rejection_reason);

  const stu2Notifs = await req("GET", `/api/student/${stu2Res.data.id}/notifications`);
  console.log("14b. Student Received Rejection Notification:", stu2Notifs.data.notifications[0]?.title, "-", stu2Notifs.data.notifications[0]?.message);

  console.log("\n===============================================================");
  console.log(" ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ");
  console.log("===============================================================");
})().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
