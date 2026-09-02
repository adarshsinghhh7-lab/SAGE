/**
 * S.A.G.E. — Auto-Escalation Configuration
 * -----------------------------------------------------------------------------
 * Central config file for the hourly automatic escalation engine.
 *
 * - `DEPARTMENT_EMAIL_MAP` routes a complaint's category to the admin email of
 *   the department responsible for it. Keys are normalized (lowercase, `/`
 *   replaced with `_`, see `normalizeCategory`), so every variant a complaint
 *   may arrive with is covered.
 * - `DEFAULT_ESCALATION_THRESHOLD` is the fallback used the very first time the
 *   backend boots (before any admin override is persisted). Admins can change
 *   the live threshold at runtime via `PUT /api/settings/escalation/threshold`.
 * - Email delivery channel is controlled with env vars:
 *     EMAIL_WEBHOOK_URL  → HTTP(S) endpoint (SendGrid / Postmark / Mailgun /
 *                          custom relay) that accepts `{ to, from, subject,
 *                          text, html, complaintId, category, department }`.
 *                          A 2xx response marks the email as delivered.
 *     SAGE_NO_REPLY_EMAIL → From-address used in webhook payloads.
 *   When no webhook is configured (e.g. local sandbox mode) emails are written
 *   to the server console with the exact body that would be delivered.
 */

export interface DepartmentRecipient {
  /** Human readable department / committee label, e.g. "IT Department". */
  department: string;
  /** Department admin mailbox that receives escalation notifications. */
  email: string;
}

/** Default escalation threshold (upvotes) used before any admin override. */
export const DEFAULT_ESCALATION_THRESHOLD = 20;

/** From-address used for outgoing automated notifications. */
export const SAGE_NO_REPLY_EMAIL = process.env.SAGE_NO_REPLY_EMAIL || 'no-reply@sage-campus.edu';

/** HTTP(S) webhook used to actually deliver emails (optional). */
export const EMAIL_WEBHOOK_URL = process.env.EMAIL_WEBHOOK_URL || '';

/**
 * Category → Department Email Mapping.
 *
 * wifi / internet        → IT Department
 * mess                   → Hostel Warden (Mess)
 * harassment             → Disciplinary Committee
 * infrastructure         → Estate & Maintenance
 * hygiene                → Campus Hygiene & Housekeeping
 * other                  → Administrative Office (default catch-all)
 */
export const DEPARTMENT_EMAIL_MAP: Record<string, DepartmentRecipient> = {
  wifi: { department: 'IT Department', email: 'it-support@campus.edu' },
  internet: { department: 'IT Department', email: 'it-support@campus.edu' },
  wifi_internet: { department: 'IT Department', email: 'it-support@campus.edu' },
  mess: { department: 'Hostel Warden (Mess)', email: 'hostel-warden@campus.edu' },
  mess_food: { department: 'Hostel Warden (Mess)', email: 'hostel-warden@campus.edu' },
  harassment: { department: 'Disciplinary Committee', email: 'disciplinary@campus.edu' },
  infrastructure: { department: 'Estate & Maintenance', email: 'estate-maintenance@campus.edu' },
  hygiene: { department: 'Campus Hygiene & Housekeeping', email: 'hygiene@campus.edu' },
  other: { department: 'Administrative Office', email: 'admin-office@campus.edu' },
};

/** Fallback recipient used when a category is unknown / unmapped. */
export const DEFAULT_DEPARTMENT_RECIPIENT: DepartmentRecipient =
  DEPARTMENT_EMAIL_MAP.other;

/** Normalize a complaint category into the config key space. */
export function normalizeCategory(category: string | null | undefined): string {
  return String(category || 'other').toLowerCase().replace('/', '_').trim();
}

/** Resolve the department recipient for a complaint category. */
export function resolveDepartmentRecipient(
  category: string | null | undefined
): DepartmentRecipient {
  const key = normalizeCategory(category);
  return DEPARTMENT_EMAIL_MAP[key] || DEFAULT_DEPARTMENT_RECIPIENT;
}