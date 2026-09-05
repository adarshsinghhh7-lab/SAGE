import { db, isFirebaseLive } from '../config/firebaseAdmin';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  UserDoc, 
  UpvoteDoc, 
  StatusUpdateDoc, 
  RevealLogDoc,
  UserRole,
  EscalationSettingsDoc,
  EscalationRunReport
} from '../types';
import { encryptAES, decryptAES, hashSHA256 } from '../utils/crypto';
import { DEFAULT_ESCALATION_THRESHOLD } from '../config/escalationConfig';

// Seed initial complaints conforming to exact schema
const SEED_COMPLAINTS: Complaint[] = [
  {
    complaintId: 'SAGE-2847',
    encryptedUserRef: encryptAES('STUDENT_SEED_101_HASH_A871'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'infrastructure',
    hostelOrLocation: 'Hostel Block A - 2nd Floor Corridor',
    description: 'Exposed live electrical wiring hanging near the water cooler outside Room 204. Sparks observed during heavy evening usage. Immediate safety hazard for passing students.',
    status: 'under_review',
    upvoteCount: 89,
    urgencyScore: 0.94,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    resolutionNotes: 'Maintenance supervisor inspected site. Main valve isolated; certified electrician dispatched for wiring overhaul.'
  },
  {
    complaintId: 'SAGE-6721',
    encryptedUserRef: encryptAES('STUDENT_SEED_102_HASH_B924'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'infrastructure',
    hostelOrLocation: 'Academic Complex Block 2 - Lift 3',
    description: 'Elevator stops unexpectedly between 3rd and 4th floors with emergency call button unresponsive. Multiple students experienced sudden drops.',
    status: 'resolved',
    upvoteCount: 35,
    urgencyScore: 0.72,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    resolutionNotes: 'OEM technician serviced lift governor cable and replaced faulty auxiliary alarm battery. Safety certificate issued.',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    complaintId: 'SAGE-9104',
    encryptedUserRef: encryptAES('STUDENT_SEED_103_HASH_C318'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'harassment',
    hostelOrLocation: 'East Gate Pathway towards Girls Hostel 1',
    description: 'Pathway streetlights have been completely non-functional for past 5 nights. Repeated instances of unknown outsiders loitering and passing hostile remarks after 9:00 PM.',
    status: 'under_review',
    upvoteCount: 114,
    urgencyScore: 0.98,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    resolutionNotes: 'Chief Proctor coordinated with Campus Security. Two high-mast solar LED lights installed; mobile security patrol route expanded for 8:00 PM - 2:00 AM window.'
  },
  {
    complaintId: 'SAGE-3318',
    encryptedUserRef: encryptAES('STUDENT_SEED_104_HASH_D551'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'mess',
    hostelOrLocation: 'Central Mess Hall - Counter 2',
    description: 'Undercooked lentils and sour milk supplied during Monday morning breakfast. Multiple students in Block B reported acute abdominal cramps.',
    status: 'submitted',
    upvoteCount: 52,
    urgencyScore: 0.45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    complaintId: 'SAGE-5512',
    encryptedUserRef: encryptAES('STUDENT_SEED_105_HASH_E712'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'hygiene',
    hostelOrLocation: 'Hostel Block C - Ground Floor Washrooms',
    description: 'Severe sewage drain blockage causing water backup across three stalls. Extreme odor permeating into adjacent ground floor study rooms.',
    status: 'submitted',
    upvoteCount: 64,
    urgencyScore: 0.65,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    complaintId: 'SAGE-4409',
    encryptedUserRef: encryptAES('STUDENT_SEED_106_HASH_F882'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'wifi',
    hostelOrLocation: 'Central Library - 1st Floor Quiet Study Area',
    description: 'Access Point AP-CL-04 dropping packets with 80% loss rate. DNS resolution failing continuously during mid-semester paper submissions.',
    status: 'resolved',
    upvoteCount: 18,
    urgencyScore: 0.12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    resolutionNotes: 'Network engineers replaced faulty PoE switch port and re-calibrated frequency band.',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    complaintId: 'SAGE-4192',
    encryptedUserRef: encryptAES('STUDENT_SEED_107_HASH_G771'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'mess',
    hostelOrLocation: 'Central Dining Mess - South Wing',
    description: 'Undercooked lentils and sour milk served during today’s breakfast batch. Multiple students have reported stomach cramps. Requesting immediate food safety inspection by the student mess council.',
    location: 'Central Dining Mess - South Wing',
    status: 'submitted',
    upvoteCount: 68,
    urgencyScore: 0.92,
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString()
  },
  {
    complaintId: 'SAGE-1083',
    encryptedUserRef: encryptAES('STUDENT_SEED_108_HASH_H913'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'infrastructure',
    hostelOrLocation: 'Girls Hostel 2, Wing A (Washroom 204)',
    description: 'Severe water leakage in the ceiling overhead causing electric switchboard sparks when light switches are pressed. Needs urgent electrician dispatch before an accident occurs.',
    location: 'Girls Hostel 2, Wing A (Washroom 204)',
    status: 'under_review',
    upvoteCount: 89,
    urgencyScore: 0.95,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    resolutionNotes: 'Maintenance supervisor inspected site. Main valve isolated; certified electrician dispatched for wiring overhaul.'
  },
  {
    complaintId: 'SAGE-5539',
    encryptedUserRef: encryptAES('STUDENT_SEED_109_HASH_J421'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'other',
    hostelOrLocation: 'Central Library 2nd Floor Silent Reading Area',
    description: 'AC unit #3 rattling loudly with a screeching fan bearing noise for the past week, making quiet study in the examination zone impossible.',
    location: 'Central Library 2nd Floor Silent Reading Area',
    status: 'resolved',
    upvoteCount: 18,
    urgencyScore: 0.12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    resolutionNotes: 'Estate department replaced defective blower fan motor and cleaned air filters.',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    complaintId: 'SAGE-7820',
    encryptedUserRef: encryptAES('STUDENT_SEED_110_HASH_K118'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'wifi',
    hostelOrLocation: 'Hostel Block A - West Wing',
    description: 'Bandwidth throttling dropping ping spikes to 800ms during online lab assessments. Router in corridor 2 repeatedly rebooting.',
    location: 'Hostel Block A - West Wing',
    status: 'submitted',
    upvoteCount: 29,
    urgencyScore: 0.18,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    complaintId: 'SAGE-8201',
    encryptedUserRef: encryptAES('STUDENT_SEED_111_HASH_L192'),
    isSandbox: true, // demo seed — simulated identity, NOT a real sealed record
    category: 'infrastructure',
    hostelOrLocation: 'Girls Hostel 1 - 1st Floor Corridor',
    description: 'Broken corridor window pane shattered by heavy monsoon gusts. Glass shards on walkway pose risk of foot injuries.',
    location: 'Girls Hostel 1 - 1st Floor Corridor',
    status: 'resolved',
    upvoteCount: 47,
    urgencyScore: 0.88,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    resolutionNotes: 'Civil maintenance replaced shattered glass panel with reinforced polycarbonate sheet.',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  }
];

// Helper to normalize complaint object
export function normalizeComplaint(doc: any): Complaint {
  const data = typeof doc.data === 'function' ? doc.data() : doc;
  const complaintId = data.complaintId || data.id || 'SAGE-0000';
  const location = data.hostelOrLocation || data.location || '';
  const upvoteCount = data.upvoteCount !== undefined ? data.upvoteCount : (data.upvotes || 0);
  const urgencyScore = data.urgencyScore !== undefined ? data.urgencyScore : 0;
  const category = (data.category || 'other').toLowerCase() as ComplaintCategory;
  const status = (data.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus;

  let urgency: 'Standard' | 'Elevated' | 'Urgent' = 'Standard';
  if (category === 'harassment' || urgencyScore >= 0.75) {
    urgency = 'Urgent';
  } else if (urgencyScore >= 0.5) {
    urgency = 'Elevated';
  }

  return {
    ...data,
    complaintId,
    // Only carry the ciphertext if the source record actually has one
    // (server-sealed records). Never fabricate a client-side AES blob here.
    encryptedUserRef: data.encryptedUserRef || undefined,
    category,
    description: data.description || '',
    hostelOrLocation: location,
    status,
    upvoteCount,
    urgencyScore,
    createdAt: data.createdAt || new Date().toISOString(),
    resolutionNotes: data.resolutionNotes,
    resolvedAt: data.resolvedAt,
    disputed: data.disputed === true,
    disputeReason: data.disputeReason,
    disputedAt: data.disputedAt,
    disputedBy: data.disputedBy,
    isSandbox: data.isSandbox === true,
    // Aliases for seamless UI compatibility
    id: complaintId,
    location,
    upvotes: upvoteCount,
    urgency,
  };
}

// In-Memory Fallback Stores for the 5 Collections
let inMemoryUsers: Map<string, UserDoc> = new Map();
let inMemoryComplaints: Map<string, Complaint> = new Map(
  SEED_COMPLAINTS.map((c) => [c.complaintId, normalizeComplaint(c)])
);
let inMemoryUpvotes: Map<string, UpvoteDoc> = new Map();
let inMemoryStatusUpdates: StatusUpdateDoc[] = [];
let inMemoryRevealLogs: RevealLogDoc[] = [];

// In-Memory Escalation Settings (Admin-tunable threshold, persisted to Firestore when live)
let inMemoryEscalationSettings: Map<string, EscalationSettingsDoc> = new Map();

function getDefaultEscalationSettings(): EscalationSettingsDoc {
  return {
    settingsId: 'escalation',
    threshold: DEFAULT_ESCALATION_THRESHOLD,
    defaultThreshold: DEFAULT_ESCALATION_THRESHOLD,
    updatedBy: 'system',
    updatedAt: new Date().toISOString(),
    lastRunAt: null,
    lastRun: null,
  };
}

export class FirestoreService {
  public static collections = {
    users: 'users',
    complaints: 'complaints',
    upvotes: 'upvotes',
    statusUpdates: 'statusUpdates',
    revealLogs: 'revealLogs',
    settings: 'settings',
  };

  /**
   * Seed complaints collection in live Firestore if empty
   */
  static async seedIfEmpty(): Promise<void> {
    if (isFirebaseLive && db) {
      try {
        const snapshot = await db.collection(this.collections.complaints).limit(1).get();
        if (snapshot.empty) {
          console.log('[Firestore] Seeding 5 collections to live Firestore...');
          const batch = db.batch();
          for (const item of SEED_COMPLAINTS) {
            const normalized = normalizeComplaint(item);
            const docRef = db.collection(this.collections.complaints).doc(normalized.complaintId);
            batch.set(docRef, normalized);
          }
          await batch.commit();
          console.log(`[Firestore] Successfully seeded ${SEED_COMPLAINTS.length} complaints.`);
        }
      } catch (err: any) {
        console.warn(`[Firestore Seeding] Note: ${err?.message}`);
      }
    }
  }

  /**
   * 1. users Collection: Create or Get User Profile with Encrypted Identity
   */
  static async createUser(userData: {
    userId: string;
    plainIdentity?: string;
    role: UserRole;
    department: string;
  }): Promise<UserDoc> {
    const encryptedIdentity = userData.plainIdentity
      ? encryptAES(userData.plainIdentity)
      : encryptAES(`STUDENT_${userData.userId}`);

    const userDoc: UserDoc = {
      userId: userData.userId,
      encryptedIdentity,
      role: userData.role,
      department: userData.department,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.users).doc(userData.userId).set(userDoc);
      } catch (err: any) {
        console.warn(`[Firestore createUser] ${err?.message}`);
      }
    }

    inMemoryUsers.set(userData.userId, userDoc);
    return userDoc;
  }

  /**
   * 2. complaints Collection: Get all complaints
   */
  static async getComplaints(filters: {
    category?: string;
    status?: string;
    location?: string;
    search?: string;
    sortBy?: 'upvotes' | 'newest' | 'oldest' | 'id';
  }): Promise<Complaint[]> {
    let complaints: Complaint[] = [];

    if (isFirebaseLive && db) {
      try {
        let query: any = db.collection(this.collections.complaints);
        const snapshot = await query.get();
        complaints = snapshot.docs.map((doc: any) => normalizeComplaint(doc));
      } catch (err: any) {
        complaints = Array.from(inMemoryComplaints.values());
      }
    } else {
      complaints = Array.from(inMemoryComplaints.values());
    }

    const f = filters || {};

    // Normalized filters & sorting
    return complaints
      .filter((complaint) => {
        // Category filter
        if (f.category && f.category !== 'All') {
          const filterCat = f.category.toLowerCase().replace('/', '_');
          const compCat = (complaint.category || '').toLowerCase().replace('/', '_');
          if (!compCat.includes(filterCat) && !filterCat.includes(compCat)) {
            return false;
          }
        }

        // Status filter
        if (f.status && f.status !== 'All') {
          const filterStatus = f.status.toLowerCase().replace(' ', '_');
          const compStatus = (complaint.status || '').toLowerCase().replace(' ', '_');
          if (filterStatus === 'high_priority' || filterStatus === 'urgent') {
            if ((complaint.urgencyScore || 0) < 0.75 || compStatus === 'resolved') return false;
          } else if (compStatus !== filterStatus) {
            return false;
          }
        }

        // Location filter
        if (f.location && f.location !== 'All') {
          if (!(complaint.hostelOrLocation || complaint.location || '').toLowerCase().includes(f.location.toLowerCase())) {
            return false;
          }
        }

        // Search query
        if (f.search && f.search.trim()) {
          const q = f.search.toLowerCase().trim();
          const matchId = (complaint.complaintId || complaint.id || '').toLowerCase().includes(q);
          const matchDesc = (complaint.description || '').toLowerCase().includes(q);
          const matchLoc = (complaint.hostelOrLocation || complaint.location || '').toLowerCase().includes(q);
          const matchCat = (complaint.category || '').toLowerCase().includes(q);

          if (!matchId && !matchDesc && !matchLoc && !matchCat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (f.sortBy === 'upvotes') {
          return b.upvoteCount - a.upvoteCount;
        }
        if (f.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (f.sortBy === 'id') {
          return a.complaintId.localeCompare(b.complaintId);
        }
        // Default: newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  /**
   * 2. complaints Collection: Get single complaint
   */
  static async getComplaintById(complaintId: string): Promise<Complaint | null> {
    if (isFirebaseLive && db) {
      try {
        const doc = await db.collection(this.collections.complaints).doc(complaintId).get();
        if (doc.exists) {
          return normalizeComplaint(doc);
        }
      } catch (err: any) {
        console.warn(`[Firestore getComplaintById] ${err?.message}`);
      }
    }
    return inMemoryComplaints.get(complaintId) || null;
  }

  /**
   * 2. complaints Collection: Create complaint.
   *
   * FAIL-CLOSED: identity sealing happens ONLY here / in the controller, never
   * on the client. `encryptedUserRef` MUST already be the AES ciphertext of
   * the verified submitter uid produced by the backend with SAGE_MASTER_KEY.
   * If it is missing we refuse to deposit — we never fabricate an anonymous
   * pseudo-identity token, because anonymous-by-default submissions that are
   * immune to accountability are no longer permitted.
   */
  static async createComplaint(data: {
    category: ComplaintCategory;
    description: string;
    hostelOrLocation: string;
    encryptedUserRef?: string;
    photoUrl?: string;
    urgencyScore?: number;
    complaintId?: string;
  }): Promise<Complaint> {
    if (!data.encryptedUserRef) {
      throw new Error('Sealing server unavailable — please retry.');
    }

    const complaintId = data.complaintId || `SAGE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: Complaint = normalizeComplaint({
      complaintId,
      encryptedUserRef: data.encryptedUserRef,
      category: data.category.toLowerCase() as ComplaintCategory,
      description: data.description.trim(),
      hostelOrLocation: data.hostelOrLocation.trim(),
      status: 'submitted',
      upvoteCount: 1,
      urgencyScore: data.urgencyScore || (data.category === 'harassment' ? 0.95 : 0.2),
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString(),
    });

    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.complaints).doc(complaintId).set(newComplaint);
      } catch (err: any) {
        console.warn(`[Firestore createComplaint] ${err?.message}`);
      }
    }

    inMemoryComplaints.set(complaintId, newComplaint);
    return newComplaint;
  }

  /**
   * 3. upvotes Collection: Atomic upvote with SHA-256 voter hash
   */
  static async upvoteComplaint(complaintId: string, voterIdentifier?: string): Promise<{
    complaint: Complaint;
    alreadyUpvoted: boolean;
  } | null> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) return null;

    const rawVoter = voterIdentifier || `ANON_CLIENT_${Math.random()}_${Date.now()}`;
    const hashedVoterId = hashSHA256(rawVoter);
    const upvoteDocId = `${complaintId}_${hashedVoterId.slice(0, 16)}`;

    // Check if voter already voted in live Firestore or in-memory
    if (isFirebaseLive && db) {
      try {
        const existingVote = await db.collection(this.collections.upvotes).doc(upvoteDocId).get();
        if (existingVote.exists) {
          return { complaint: { ...complaint, hasUpvoted: true }, alreadyUpvoted: true };
        }
      } catch (err) {
        // continue
      }
    } else if (inMemoryUpvotes.has(upvoteDocId)) {
      return { complaint: { ...complaint, hasUpvoted: true }, alreadyUpvoted: true };
    }

    const newUpvoteCount = (complaint.upvoteCount || 0) + 1;
    const updatedComplaint: Complaint = {
      ...complaint,
      upvoteCount: newUpvoteCount,
      upvotes: newUpvoteCount,
      hasUpvoted: true,
    };

    const upvoteDoc: UpvoteDoc = {
      upvoteId: upvoteDocId,
      complaintId,
      hashedVoterId,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseLive && db) {
      try {
        const batch = db.batch();
        batch.update(db.collection(this.collections.complaints).doc(complaintId), {
          upvoteCount: newUpvoteCount,
        });
        batch.set(db.collection(this.collections.upvotes).doc(upvoteDocId), upvoteDoc);
        await batch.commit();
      } catch (err: any) {
        console.warn(`[Firestore upvote] ${err?.message}`);
      }
    }

    inMemoryUpvotes.set(upvoteDocId, upvoteDoc);
    inMemoryComplaints.set(complaintId, updatedComplaint);
    return { complaint: updatedComplaint, alreadyUpvoted: false };
  }

  /**
   * 4. statusUpdates Collection: Admin update status and append immutable status update log
   */
  static async updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    resolutionNotes?: string,
    adminId: string = 'admin-user'
  ): Promise<Complaint | null> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) return null;

    const oldStatus = complaint.status;
    const isNewlyResolved = newStatus === 'resolved' && oldStatus !== 'resolved';
    const nowIso = new Date().toISOString();

    const updatedComplaint: Complaint = normalizeComplaint({
      ...complaint,
      status: newStatus,
      resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : complaint.resolutionNotes,
      resolvedAt: isNewlyResolved ? nowIso : complaint.resolvedAt,
    });

    const statusUpdateDoc: StatusUpdateDoc = {
      updateId: `STATUS_UPD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      complaintId,
      updatedBy: adminId,
      oldStatus,
      newStatus,
      timestamp: nowIso,
    };

    if (isFirebaseLive && db) {
      try {
        const batch = db.batch();
        const updatePayload: any = { status: newStatus };
        if (resolutionNotes !== undefined) updatePayload.resolutionNotes = resolutionNotes;
        if (isNewlyResolved) updatePayload.resolvedAt = nowIso;

        batch.update(db.collection(this.collections.complaints).doc(complaintId), updatePayload);
        batch.set(db.collection(this.collections.statusUpdates).doc(statusUpdateDoc.updateId), statusUpdateDoc);
        await batch.commit();
      } catch (err: any) {
        console.warn(`[Firestore updateStatus] ${err?.message}`);
      }
    }

    inMemoryStatusUpdates.push(statusUpdateDoc);
    inMemoryComplaints.set(complaintId, updatedComplaint);
    return updatedComplaint;
  }

  /**
   * 4.5 Fair-use dispute flagging.
   *
   * An admin flags a complaint as "disputed — suspected false/malicious".
   * This writes `disputed: true` (+ written justification and the flagging
   * admin's id) onto the complaint AND commits an immutable statusUpdates
   * ledger entry with updatedBy. NOTE: this flag is NOT a pre-condition for
   * identity reveal anymore — the Head Admin reveal flow is ungated.
   */
  static async flagComplaintAsDisputed(
    complaintId: string,
    flaggedBy: string,
    reason: string
  ): Promise<Complaint | null> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) return null;

    const reasonText = reason.trim();
    const nowIso = new Date().toISOString();

    const updatedComplaint: Complaint = {
      ...complaint,
      disputed: true,
      disputeReason: reasonText,
      disputedAt: nowIso,
      disputedBy: flaggedBy,
    };

    const statusUpdateDoc: StatusUpdateDoc = {
      updateId: `STATUS_UPD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      complaintId,
      updatedBy: flaggedBy,
      oldStatus: complaint.status,
      newStatus: 'flagged_disputed',
      timestamp: nowIso,
    };

    if (isFirebaseLive && db) {
      try {
        const batch = db.batch();
        batch.update(db.collection(this.collections.complaints).doc(complaintId), {
          disputed: true,
          disputeReason: reasonText,
          disputedAt: nowIso,
          disputedBy: flaggedBy,
        });
        batch.set(db.collection(this.collections.statusUpdates).doc(statusUpdateDoc.updateId), statusUpdateDoc);
        await batch.commit();
      } catch (err: any) {
        console.warn(`[Firestore flagComplaintAsDisputed] ${err?.message}`);
      }
    }

    inMemoryStatusUpdates.push(statusUpdateDoc);
    inMemoryComplaints.set(complaintId, updatedComplaint);
    return updatedComplaint;
  }

  /**
   * 5. revealLogs Collection: Strictly for Head Admin to decrypt submitter
   * reference with immutable audit log.
   *
   * Head Admin may reveal the submitter identity on any complaint at any time —
   * there is no "must be disputed first" pre-condition. The only requirement is
   * a written justification (min 10 chars) for the audit record. Null-complaints
   * return null for 404 handling.
   */
  static async triggerIdentityReveal(
    complaintId: string,
    headAdminId: string,
    reason: string
  ): Promise<{
    success: boolean;
    complaintId: string;
    decryptedUserRef: string;
    auditLogId: string;
    timestamp: string;
  } | null> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) return null;

    if (!reason || reason.trim().length < 10) {
      throw new Error('A detailed justification (minimum 10 characters) is legally required for identity reveal.');
    }

    const logId = `REVEAL_LOG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Decrypt AES encrypted reference (server-only SAGE_MASTER_KEY)
    const decryptedUserRef = complaint.encryptedUserRef
      ? decryptAES(complaint.encryptedUserRef)
      : '[NO SEALED REFERENCE]';

    const revealLogDoc: RevealLogDoc = {
      logId,
      complaintId,
      revealedByAdminId: headAdminId,
      reason: reason.trim(),
      timestamp: nowIso,
    };

    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.revealLogs).doc(logId).set(revealLogDoc);
      } catch (err: any) {
        console.warn(`[Firestore revealLog] ${err?.message}`);
      }
    }

    inMemoryRevealLogs.push(revealLogDoc);

    return {
      success: true,
      complaintId,
      decryptedUserRef,
      auditLogId: logId,
      timestamp: nowIso,
    };
  }

  /**
   * Retrieve the full immutable reveal audit ledger (`revealLogs` collection).
   * Strictly Head-Admin-only (enforced by the `requireHeadAdmin` route and by
   * Firestore security rules). Returns records newest-first.
   */
  static async getRevealLogs(): Promise<RevealLogDoc[]> {
    const logs = new Map<string, RevealLogDoc>();

    if (isFirebaseLive && db) {
      try {
        const snapshot = await db
          .collection(this.collections.revealLogs)
          .orderBy('timestamp', 'desc')
          .get();
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data() as RevealLogDoc;
          if (data && data.logId) logs.set(data.logId, data);
        });
      } catch (err: any) {
        console.warn(`[Firestore getRevealLogs] ${err?.message}`);
      }
    }

    // Merge in any in-memory (sandbox) records not yet mirrored to Firestore.
    for (const log of inMemoryRevealLogs) {
      if (log && log.logId) logs.set(log.logId, log);
    }

    return Array.from(logs.values()).sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }

  /**
   * Delete complaint (Head Admin only)
   */
  static async deleteComplaint(complaintId: string): Promise<boolean> {
    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.complaints).doc(complaintId).delete();
      } catch (err: any) {
        console.warn(`[Firestore delete] ${err?.message}`);
      }
    }
    return inMemoryComplaints.delete(complaintId);
  }
  /**
   * Query complaints that meet the automatic escalation criteria:
   * `upvoteCount >= threshold` AND status is still `submitted`.
   * Works in both live Firestore and the synchronized in-memory sandbox.
   */
  static async getComplaintsEligibleForEscalation(threshold: number): Promise<Complaint[]> {
    const results = new Map<string, Complaint>();

    if (isFirebaseLive && db) {
      try {
        const snapshot = await db
          .collection(this.collections.complaints)
          .where('status', '==', 'submitted')
          .where('upvoteCount', '>=', threshold)
          .get();

        snapshot.docs.forEach((docSnap: any) => {
          const complaint = normalizeComplaint(docSnap);
          if (complaint.status === 'submitted' && complaint.upvoteCount >= threshold) {
            results.set(complaint.complaintId, complaint);
          }
        });
      } catch (err: any) {
        // Composite index or connectivity issue → fall back to an unfiltered scan
        console.warn(`[Firestore escalation query (fallback to scan)] ${err?.message}`);
        try {
          const scanned = await this.getComplaints({ status: 'submitted' });
          scanned.forEach((complaint) => {
            if (complaint.status === 'submitted' && complaint.upvoteCount >= threshold) {
              results.set(complaint.complaintId, complaint);
            }
          });
        } catch (scanErr: any) {
          console.warn(`[Firestore escalation fallback scan] ${scanErr?.message}`);
        }
      }
    }

    for (const complaint of inMemoryComplaints.values()) {
      if (complaint.status === 'submitted' && complaint.upvoteCount >= threshold) {
        results.set(complaint.complaintId, complaint);
      }
    }

    return Array.from(results.values());
  }

  /**
   * Automatically escalate a single complaint:
   *  - status: 'submitted' -> 'under_review'
   *  - highPriority: true
   *  - writes an immutable statusUpdates ledger entry updated by
   *    'system-auto-escalation'
   */
  static async autoEscalate(complaintId: string): Promise<Complaint | null> {
    const complaint = inMemoryComplaints.get(complaintId);
    if (!complaint || complaint.status !== 'submitted') return null;

    const nowIso = new Date().toISOString();
    const updatedComplaint: Complaint = {
      ...complaint,
      status: 'under_review' as ComplaintStatus,
      highPriority: true,
    };

    const statusUpdateDoc: StatusUpdateDoc = {
      updateId: `STATUS_UPD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      complaintId,
      updatedBy: 'system-auto-escalation',
      oldStatus: complaint.status,
      newStatus: 'under_review',
      timestamp: nowIso,
    };

    if (isFirebaseLive && db) {
      try {
        const batch = db.batch();
        batch.update(db.collection(this.collections.complaints).doc(complaintId), {
          status: 'under_review',
          highPriority: true,
        });
        batch.set(db.collection(this.collections.statusUpdates).doc(statusUpdateDoc.updateId), statusUpdateDoc);
        await batch.commit();
      } catch (err: any) {
        console.warn(`[Firestore autoEscalate] ${err?.message}`);
      }
    }

    inMemoryStatusUpdates.push(statusUpdateDoc);
    inMemoryComplaints.set(complaintId, updatedComplaint);
    return updatedComplaint;
  }



  /**
   * Reset data to initial state
   */
  static async resetToDefaultSeed(): Promise<void> {
    inMemoryComplaints = new Map(SEED_COMPLAINTS.map((c) => [c.complaintId, normalizeComplaint(c)]));
    inMemoryUpvotes.clear();
    inMemoryStatusUpdates = [];
    inMemoryRevealLogs = [];
    inMemoryEscalationSettings = new Map();
  }

  /**
   * Read the immutable status-transition ledger, optionally filtered to one
   * complaint. Merges live Firestore and the in-memory sandbox, oldest first.
   */
  static async getStatusUpdates(complaintId?: string): Promise<StatusUpdateDoc[]> {
    let live: StatusUpdateDoc[] = [];

    if (isFirebaseLive && db) {
      try {
        let query: any = db.collection(this.collections.statusUpdates);
        if (complaintId) query = query.where('complaintId', '==', complaintId);
        const snapshot = await query.orderBy('timestamp', 'asc').get();
        live = snapshot.docs.map((docSnap: any) => docSnap.data());
      } catch (err: any) {
        console.warn(`[Firestore getStatusUpdates] ${err?.message}`);
      }
    }

    const memory = complaintId
      ? inMemoryStatusUpdates.filter((u) => u.complaintId === complaintId)
      : [...inMemoryStatusUpdates];

    const merged = new Map<string, StatusUpdateDoc>();
    [...live, ...memory].forEach((update) => merged.set(update.updateId, update));
    return Array.from(merged.values()).sort((a, b) =>
      (a.timestamp || '').localeCompare(b.timestamp || '')
    );
  }

  /**
   * Read the admin-tunable escalation settings (threshold + last run report).
   * Persisted in the `settings` collection when live Firestore is available,
   * otherwise served from the synchronized in-memory store.
   */
  static async getEscalationSettings(): Promise<EscalationSettingsDoc> {
    if (isFirebaseLive && db) {
      try {
        const docRef = db.collection(this.collections.settings).doc('escalation');
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data() as EscalationSettingsDoc;
          const merged: EscalationSettingsDoc = {
            settingsId: 'escalation',
            threshold: typeof data.threshold === 'number' ? data.threshold : DEFAULT_ESCALATION_THRESHOLD,
            defaultThreshold: DEFAULT_ESCALATION_THRESHOLD,
            updatedBy: data.updatedBy || 'system',
            updatedAt: data.updatedAt || new Date().toISOString(),
            lastRunAt: data.lastRunAt ?? null,
            lastRun: data.lastRun ?? null,
          };
          inMemoryEscalationSettings.set('escalation', merged);
          return merged;
        }

        const defaults = getDefaultEscalationSettings();
        await docRef.set(defaults);
        inMemoryEscalationSettings.set('escalation', defaults);
        return defaults;
      } catch (err: any) {
        console.warn(`[Firestore getEscalationSettings] ${err?.message}`);
      }
    }

    const cached = inMemoryEscalationSettings.get('escalation');
    if (cached) return cached;

    const defaults = getDefaultEscalationSettings();
    inMemoryEscalationSettings.set('escalation', defaults);
    return defaults;
  }

  /**
   * Persist a new automatic-escalation threshold (admin override).
   * The value is clamped to a sane 1..500 range.
   */
  static async setEscalationThreshold(threshold: number, updatedBy: string): Promise<EscalationSettingsDoc> {
    const clamped = Math.min(500, Math.max(1, Math.round(Number(threshold) || DEFAULT_ESCALATION_THRESHOLD)));

    const current = await this.getEscalationSettings();
    const updated: EscalationSettingsDoc = {
      ...current,
      threshold: clamped,
      updatedBy: updatedBy || 'system',
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.settings).doc('escalation').set(updated, { merge: true });
      } catch (err: any) {
        console.warn(`[Firestore setEscalationThreshold] ${err?.message}`);
      }
    }

    inMemoryEscalationSettings.set('escalation', updated);
    return updated;
  }

  /**
   * Store the summary of the most recent escalation sweep so admins can see
   * exactly what the system escalated and which departments were notified.
   */
  static async recordEscalationRun(report: EscalationRunReport): Promise<EscalationSettingsDoc> {
    const current = await this.getEscalationSettings();
    const updated: EscalationSettingsDoc = {
      ...current,
      threshold: typeof report.threshold === 'number' ? report.threshold : current.threshold,
      updatedBy: 'system-auto-escalation',
      updatedAt: report.ranAt,
      lastRunAt: report.ranAt,
      lastRun: report,
    };

    if (isFirebaseLive && db) {
      try {
        await db.collection(this.collections.settings).doc('escalation').set(updated, { merge: true });
      } catch (err: any) {
        console.warn(`[Firestore recordEscalationRun] ${err?.message}`);
      }
    }

    inMemoryEscalationSettings.set('escalation', updated);
    return updated;
  }
}
