import { Complaint } from '../types';
import {
  EMAIL_WEBHOOK_URL,
  SAGE_NO_REPLY_EMAIL,
} from '../config/escalationConfig';

export interface EscalationEmailPayload {
  to: string;
  department: string;
  complaint: Complaint;
  threshold: number;
  from?: string;
}

export interface EmailSendResult {
  /** Whether the notification was successfully handed off to a delivery channel. */
  delivered: boolean;
  /** `webhook` = HTTP relay confirmed 2xx, `console` = sandbox console output. */
  channel: 'webhook' | 'console';
  to: string;
  department: string;
  subject: string;
  timestamp: string;
  error?: string;
}

function buildSubject(complaint: Complaint): string {
  return `[SAGE AUTO-ESCALATION] ${complaint.complaintId} moved to Under Review (${complaint.upvoteCount} upvotes)`;
}

function buildPlainText(complaint: Complaint, threshold: number, department: string): string {
  return [
    `A S.A.G.E. complaint has been automatically escalated because it crossed the community-upvote threshold.`,
    ``,
    `Complaint ID : ${complaint.complaintId}`,
    `Category     : ${complaint.category}`,
    `Location     : ${complaint.hostelOrLocation || complaint.location || 'Campus General'}`,
    `Status       : submitted -> under_review (AUTOMATIC)`,
    `Upvotes      : ${complaint.upvoteCount} (threshold: ${threshold})`,
    `High Priority: YES`,
    `Submitted    : ${complaint.createdAt}`,
    ``,
    `Description  :`,
    complaint.description,
    ``,
    `This complaint has been flagged as a HIGH-PRIORITY item for the ${department}.`,
    `Please sign in to the S.A.G.E. administrative portal to begin review.`,
  ].join('\n');
}

function buildHtml(complaint: Complaint, threshold: number, department: string): string {
  const safe = (value: string): string =>
    String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return [
    `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1C1C1C;">`,
    `<h2 style="margin-bottom:4px;">S.A.G.E. — High Priority Escalation</h2>`,
    `<p style="margin-top:0;color:#666;">A complaint was automatically escalated to the ${safe(department)}.</p>`,
    `<table style="border-collapse:collapse;font-size:13px;">`,
    `<tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Complaint ID</td><td>${safe(complaint.complaintId)}</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Category</td><td>${safe(complaint.category)}</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Location</td><td>${safe(complaint.hostelOrLocation || complaint.location || 'Campus General')}</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Upvotes</td><td>${complaint.upvoteCount} (threshold ${threshold})</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Priority</td><td style="color:#b91c1c;font-weight:bold;">HIGH PRIORITY</td></tr>`,
    `</table>`,
    `<p style="margin:12px 0 4px;font-weight:bold;">Description</p>`,
    `<p style="margin:0;padding:10px;background:#FAF9F6;border:1px solid #1C1C1C;">${safe(complaint.description)}</p>`,
    `<p style="margin-top:16px;">Please sign in to the S.A.G.E. administrative portal to begin review.</p>`,
    `</body></html>`,
  ].join('\n');
}

/**
 * Deliver an escalation notification to a department admin.
 *
 * Channel resolution order:
 *   1. `EMAIL_WEBHOOK_URL` env var → HTTP POST JSON payload (2xx = delivered).
 *   2. Otherwise → pretty console output (dev sandbox mode) so integrations can
 *      later be plugged in (e.g. nodemailer/SMTP, SendGrid, Cloud Functions
 *      `functions.firestore` extension, etc.) without changing this service.
 */
export async function sendEscalationEmail(
  payload: EscalationEmailPayload
): Promise<EmailSendResult> {
  const to = payload.to;
  const department = payload.department;
  const complaint = payload.complaint;
  const threshold = payload.threshold;
  const from = payload.from || SAGE_NO_REPLY_EMAIL;

  const subject = buildSubject(complaint);
  const text = buildPlainText(complaint, threshold, department);
  const html = buildHtml(complaint, threshold, department);
  const timestamp = new Date().toISOString();

  if (EMAIL_WEBHOOK_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from,
          subject,
          text,
          html,
          complaintId: complaint.complaintId,
          category: complaint.category,
          department,
          upvoteCount: complaint.upvoteCount,
          threshold,
          timestamp,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { delivered: true, channel: 'webhook', to, department, subject, timestamp };
      }
      return {
        delivered: false,
        channel: 'webhook',
        to,
        department,
        subject,
        timestamp,
        error: `Webhook rejected payload with status ${response.status}`,
      };
    } catch (error: any) {
      return {
        delivered: false,
        channel: 'webhook',
        to,
        department,
        subject,
        timestamp,
        error: `Webhook request failed: ${error?.message || 'unknown error'}`,
      };
    }
  }

  // Sandbox / fallback: log the exact email that would be sent.
  console.log(
    `\n==== [SAGE EMAIL ${'='.repeat(52)}\n` +
      `From       : ${from}\n` +
      `To         : ${to}  (${department})\n` +
      `Subject    : ${subject}\n` +
      `Timestamp  : ${timestamp}\n` +
      `----------------------------------------\n` +
      `${text}\n` +
      `${'='.repeat(70)}====\n`
  );

  return { delivered: true, channel: 'console', to, department, subject, timestamp };
}