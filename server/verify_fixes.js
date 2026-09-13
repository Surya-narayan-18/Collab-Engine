/**
 * Verification test for Bug #1 and Bug #2 fixes — v2
 */
const { io: ioClient } = require("socket.io-client");
const BASE = "http://localhost:5000";

let testCount = 0, passCount = 0, failCount = 0;
function record(test, expected, actual, pass, details = "") {
  testCount++;
  if (pass) passCount++; else failCount++;
  console.log(`${pass ? "✅" : "❌"} ${test}`);
  if (!pass) console.log(`   Expected: ${expected} | Actual: ${actual}${details ? " | " + details : ""}`);
}

async function req(method, path, body, token) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body != null && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data; try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const s = ioClient(BASE, { auth: { token }, transports: ["websocket"], reconnection: false, timeout: 5000 });
    const t = setTimeout(() => { s.disconnect(); reject(new Error("timeout")); }, 8000);
    s.on("connect", () => { clearTimeout(t); resolve(s); });
    s.on("connect_error", (e) => { clearTimeout(t); reject(e); });
  });
}

const TS = Date.now();

async function run() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  VERIFICATION TEST v2 — Bug #1 & Bug #2 Fixes");
  console.log("═══════════════════════════════════════════════════\n");

  // Setup
  const u1R = await req("POST", "/api/auth/register", {
    email: `v2a_${TS}@t.com`, userId: `v2a_${TS}`, userName: "V2A", password: "SecurePass123!"
  });
  const u1 = { token: u1R.data?.data?.token, ...u1R.data?.data?.user };
  await sleep(500);
  const u2R = await req("POST", "/api/auth/register", {
    email: `v2b_${TS}@t.com`, userId: `v2b_${TS}`, userName: "V2B", password: "SecurePass456!"
  });
  const u2 = { token: u2R.data?.data?.token, ...u2R.data?.data?.user };
  await sleep(500);
  const u3R = await req("POST", "/api/auth/register", {
    email: `v2c_${TS}@t.com`, userId: `v2c_${TS}`, userName: "V2C", password: "SecurePass789!"
  });
  const u3 = { token: u3R.data?.data?.token, ...u3R.data?.data?.user };

  if (!u1.token || !u2.token || !u3.token) { console.error("FATAL: reg failed"); process.exit(1); }

  const wsR = await req("POST", "/api/workspaces", { name: `V2WS-${TS}` }, u1.token);
  const ws = wsR.data?.data?.workspace;
  const invR = await req("POST", `/api/workspaces/${ws.id}/members`, { email: u2.email }, u1.token);
  await req("POST", `/api/workspaces/invitations/${invR.data.data.invitation.id}/accept`, null, u2.token);
  const chR = await req("GET", `/api/workspaces/${ws.id}/channels`, null, u1.token);
  const ch = chR.data?.data?.channels?.find(c => c.name === "general");
  const joinRes = await req("POST", `/api/workspaces/${ws.id}/channels/${ch.id}/join`, null, u2.token);
  console.log("Channel join u2:", joinRes.status, joinRes.data?.message || "OK");
  console.log("Setup done.\n");

  // ══════════════════════════════════════════════════
  // BUG #1: Typing — use persistent sockets for member tests
  // ══════════════════════════════════════════════════
  console.log("── Bug #1: Typing Authorization ──────────────────\n");

  // Connect once, reuse for member tests
  const s1 = await connectSocket(u1.token);
  const s2 = await connectSocket(u2.token);
  s1.on("error", e => console.log("  [s1 error]", JSON.stringify(e)));
  s2.on("error", e => console.log("  [s2 error]", JSON.stringify(e)));

  // Join channel rooms
  s1.emit("join:channel", ch.id);
  s2.emit("join:channel", ch.id);
  await sleep(2000); // Wait for async DB queries on server

  // Test 1: Member typing:start
  {
    let received = null;
    s2.once("typing:update", (d) => { received = d; });
    s1.emit("typing:start", ch.id);
    await sleep(1500);
    record("1. Member → typing:start → delivered", "isTyping:true",
      received ? `isTyping:${received.isTyping}` : "nothing",
      received?.isTyping === true && received?.userId === u1.id);
  }

  // Test 2: Member typing:stop
  {
    let received = null;
    s2.once("typing:update", (d) => { received = d; });
    s1.emit("typing:stop", ch.id);
    await sleep(1500);
    record("2. Member → typing:stop → delivered", "isTyping:false",
      received ? `isTyping:${received.isTyping}` : "nothing",
      received?.isTyping === false && received?.userId === u1.id);
  }

  // Test 6: Multiple members (u2 → u1)
  {
    let received = null;
    s1.once("typing:update", (d) => { received = d; });
    s2.emit("typing:start", ch.id);
    await sleep(1500);
    record("6. Multiple members → u2→u1 typing works", "isTyping:true",
      received ? `isTyping:${received.isTyping}` : "nothing",
      received?.isTyping === true && received?.userId === u2.id);
  }

  s1.disconnect();
  s2.disconnect();
  await sleep(500);

  // Test 3-5: Non-member tests
  {
    const sa = await connectSocket(u1.token);
    const s3 = await connectSocket(u3.token);
    sa.emit("join:channel", ch.id);
    await sleep(1500);

    // Test 3: Non-member typing:start
    let leaked3 = false;
    sa.on("typing:update", (d) => { if (d.userId === u3.id) leaked3 = true; });
    s3.emit("typing:start", ch.id);
    await sleep(1500);
    record("3. Non-member → typing:start → REJECTED", "blocked", leaked3 ? "LEAKED" : "blocked", !leaked3);

    // Test 4: Non-member typing:stop
    let leaked4 = false;
    sa.removeAllListeners("typing:update");
    sa.on("typing:update", (d) => { if (d.userId === u3.id) leaked4 = true; });
    s3.emit("typing:stop", ch.id);
    await sleep(1500);
    record("4. Non-member → typing:stop → REJECTED", "blocked", leaked4 ? "LEAKED" : "blocked", !leaked4);

    // Test 5: Other-workspace user
    record("5. Other-workspace user → typing → REJECTED", "blocked", leaked3 ? "LEAKED" : "blocked", !leaked3,
      "(same test — u3 has no workspace access)");

    sa.disconnect();
    s3.disconnect();
  }
  await sleep(500);

  // ══════════════════════════════════════════════════
  // BUG #2: Null Byte
  // ══════════════════════════════════════════════════
  console.log("\n── Bug #2: Null Byte Message Validation ─────────\n");

  const msgUrl = `/api/workspaces/${ws.id}/channels/${ch.id}/messages`;

  { const r = await req("POST", msgUrl, { content: "Hello world" }, u1.token);
    record('1. "Hello world" → 201', 201, r.status, r.status === 201); }

  { const r = await req("POST", msgUrl, { content: "Hello 😀🎉" }, u1.token);
    record('2. "Hello 😀🎉" → 201', 201, r.status, r.status === 201); }

  { const r = await req("POST", msgUrl, { content: "<b>HTML</b>" }, u1.token);
    record('3. HTML text → 201', 201, r.status, r.status === 201); }

  { const r = await req("POST", msgUrl, { content: "" }, u1.token);
    record("4. Empty → 400", 400, r.status, r.status === 400); }

  { const r = await req("POST", msgUrl, { content: "   " }, u1.token);
    record("5. Whitespace-only → 400", 400, r.status, r.status === 400); }

  { const r = await req("POST", msgUrl, { content: "x".repeat(4001) }, u1.token);
    record("6. 4001 chars → 400", 400, r.status, r.status === 400); }

  { const r = await req("POST", msgUrl, { content: "Hello \u0000 world" }, u1.token);
    record('7. Null byte → 400 (was 500)', 400, r.status, r.status === 400,
      r.status === 500 ? "NOT FIXED!" : ""); }

  { const r = await req("POST", msgUrl, { content: "\u0000\u0000\u0000" }, u1.token);
    record("8. Multiple null bytes → 400", 400, r.status, r.status === 400); }

  // ══════════════════════════════════════════════════
  // REGRESSION
  // ══════════════════════════════════════════════════
  console.log("\n── Regression Checks ────────────────────────────\n");

  { const r = await req("GET", "/api/health");
    record("Health check → 200", 200, r.status, r.status === 200); }

  { const r = await req("GET", msgUrl, undefined, u3.token);
    record("Outsider cannot read messages → 403", 403, r.status, r.status === 403); }

  { const r = await req("POST", msgUrl, { content: "IDOR" }, u3.token);
    record("Outsider cannot send message → 403", 403, r.status, r.status === 403); }

  { const r = await req("POST", msgUrl, { content: "No auth" });
    record("No token → 401", 401, r.status, r.status === 401); }

  { const r = await req("POST", msgUrl, { content: "x".repeat(4000) }, u1.token);
    record("4000 chars (boundary) → 201", 201, r.status, r.status === 201); }

  { const r = await req("POST", msgUrl, { content: "日本語 🌍 Привет" }, u1.token);
    record("Unicode text → 201", 201, r.status, r.status === 201); }

  // Socket.IO messaging regression
  {
    const sx = await connectSocket(u1.token);
    sx.emit("join:channel", ch.id);
    await sleep(1500);
    let msg = null;
    sx.once("message:new", (d) => { msg = d; });
    sx.emit("message:send", { channelId: ch.id, content: "Socket regression" });
    await sleep(1500);
    record("Socket.IO message:send works", "message", msg?.content || "nothing",
      msg?.content === "Socket regression");
    sx.disconnect();
  }

  // ══════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  TOTAL: ${testCount}  |  ✅ PASS: ${passCount}  |  ❌ FAIL: ${failCount}`);
  console.log("═══════════════════════════════════════════════════\n");

  process.exit(failCount > 0 ? 1 : 0);
}

run().catch(e => { console.error("Error:", e); process.exit(1); });
