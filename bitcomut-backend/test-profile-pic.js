// Live test: profile picture upload endpoint + static serving.
//
// Verifies file upload (multipart), persistence on students & universities,
// static serving of the uploaded file, and validation rules.
//
// Run with: node test-profile-pic.js
const BASE = "http://localhost:4000";

// Minimal valid 1x1 transparent PNG.
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const pngBuffer = Buffer.from(PNG_B64, "base64");

async function req(method, path, body) {
  const isForm = body instanceof FormData;
  const r = await fetch(BASE + path, {
    method,
    headers: !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}

function upload(kind, id, { invalidMime = false, noField = false } = {}) {
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("id", id);
  if (!noField) fd.append("profile_pic", new Blob([pngBuffer], { type: invalidMime ? "text/plain" : "image/png" }), "pic.png");
  return req("POST", "/api/upload/profile-pic", fd);
}

const stamp = Date.now();
let failures = 0;
function check(label, ok, extra) {
  console.log(`   ${ok ? "PASS" : "FAIL"} : ${label}${extra ? "  [" + extra + "]" : ""}`);
  if (!ok) failures++;
}

(async () => {
  console.log("===============================================================");
  console.log(" BITPULSE: PROFILE PICTURE UPLOAD LIVE TEST");
  console.log("===============================================================\n");

  // --- Student flow ---
  console.log("1. Student profile picture:");
  const stu = await req("POST", "/api/student/register", {
    name: "Pic Student", email: `pic.stu.${stamp}@example.com`, country: "Rwanda", currency: "RWF",
  });
  const stuUp = await upload("student", stu.data.id);
  check("upload -> 200 with url", stuUp.status === 200 && !!stuUp.data?.url, `status=${stuUp.status} url=${stuUp.data?.url}`);
  check("url ends with /uploads/…png", /\/uploads\/.+\.png$/.test(stuUp.data?.url || ""), stuUp.data?.url);

  const grilled = await req("GET", `/api/student/${stu.data.id}/profile`);
  check("student profile now has profile_pic", grilled.data?.profile_pic === stuUp.data?.url, grilled.data?.profile_pic);

  const fetched = await fetch(BASE + new URL(stuUp.data.url).pathname, { method: "GET" });
  check("uploaded file is served (200) with image/png", fetched.status === 200 && (fetched.headers.get("content-type") || "").startsWith("image/png"), `status=${fetched.status} type=${fetched.headers.get("content-type")}`);

  // --- University flow ---
  console.log("2. University profile picture:");
  const uni = await req("POST", "/api/admin/universities", { name: `Pic Univ ${stamp}`, country: "Rwanda", currency: "RWF" });
  const uniUp = await upload("university", uni.data.id);
  check("upload -> 200", uniUp.status === 200 && !!uniUp.data?.url, `status=${uniUp.status}`);

  const unis = await req("GET", "/api/admin/universities");
  const inList = (unis.data || []).find((u) => u.id === uni.data.id);
  check("university in admin list has profile_pic", inList?.profile_pic === uniUp.data?.url, inList?.profile_pic);

  // --- JSON URL field on register/create ---
  console.log("3. profile_pic set directly via JSON:");
  const stuJson = await req("POST", "/api/student/register", {
    name: "Json Pic", email: `pic.json.${stamp}@example.com`, country: "Kenya", currency: "KES",
    profile_pic: "https://example.com/avatar.png",
  });
  check("student register with profile_pic URL -> stored", stuJson.data?.profile_pic === "https://example.com/avatar.png", stuJson.data?.profile_pic);

  // --- Validation ---
  console.log("4. Validation:");
  const noField = await upload("student", stu.data.id, { noField: true });
  check("missing file -> 400", noField.status === 400, `status=${noField.status}`);
  const badMime = await upload("student", stu.data.id, { invalidMime: true });
  check("non-image file -> 400", badMime.status === 400, `status=${badMime.status}`);

  const badKind = await upload("mom", stu.data.id);
  check("invalid kind -> 400", badKind.status === 400, `status=${badKind.status}`);

  const missing = await upload("student", "00000000-0000-0000-0000-000000000000");
  check("unknown owner id -> 404", missing.status === 404, `status=${missing.status}`);

  // --- Cross-check: registers (upsert) keeps profile_pic update too ---
  console.log("5. Upsert keeps profile_pic on re-register:");
  const reReg = await req("POST", "/api/student/register", {
    name: "Pic Student Updated", email: `pic.stu.${stamp}@example.com`, country: "Rwanda", currency: "RWF",
  });
  check("same email re-register keeps uploaded profile_pic", reReg.data?.profile_pic === stuUp.data?.url, reReg.data?.profile_pic);

  console.log(`\n===============================================================`);
  console.log(failures === 0 ? " PROFILE-PIC TESTS PASSED" : ` FAILURES: ${failures}`);
  console.log("===============================================================");
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("TEST ERROR:", e); process.exit(1); });
