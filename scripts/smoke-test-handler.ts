// Local smoke test for the Vercel serverless handler (api/index.ts).
// Runs in-process via tsx: imports the handler, invokes it like Vercel's
// runtime would, and prints the status + body for /api/health and a POST.
import handler from '../api/index';

interface MockEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
  queryStringParameters: Record<string, string> | null;
}

function makeEvent(method: string, path: string, headers: Record<string, string>, body: string | null): MockEvent {
  return { httpMethod: method, path, headers, body, queryStringParameters: null };
}

async function main() {
  // Health check GET
  const healthRes = (await handler(
    makeEvent('GET', '/api/health', {}, null),
    {} as any
  )) as any;
  console.log('GET /api/health =>', healthRes.statusCode, String(healthRes.body).slice(0, 200));

  // Grievance POST (anonymous student)
  const complaint = {
    title: 'Serverless Smoke Test — leaking pipe in C-Block washroom',
    description: 'Water pooling near the sinks for three days; slippery floor risk.',
    category: 'Infrastructure',
    location: 'C-Block, 2nd floor washroom',
    evidence: [],
  };
  const postRes = (await handler(
    makeEvent('POST', '/api/complaints', { 'content-type': 'application/json', 'x-sage-role': 'student' }, JSON.stringify(complaint)),
    {} as any
  )) as any;
  console.log('POST /api/complaints =>', postRes.statusCode, String(postRes.body).slice(0, 200));

  const ok = healthRes.statusCode === 200 && postRes.statusCode === 201;
  console.log(ok ? 'SMOKE TEST PASSED ✅' : 'SMOKE TEST FAILED ❌');
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('SMOKE TEST ERROR', err);
  process.exit(1);
});