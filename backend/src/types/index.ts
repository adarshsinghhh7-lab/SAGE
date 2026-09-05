export type ComplaintCategory =
  | 'infrastructure'
  | 'mess'
  | 'harassment'
  | 'wifi'
  | 'hygiene'
  | 'other'
  | 'Infrastructure'
  | 'Mess/Food'
  | 'Harassment'
  | 'WiFi/Internet'
  | 'Hygiene'
  | 'Other';

export type ComplaintStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'resolved'
  | 'Submitted' 
  | 'Under Review' 
  | 'Resolved';

export type UserRole = 'student' | 'admin' | 'head_admin';

export type EscalationTrigger = 'scheduled' | 'manual';

// 1. users collection
export interface UserDoc {
  userId: string;
  encryptedIdentity: string; // AES-256 encrypted, never plain text
  role: UserRole;
  department: string;
  createdAt: string;
}

// 2. complaints collection
export interface Complaint {
  complaintId: string; // e.g. "SAGE-2847"
  /**
   * AES-256 ciphertext of the verified submitter Firebase uid, sealed
   * SERVER-ONLY with SAGE_MASTER_KEY at deposit time. Never stored or sent as
   * plaintext. Omitted from client-facing API responses (see controller
   * sanitization) so nothing in the browser can ever resolve or decrypt it.
   */
  encryptedUserRef?: string;
  category: ComplaintCategory;
  description: string;
  hostelOrLocation: string;
  status: ComplaintStatus;
  upvoteCount: number; // default 0
  urgencyScore: number; // default 0, evaluated by ML microservice
  highPriority?: boolean; // set to true by the auto-escalation engine
  photoUrl?: string; // optional
  createdAt: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  /**
   * Disputed marking — set to true after an admin formally flags the
   * complaint as a suspected false/malicious deposition (see statusUpdates
   * ledger entry with updatedBy). This is an audited administrative
   * annotation only; it does NOT gate the Head Admin reveal flow (ungated).
   */
  disputed?: boolean;
  disputeReason?: string; // admin's written suspicion justification
  disputedAt?: string;
  disputedBy?: string;
  /** True only for demo/seed records. Such records are explicitly NOT real
   * sealed identities and carry no guarantee of protection. */
  isSandbox?: boolean;
  // UI helpers
  hasUpvoted?: boolean;
  id?: string;
  location?: string;
  upvotes?: number;
  urgency?: 'Standard' | 'Elevated' | 'Urgent';
}

// 3. upvotes collection
export interface UpvoteDoc {
  upvoteId: string;
  complaintId: string;
  hashedVoterId: string; // SHA-256 hash
  createdAt: string;
}

// 4. statusUpdates collection
export interface StatusUpdateDoc {
  updateId: string;
  complaintId: string;
  updatedBy: string; // adminId
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

// 5. revealLogs collection
export interface RevealLogDoc {
  logId: string;
  complaintId: string;
  revealedByAdminId: string;
  reason: string;
  timestamp: string;
}

export interface AuthUser {
  uid: string;
  email?: string;
  role: UserRole;
  department?: string;
  isAnonymous?: boolean;
}

// ---------------------------------------------------------------------------
// Auto-Escalation Engine Types
// ---------------------------------------------------------------------------

/** Pending / completed entry for one complaint in an escalation sweep. */
export interface EscalationResultEntry {
  complaintId: string;
  category: string;
  upvoteCount: number;
  oldStatus: string;
  newStatus: string;
  highPriority: boolean;
  notifiedEmail: string;
  emailDelivered: boolean;
  emailChannel?: 'webhook' | 'console';
  error?: string;
}

/** Summary report produced by a single escalation sweep run. */
export interface EscalationRunReport {
  ranAt: string; // ISO timestamp
  trigger: EscalationTrigger;
  threshold: number;
  checked: number; // complaints that matched the threshold query
  escalated: EscalationResultEntry[]; // complaints actually auto-escalated
  emailsSent: number;
  emailsFailed: number;
  errors: string[];
}

/** Document stored in the `settings` collection for escalation tuning. */
export interface EscalationSettingsDoc {
  settingsId: string; // 'escalation'
  threshold: number;
  defaultThreshold: number;
  updatedBy: string;
  updatedAt: string;
  lastRunAt?: string | null;
  lastRun?: EscalationRunReport | null;
}
