// E2E regression test for the UNGATED Head-Admin identity-reveal flow.
//
// Verifies (matching the spec):
//   1. Regular `admin` is rejected with HTTP 403 on POST /:id/reveal (even
//      when called directly, not just hidden in the UI).
//   2. No pre-conditions: Head Admin can reveal ANY complaint at ANY time.
//   3. Empty/short justification is rejected with HTTP 400.
//   4. A valid reveal returns the decrypted reference ONLY in this response,
//      and commits an entry to the immutable revealLogs ledger
//      (complaintId, revealedByAdminId = Head Admin user id, reason, timestamp).
//   5. GET /reveal-logs is Head-Admin-only (403 for regular admin).
//   6. No plaintext/ciphertext identity ever leaks via list/detail endpoints.
//
// Usage: start the backend (cd backend && npm run dev), then:
//   node scripts/e2e-reveal-test.mjs
const BASE = 'http://localhost:5000/api';

async function call(method, path, { role = 'student', uid, body } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-sage-role': role,
  };
  if (uid) headers['x-sage-uid'] = uid;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${detail}`);
}

// 0. Health
try {
  const h = await fetch(`${BASE}/health`);
  record('server reachable', h.ok, `health=${h.status}`);
} catch (e) {
  record('server reachable', false, e.message);
  process.exit(1);
}

// 1. Regular Admin cannot reveal (403 required)
{
  const r = await call('POST', '/complaints/SAGE-2847/reveal', {
    role: 'admin',
    uid: 'admin-officer-1',
    body: { reason: 'A valid justification text.' },
  });
  record('admin reveal blocked with 403', r.status === 403, `status=${r.status} body=${JSON.stringify(r.data)}`);
}

// 2. Head Admin blocked on empty reason (400)
{
  const r = await call('POST', '/complaints/SAGE-2847/reveal', {
    role: 'head_admin',
    uid: 'head_proctor_1',
    body: { reason: '   ' },
  });
  record('empty reason blocked with 400', r.status === 400, `status=${r.status} body=${JSON.stringify(r.data)}`);
}

// 3. Head Admin blocked on short reason (400)
{
  const r = await call('POST', '/complaints/SAGE-2847/reveal', {
    role: 'head_admin',
    uid: 'head_proctor_1',
    body: { reason: 'too short' },
  });
  record('short reason blocked with 400', r.status === 400, `status=${r.status} body=${JSON.stringify(r.data)}`);
}

// 4. Head Admin reveals a NON-disputed complaint (ungated) -> 200 + identity
let revealed = null;
{
  const r = await call('POST', '/complaints/SAGE-2847/reveal', {
    role: 'head_admin',
    uid: 'head_proctor_1',
    body: { reason: 'Campus safety investigation requires immediate identity resolution for follow-up.' },
  });
  const ok = r.status === 200 && r.data.data && r.data.data.decryptedUserRef && r.data.data.auditLogId;
  revealed = ok ? r.data.data : null;
  record('head admin reveal on non-disputed complaint succeeds', ok, `status=${r.status} identity=${revealed ? revealed.decryptedUserRef : 'none'} logId=${revealed ? revealed.auditLogId : 'none'}`);
}

// 4b. Non-head_admin role cannot read the audit ledger (403)
{
  const r = await call('GET', '/complaints/reveal-logs', { role: 'admin' });
  record('admin reveal-logs blocked with 403', r.status === 403, `status=${r.status} body=${JSON.stringify(r.data)}`);
}

// 5. Head Admin can read the ledger -> our entry is there
{
  const r = await call('GET', '/complaints/reveal-logs', { role: 'head_admin' });
  const logs = Array.isArray(r.data && r.data.data) ? r.data.data : [];
  const entry = logs.find((l) => l.logId === revealed.auditLogId);
  record(
    'reveal-logs contains new entry with complaintId/adminId/timestamp/reason',
    !!entry &&
      entry.complaintId === 'SAGE-2847' &&
      entry.revealedByAdminId === 'head_proctor_1' &&
      entry.reason.includes('Campus safety investigation') &&
      !!entry.timestamp,
    `entry=${JSON.stringify(entry)}`
  );
}

// 6. Complaint list responses never leak encryptedUserRef
{
  const r = await call('GET', '/complaints', { role: 'head_admin' });
  const arr = Array.isArray(r.data.data) ? r.data.data : [];
  const leaked = arr.find((c) => 'encryptedUserRef' in c || (c.encryptedUserRef !== undefined));
  record('no encryptedUserRef leaked in list responses', !leaked, `leak=${leaked ? JSON.stringify(leaked) : 'none'}`);
}

// 6b. Single-complaint detail response never leaks encryptedUserRef either
{
  const r = await call('GET', '/complaints/SAGE-2847', { role: 'head_admin' });
  const c = r.data.data || {};
  record('no encryptedUserRef leaked in detail response', !('encryptedUserRef' in c), `body=${JSON.stringify(Object.keys(c))}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n== ${failed.length === 0 ? 'ALL PASSED' : failed.length + ' FAILED'} ==`);
process.exit(failed.length === 0 ? 0 : 1);