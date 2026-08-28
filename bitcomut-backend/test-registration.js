// Live test: Registration flows for Universities (admin) and Students.
//
// Covers validation, defaults, input normalization, optional fields, and the
// student email upsert (re-registration must not create duplicates).
//
// Run with: node test-registration.js
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

// ===========================================================================
// UNIVERSITIES
// ===========================================================================
async function testUniversities() {
  console.log("=========================== UNIVERSITIES ===========================");

  // 1. Valid full registration (RWF + optional fields)
  const full = await req("POST", "/api/admin/universities", {
    name: `Uni Full ${stamp}`, country: "Rwanda", currency: "RWF",
    swift_code: "RWFRWRW", account_ref: "RWF-ACC-001",
  });
  let ok = full.status === 201 && full.data.is_verified === true && full.data.currency === "RWF"
        && full.data.swift_code === "RWFRWRW" && full.data.account_ref === "RWF-ACC-001";
  console.log(`${ok ? "PASS" : "FAIL"}: full uni registration → 201, verified=true, currency/swift/account kept (${full.status})`);
  if (!ok) console.log("      body:", JSON.stringify(full.data));

  // 2. Valid registration with a non-RWF African currency (KES)
  const kes = await req("POST", "/api/admin/universities", {
    name: `Uni KES ${stamp}`, country: "Kenya", currency: "KES",
  });
  ok = kes.status === 201 && kes.data.currency === "KES";
  console.log(`${ok ? "PASS" : "FAIL"}: uni registration with KES (non-RWF) → 201 (${kes.status})`);

  // 3. Missing required fields → 400
  let miss = await req("POST", "/api/admin/universities", { name: "NoCountry", currency: "RWF" });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'country' → 400 (${miss.status})`);
  miss = await req("POST", "/api/admin/universities", { country: "NoName", currency: "RWF" });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'name' → 400 (${miss.status})`);
  miss = await req("POST", "/api/admin/universities", { name: "NoCur", country: "Rwanda" });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'currency' → 400 (${miss.status})`);

  // 4. Empty-string required → 400
  const empty = await req("POST", "/api/admin/universities", { name: "", country: "Rwanda", currency: "RWF" });
  console.log(`${empty.status === 400 ? "PASS" : "FAIL"}: empty 'name' → 400 (${empty.status})`);

  // 5. Registered university is visible to students (is_verified list)
  const list = await req("GET", "/api/student/universities");
  ok = list.data.some((u) => u.name === `Uni Full ${stamp}`);
  console.log(`${ok ? "PASS" : "FAIL"}: registered uni appears in student-facing verified list`);

  // 6. Admin sees it too
  const adminList = await req("GET", "/api/admin/universities");
  ok = adminList.data.some((u) => u.name === `Uni Full ${stamp}`);
  console.log(`${ok ? "PASS" : "FAIL"}: registered uni appears in admin list`);
}

// ===========================================================================
// STUDENTS
// ===========================================================================
async function testStudents() {
  console.log("\n============================= STUDENTS =============================");

  // 1. Valid full registration
  const email = `reg.live.${stamp}@example.com`;
  const full = await req("POST", "/api/student/register", {
    name: "Live Test Student", email, phone: "+250700000000",
    country: "Nigeria", currency: "NGN",
  });
  let ok = full.status === 201 && full.data.email === email && full.data.currency === "NGN"
        && full.data.phone === "+250700000000";
  console.log(`${ok ? "PASS" : "FAIL"}: full student registration → 201 (${full.status})`);

  // 2. Default currency = NGN when omitted
  const def = await req("POST", "/api/student/register", {
    name: "Default Cur", email: `reg.def.${stamp}@example.com`, country: "Kenya",
  });
  ok = def.status === 201 && def.data.currency === "NGN";
  console.log(`${ok ? "PASS" : "FAIL"}: default currency = NGN when omitted (${def.data.currency})`);

  // 3. Currency uppercased automatically ("ghs" -> "GHS")
  const upper = await req("POST", "/api/student/register", {
    name: "Upper Cur", email: `reg.up.${stamp}@example.com`, country: "Ghana", currency: "ghs",
  });
  ok = upper.status === 201 && upper.data.currency === "GHS";
  console.log(`${ok ? "PASS" : "FAIL"}: currency uppercased 'ghs'->'GHS' (${upper.data.currency})`);

  // 4. Email lowercased + trimmed ("  FOO@Bar.COM  " -> "foo@bar.com")
  const norm = await req("POST", "/api/student/register", {
    name: "Norm Email", email: `  Reg.Norm.${stamp}@Example.COM  `, country: "Uganda",
  });
  ok = norm.status === 201 && norm.data.email === `reg.norm.${stamp}@example.com`;
  console.log(`${ok ? "PASS" : "FAIL"}: email trimmed+lowercased (got '${norm.data.email}')`);

  // 5. Missing required → 400
  let miss = await req("POST", "/api/student/register", { email: `x${stamp}@e.com`, country: "Nigeria" });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'name' → 400 (${miss.status})`);
  miss = await req("POST", "/api/student/register", { name: "NoMail", country: "Nigeria" });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'email' → 400 (${miss.status})`);
  miss = await req("POST", "/api/student/register", { name: "NoCountry", email: `y${stamp}@e.com` });
  console.log(`${miss.status === 400 ? "PASS" : "FAIL"}: missing 'country' → 400 (${miss.status})`);

  // 6. Duplicate email = UPSERT (same id, fields updated, no duplicate row)
  const dup1 = await req("POST", "/api/student/register", {
    name: "Original", email, country: "Nigeria", currency: "NGN", phone: "+250111",
  });
  const dup2 = await req("POST", "/api/student/register", {
    name: "Updated Name", email, country: "Rwanda", currency: "RWF", phone: "+250222",
  });
  ok = dup1.status === 201 && dup2.status === 201 && dup1.data.id === dup2.data.id
    && dup2.data.name === "Updated Name" && dup2.data.currency === "RWF" && dup2.data.phone === "+250222";
  console.log(`${ok ? "PASS" : "FAIL"}: re-register same email → UPSERT (same id=${dup1.data.id===dup2.data.id}, fields updated)`);

  // 7. Profile retrievable
  const profile = await req("GET", `/api/student/${full.data.id}/profile`);
  ok = profile.status === 200 && profile.data.email === email && profile.data.id === full.data.id;
  console.log(`${ok ? "PASS" : "FAIL"}: student profile retrievable via /:id/profile (${profile.status})`);

  return {
    id: full.data.id,
    email,
    dupId: dup2.data.id,
    normEmail: norm.data.email,
  };
}

(async () => {
  console.log("===============================================================");
  console.log(" BITPULSE: REGISTRATION LIVE TEST (universities + students)");
  console.log("===============================================================\n");

  await testUniversities();
  const stu = await testStudents();

  let failures = 0;
  console.log("\n===============================================================");
  console.log(" DONE — see PASS/FAIL indicators above. Final ids:");
  console.log(`   student id=${stu.id.slice(0,8)} (email ${stu.email}) upsert-id=${stu.dupId.slice(0,8)} norm-email=${stu.normEmail}`);
  console.log("===============================================================");
})().catch((e) => { console.error("TEST ERROR:", e); process.exit(1); });
