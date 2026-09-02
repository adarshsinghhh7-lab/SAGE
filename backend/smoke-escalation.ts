/**
 * Smoke test for the hourly auto-escalation engine (sandbox in-memory store).
 * Run with:  node --import tsx backend/smoke-escalation.ts
 */
import { FirestoreService } from './src/services/firestoreService';
import { runAutoEscalation } from './src/services/escalationService';

async function main(): Promise<void> {
  console.log('\n==== [SMOKE] Step 1: Reset to default seed ====');
  await FirestoreService.resetToDefaultSeed();

  console.log('\n==== [SMOKE] Step 2: Read default settings ====');
  const before = await FirestoreService.getEscalationSettings();
  console.log('threshold =', before.threshold, '| default =', before.defaultThreshold);

  console.log('\n==== [SMOKE] Step 3: Admin lowers threshold to 5 ====');
  const lowered = await FirestoreService.setEscalationThreshold(5, 'smoke-admin');
  console.log('threshold now =', lowered.threshold, '| updatedBy =', lowered.updatedBy);

  console.log('\n==== [SMOKE] Step 4: Read back ==== ');
  const readBack = await FirestoreService.getEscalationSettings();
  console.log('persisted threshold =', readBack.threshold);

  console.log('\n==== [SMOKE] Step 5: Eligible complaints @ threshold 5 ====');
  const eligible = await FirestoreService.getComplaintsEligibleForEscalation(5);
  console.log(
    'eligible =',
    eligible.map((c) => `${c.complaintId}(${c.status},${c.upvoteCount})`).join(', ')
  );

  console.log('\n==== [SMOKE] Step 6: Run manual escalation sweep ====');
  const report = await runAutoEscalation({ trigger: 'manual' });

  console.log('\n==== [SMOKE] Step 7: Verify report ====');
  console.log(JSON.stringify(report, null, 2));

  console.log('\n==== [SMOKE] Step 8: Verify complaint state ====');
  for (const e of report.escalated) {
    const complaint = await FirestoreService.getComplaintById(e.complaintId);
    console.log(
      `${e.complaintId}: status=${complaint?.status} highPriority=${complaint?.highPriority} notified=${e.notifiedEmail} delivered=${e.emailDelivered}`
    );
  }

  console.log('\n==== [SMOKE] Step 9: Verify statusUpdates ledger ====');
  const updates = await FirestoreService.getStatusUpdates('SAGE-3318');
  const sysUpdates = updates.filter((u: any) => u.updatedBy === 'system-auto-escalation');
  console.log(`system-auto-escalation updates for SAGE-3318: ${sysUpdates.length}`);
  sysUpdates.forEach((u: any) =>
    console.log(`  ${u.updateId} | ${u.oldStatus} -> ${u.newStatus} | ${u.timestamp}`)
  );

  console.log('\n==== [SMOKE] Step 10: Re-run sweep to confirm idempotency ====');
  const rerun = await runAutoEscalation({ trigger: 'manual', silent: true });
  console.log(`re-run escalated = ${rerun.escalated.length} (expected 0; complaints already under_review)`);

  console.log('\n==== [SMOKE] Step 11: Last-run report persisted in settings ====');
  const after = await FirestoreService.getEscalationSettings();
  console.log('lastRunAt =', after.lastRunAt, '| lastRun.escalated =', after.lastRun?.escalated?.length);

  const passed =
    report.escalated.length >= 2 &&
    report.emailsSent >= 2 &&
    after.threshold === 5 &&
    rerun.escalated.length === 0 &&
    sysUpdates.length >= 1;

  console.log(`\n==== [SMOKE] ${passed ? 'PASS' : 'FAIL'} ====\n`);
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error('[SMOKE] Failed:', err);
  process.exit(1);
});