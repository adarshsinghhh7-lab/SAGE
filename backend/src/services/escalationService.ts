import { FirestoreService } from './firestoreService';
import { sendEscalationEmail } from './emailService';
import { resolveDepartmentRecipient, DEFAULT_ESCALATION_THRESHOLD } from '../config/escalationConfig';
import { EscalationRunReport, EscalationResultEntry, EscalationTrigger } from '../types';

export interface EscalationRunOptions {
  /** How the sweep was triggered: 'scheduled' (hourly) or 'manual' (admin/test). */
  trigger?: EscalationTrigger;
  /** Override the active settings threshold for this run. Default: live settings value. */
  threshold?: number | null;
  /** Suppress console logging (used by tests). */
  silent?: boolean;
}

let hourlyTimer: NodeJS.Timeout | null = null;

/**
 * Execute one full auto-escalation sweep:
 *
 *  1. Read the live escalation threshold (admin-tunable).
 *  2. Find every complaint with `upvoteCount >= threshold` still in `submitted`.
 *  3. For each one:
 *       a. FirestoreService.autoEscalate → status `under_review` + `highPriority: true`
 *          + statusUpdates ledger entry by 'system-auto-escalation'.
 *       b. Resolve the department recipient from the complaint category.
 *       c. sendEscalationEmail to the department admin (webhook or console sandbox).
 *  4. Store an EscalationRunReport so admins can audit the sweep.
 *
 * @returns A full EscalationRunReport of the sweep.
 */
export async function runAutoEscalation(
  options: EscalationRunOptions = {}
): Promise<EscalationRunReport> {
  const trigger: EscalationTrigger = options.trigger ?? 'scheduled';
  const silent = options.silent ?? false;

  const settings = await FirestoreService.getEscalationSettings();
  const threshold = options.threshold ?? settings.threshold ?? DEFAULT_ESCALATION_THRESHOLD;

  const nowIso = new Date().toISOString();
  const eligible = await FirestoreService.getComplaintsEligibleForEscalation(threshold);

  const report: EscalationRunReport = {
    ranAt: nowIso,
    trigger,
    threshold,
    checked: eligible.length,
    escalated: [],
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
  };

  if (!silent) {
    console.log(
      `\n[SAGE Auto-Escalation] Sweep @ ${nowIso} · trigger=${trigger} · threshold=${threshold} · eligible=${eligible.length}`
    );
  }

  for (const complaint of eligible) {
    try {
      const assigned = resolveDepartmentRecipient(complaint.category);
      const escalated = await FirestoreService.autoEscalate(complaint.complaintId);

      if (!escalated) {
        // Complaint was concurrently moved out of 'submitted' — skip silently.
        continue;
      }

      const entry: EscalationResultEntry = {
        complaintId: escalated.complaintId,
        category: escalated.category,
        upvoteCount: escalated.upvoteCount,
        oldStatus: 'submitted',
        newStatus: escalated.status,
        highPriority: !!escalated.highPriority,
        notifiedEmail: assigned.email,
        emailDelivered: false,
      };

      const emailResult = await sendEscalationEmail({
        to: assigned.email,
        department: assigned.department,
        complaint: escalated,
        threshold,
      });

      entry.emailDelivered = emailResult.delivered;
      entry.emailChannel = emailResult.channel;
      entry.error = emailResult.error;

      if (emailResult.delivered) {
        report.emailsSent += 1;
      } else {
        report.emailsFailed += 1;
      }

      report.escalated.push(entry);

      if (!silent) {
        console.log(
          `[SAGE Auto-Escalation] ${entry.complaintId} (${entry.category}, ${entry.upvoteCount} upvotes) → ` +
            `under_review · notifying ${assigned.department} <${assigned.email}> · ` +
            `email=${emailResult.delivered ? 'delivered' : 'FAILED'} (${emailResult.channel})`
        );
      }
    } catch (err: any) {
      const message = `Escalation failed for ${complaint.complaintId}: ${err?.message || 'unknown error'}`;
      report.errors.push(message);
      report.emailsFailed += 1;
      if (!silent) console.warn(`[SAGE Auto-Escalation] ${message}`);
    }
  }

  await FirestoreService.recordEscalationRun(report);

  if (!silent) {
    console.log(
      `[SAGE Auto-Escalation] Sweep complete · escalated=${report.escalated.length} · ` +
        `emailsSent=${report.emailsSent} · emailsFailed=${report.emailsFailed} · errors=${report.errors.length}\n`
    );
  }

  return report;
}

/**
 * Schedule the auto-escalation sweep to run on an hourly cadence,
 * aligned to the top of the next hour to keep a stable cycle.
 *
 * Set `DISABLE_ESCALATION_SCHEDULER=true` to opt out (e.g. during tests).
 * Also exported as `startHourlyEscalationScheduler`.
 */
export function startHourlyEscalationScheduler(): void {
  if (process.env.DISABLE_ESCALATION_SCHEDULER === 'true') {
    console.log('[SAGE Auto-Escalation] Hourly scheduler disabled via DISABLE_ESCALATION_SCHEDULER=true');
    return;
  }
  if (hourlyTimer) return; // already running

  const HOUR_MS = 60 * 60 * 1000;

  const scheduleNext = (): void => {
    const now = Date.now();
    const nextHour = new Date(now);
    nextHour.setUTCMinutes(0, 0, 0);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1);
    const delayMs = Math.max(1000, nextHour.getTime() - now + 750);

    hourlyTimer = setTimeout(() => {
      runAutoEscalation({ trigger: 'scheduled' }).catch((err: any) => {
        console.error(`[SAGE Auto-Escalation] Scheduled sweep failed: ${err?.message}`);
      });
      scheduleNext();
    }, delayMs);

    if (typeof hourlyTimer !== 'number') {
      hourlyTimer.unref?.();
    }
  };

  scheduleNext();
  console.log('[SAGE Auto-Escalation] Hourly scheduler armed (first sweep at the top of the next hour).');
}

/** Stop the hourly scheduler (mainly used in tests / shutdown). */
export function stopHourlyEscalationScheduler(): void {
  if (hourlyTimer) {
    clearTimeout(hourlyTimer);
    hourlyTimer = null;
    console.log('[SAGE Auto-Escalation] Hourly scheduler stopped.');
  }
}