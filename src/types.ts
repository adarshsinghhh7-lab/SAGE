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

// 1. users Collection Schema
export interface UserDoc {
  userId: string;
  encryptedIdentity: string; // AES-256 encrypted, never plain text
  role: UserRole;
  department: string;
  createdAt: string;
}

// 2. complaints Collection Schema
export interface Complaint {
  complaintId: string; // e.g. "SAGE-2847"
  encryptedUserRef: string; // AES-256 encrypted reference to submitter, never plain userId
  category: ComplaintCategory;
  description: string;
  hostelOrLocation: string;
  status: ComplaintStatus;
  upvoteCount: number; // default 0
  urgencyScore: number; // default 0, evaluated by ML microservice (0.0 to 1.0)
  photoUrl?: string; // optional
  createdAt: string; // ISO date timestamp string
  resolutionNotes?: string;
  resolvedAt?: string;
  // UI helper state
  hasUpvoted?: boolean;
  // Backward compatibility alias getters
  id?: string;
  location?: string;
  upvotes?: number;
  urgency?: 'Standard' | 'Elevated' | 'Urgent';
}

// 3. upvotes Collection Schema
export interface UpvoteDoc {
  upvoteId: string;
  complaintId: string;
  hashedVoterId: string; // SHA-256 hash so user cannot vote twice, but identity is never stored
  createdAt: string;
}

// 4. statusUpdates Collection Schema
export interface StatusUpdateDoc {
  updateId: string;
  complaintId: string;
  updatedBy: string; // adminId
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

// 5. revealLogs Collection Schema (Immutable Audit Trail)
export interface RevealLogDoc {
  logId: string;
  complaintId: string;
  revealedByAdminId: string;
  reason: string;
  timestamp: string;
}

// 6. settings Collection Schema (Auto-Escalation Engine)
export type EscalationTrigger = 'scheduled' | 'manual';

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

export interface BackendHealthResponse {
  status: string;
  system: string;
  timestamp: string;
  firebase: {
    connected: boolean;
    status: string;
    details: string;
  };
  collections: {
    users: boolean;
    complaints: boolean;
    upvotes: boolean;
    statusUpdates: boolean;
    revealLogs: boolean;
  };
}

export type PageView = 'landing' | 'submit' | 'confirmation' | 'feed' | 'detail' | 'admin' | 'public';
