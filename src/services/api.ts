import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '../firebase/config';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  UserRole, 
  BackendHealthResponse,
  UpvoteDoc,
  StatusUpdateDoc,
  RevealLogDoc,
  EscalationSettingsDoc,
  EscalationRunReport
} from '../types';
import { 
  encryptAES, 
  decryptAES, 
  generateEncryptedUserRef, 
  getVoterHashedId 
} from '../utils/crypto';
import { INITIAL_COMPLAINTS } from '../data/initialComplaints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:5001/predict-urgency';
const STORAGE_KEY = 'sage_student_grievances_v2';
const UPVOTES_STORAGE_KEY_PREFIX = 'sage_user_upvotes_';

// Event bus for cross-component and cross-tab real-time sync when offline
const SYNC_EVENT_NAME = 'sage_realtime_upvote_sync';

export function normalizeComplaintData(raw: any, hasUpvoted?: boolean): Complaint {
  const complaintId = raw.complaintId || raw.id || 'SAGE-0000';
  const location = raw.hostelOrLocation || raw.location || 'Campus General';
  const upvoteCount = raw.upvoteCount !== undefined ? raw.upvoteCount : (raw.upvotes || 0);
  const urgencyScore = raw.urgencyScore !== undefined ? raw.urgencyScore : 0;
  const category = (raw.category || 'other').toLowerCase() as ComplaintCategory;
  const status = (raw.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus;

  let urgency: 'Standard' | 'Elevated' | 'Urgent' = 'Standard';
  if (category === 'harassment' || urgencyScore >= 0.75) {
    urgency = 'Urgent';
  } else if (urgencyScore >= 0.5) {
    urgency = 'Elevated';
  }

  return {
    ...raw,
    complaintId,
    encryptedUserRef: raw.encryptedUserRef || encryptAES(`ANON_${complaintId}`),
    category,
    description: raw.description || '',
    hostelOrLocation: location,
    status,
    upvoteCount,
    urgencyScore,
    createdAt: raw.createdAt || new Date().toISOString(),
    resolutionNotes: raw.resolutionNotes,
    resolvedAt: raw.resolvedAt,
    hasUpvoted: hasUpvoted !== undefined ? hasUpvoted : !!raw.hasUpvoted,
    // UI aliases
    id: complaintId,
    location,
    upvotes: upvoteCount,
    urgency,
  };
}

export class ApiService {
  /**
   * Helper to perform HTTP requests with role & voter headers
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    activeRole: UserRole = 'student',
    userId?: string
  ): Promise<T> {
    const voterHash = getVoterHashedId(userId);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-sage-role': activeRole,
      'x-sage-voter-id': voterHash,
      ...(userId ? { 'x-sage-uid': userId } : {}),
      ...(options.headers as Record<string, string>),
    };

    const url = `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || errorData.message || `HTTP error ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Check Backend & Firebase Connection Health
   */
  static async checkHealth(): Promise<BackendHealthResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend offline
    }
    return null;
  }

  /**
   * Predict Urgency via ML Microservice
   */
  static async predictUrgency(text: string): Promise<{ urgency_score: number; label: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(ML_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback NLP heuristic
    }

    const lower = text.toLowerCase();
    const isUrgent = /spark|fire|shock|harass|threat|stalk|danger|trapped|elevator|fume|gas|assault|bleed|injured|shatter/.test(lower);
    return {
      urgency_score: isUrgent ? 0.94 : 0.2,
      label: isUrgent ? 'urgent' : 'normal',
    };
  }

  /**
   * Fetch all complaint IDs upvoted by the current user from real Firestore data
   */
  static async getUserUpvotedIds(userId?: string): Promise<Set<string>> {
    const hashedVoterId = getVoterHashedId(userId);
    const upvotedIds = new Set<string>();

    // 1. Query Firestore upvotes collection directly
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const upvotesRef = collection(firestoreDb, 'upvotes');
        const q = query(upvotesRef, where('hashedVoterId', '==', hashedVoterId));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.complaintId) {
            upvotedIds.add(data.complaintId);
          }
        });
        if (upvotedIds.size > 0) {
          localStorage.setItem(`${UPVOTES_STORAGE_KEY_PREFIX}${hashedVoterId}`, JSON.stringify(Array.from(upvotedIds)));
          return upvotedIds;
        }
      } catch (err) {
        console.warn('[Firestore getUserUpvotedIds]', err);
      }
    }

    // 2. Query Backend API
    try {
      const response = await this.request<{ success: boolean; data: string[] }>(
        '/complaints/user-upvotes',
        { method: 'GET' },
        'student',
        userId
      );
      if (response && Array.isArray(response.data)) {
        response.data.forEach((id) => upvotedIds.add(id));
        localStorage.setItem(`${UPVOTES_STORAGE_KEY_PREFIX}${hashedVoterId}`, JSON.stringify(Array.from(upvotedIds)));
        return upvotedIds;
      }
    } catch {
      // Backend offline or endpoint not yet loaded
    }

    // 3. Fallback to local storage cache
    try {
      const cached = localStorage.getItem(`${UPVOTES_STORAGE_KEY_PREFIX}${hashedVoterId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => upvotedIds.add(id));
        }
      }
    } catch {
      // ignore
    }

    return upvotedIds;
  }

  /**
   * Subscribe to real-time complaint updates from Firestore with live upvoteCount synchronization
   */
  static subscribeToComplaints(
    onUpdate: (complaints: Complaint[]) => void,
    userId?: string,
    activeRole: UserRole = 'student'
  ): () => void {
    const hashedVoterId = getVoterHashedId(userId);
    let userUpvotedIds = new Set<string>();
    let latestComplaintsMap = new Map<string, any>();

    // Helper to merge complaints with user's real upvoted state
    const emitMergedList = () => {
      const list: Complaint[] = [];
      latestComplaintsMap.forEach((raw, compId) => {
        const hasUpvoted = userUpvotedIds.has(compId) || userUpvotedIds.has(raw.complaintId || raw.id);
        list.push(normalizeComplaintData({ ...raw, complaintId: compId }, hasUpvoted));
      });

      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        onUpdate(list);
      }
    };

    let unsubComplaints: Unsubscribe = () => {};
    let unsubUpvotes: Unsubscribe = () => {};

    if (isFirebaseConfigured && firestoreDb) {
      try {
        // Real-time listener for complaints collection
        const complaintsRef = collection(firestoreDb, 'complaints');
        unsubComplaints = onSnapshot(complaintsRef, (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              latestComplaintsMap.set(docSnap.id, { ...docSnap.data(), complaintId: docSnap.id });
            });
            emitMergedList();
          }
        }, (err) => {
          console.warn('[Firestore Realtime Complaints Error]', err);
        });

        // Real-time listener for current user's upvotes
        const upvotesRef = collection(firestoreDb, 'upvotes');
        const q = query(upvotesRef, where('hashedVoterId', '==', hashedVoterId));
        unsubUpvotes = onSnapshot(q, (snapshot) => {
          const freshUpvotes = new Set<string>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.complaintId) freshUpvotes.add(data.complaintId);
          });
          userUpvotedIds = freshUpvotes;
          localStorage.setItem(`${UPVOTES_STORAGE_KEY_PREFIX}${hashedVoterId}`, JSON.stringify(Array.from(freshUpvotes)));
          emitMergedList();
        }, (err) => {
          console.warn('[Firestore Realtime Upvotes Error]', err);
        });
      } catch (err) {
        console.warn('[Firestore Subscription Init]', err);
      }
    }

    // Initial async fetch for fallback / backend data
    this.getUserUpvotedIds(userId).then((upvoted) => {
      userUpvotedIds = upvoted;
      this.getComplaints({}, activeRole, userId).then((list) => {
        list.forEach((c) => latestComplaintsMap.set(c.complaintId, c));
        emitMergedList();
      });
    });

    // Cross-tab and local event sync listener
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ complaintId: string; hashedVoterId: string; newCount: number }>;
      if (customEvent.detail) {
        const { complaintId, hashedVoterId: evtVoterId, newCount } = customEvent.detail;
        if (evtVoterId === hashedVoterId) {
          userUpvotedIds.add(complaintId);
        }
        const existing = latestComplaintsMap.get(complaintId);
        if (existing) {
          latestComplaintsMap.set(complaintId, { ...existing, upvoteCount: newCount, upvotes: newCount });
        }
        emitMergedList();
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSyncEvent);

    // Return cleanup function
    return () => {
      unsubComplaints();
      unsubUpvotes();
      window.removeEventListener(SYNC_EVENT_NAME, handleSyncEvent);
    };
  }

  /**
   * Get all complaints (Live Firestore / Express / Local Cache) checked against real upvote data
   */
  static async getComplaints(
    filters: {
      category?: string;
      status?: string;
      location?: string;
      search?: string;
      sortBy?: string;
    } = {},
    activeRole: UserRole = 'student',
    userId?: string
  ): Promise<Complaint[]> {
    const userUpvotedIds = await this.getUserUpvotedIds(userId);

    // 1. Try Live Firestore Direct Client if configured
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const complaintsRef = collection(firestoreDb, 'complaints');
        const snapshot = await getDocs(complaintsRef);
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const compId = docSnap.id;
            const hasUpvoted = userUpvotedIds.has(compId);
            return normalizeComplaintData({ ...docSnap.data(), complaintId: compId }, hasUpvoted);
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          return this.applyClientFilters(list, filters);
        }
      } catch (err) {
        console.warn('[Firestore Client Direct]', err);
      }
    }

    // 2. Try Backend API
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await this.request<{ success: boolean; data: Complaint[] }>(
        `/complaints${queryStr}`,
        { method: 'GET' },
        activeRole,
        userId
      );

      if (response && response.data) {
        const normalized = response.data.map((c) => {
          const hasUpvoted = userUpvotedIds.has(c.complaintId || c.id || '');
          return normalizeComplaintData(c, hasUpvoted);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      // ignore
    }

    // 3. Fallback to Local Storage / Seed Dataset
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.applyClientFilters(
            parsed.map((c) => {
              const hasUpvoted = userUpvotedIds.has(c.complaintId || c.id || '');
              return normalizeComplaintData(c, hasUpvoted);
            }),
            filters
          );
        }
      }
    } catch {
      // ignore
    }

    const defaultSeeded = INITIAL_COMPLAINTS.map((c) => {
      const hasUpvoted = userUpvotedIds.has(c.complaintId || c.id || '');
      return normalizeComplaintData(c, hasUpvoted);
    });
    return this.applyClientFilters(defaultSeeded, filters);
  }

  private static applyClientFilters(complaints: Complaint[], filters: any): Complaint[] {
    return complaints.filter((c) => {
      if (filters.category && filters.category !== 'All') {
        const filterCat = filters.category.toLowerCase().replace('/', '_');
        const compCat = c.category.toLowerCase().replace('/', '_');
        if (!compCat.includes(filterCat) && !filterCat.includes(compCat)) return false;
      }
      if (filters.status && filters.status !== 'All') {
        const filterSt = filters.status.toLowerCase().replace(' ', '_');
        const compSt = c.status.toLowerCase().replace(' ', '_');
        if (filterSt === 'high_priority' || filterSt === 'urgent') {
          if (c.urgencyScore < 0.75 || compSt === 'resolved') return false;
        } else if (compSt !== filterSt) return false;
      }
      if (filters.location && filters.location !== 'All') {
        if (!c.hostelOrLocation.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchId = c.complaintId.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchLoc = c.hostelOrLocation.toLowerCase().includes(q);
        if (!matchId && !matchDesc && !matchLoc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'upvotes') return b.upvoteCount - a.upvoteCount;
      if (filters.sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Create an anonymous complaint with AES-encrypted identity in complaints collection
   */
  static async createComplaint(
    payload: {
      category: string;
      description: string;
      hostelOrLocation?: string;
      location?: string;
      photoUrl?: string;
      plainIdentity?: string; // Optional student roll or email that gets AES encrypted
    },
    activeRole: UserRole = 'student',
    userId?: string
  ): Promise<Complaint> {
    const complaintId = `SAGE-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveLoc = payload.hostelOrLocation || payload.location || 'Campus General';
    const normCategory = payload.category.toLowerCase().replace('/', '_') as ComplaintCategory;

    // Encrypt identity before storing using AES-256 (Never Plain Text)
    const encryptedUserRef = payload.plainIdentity 
      ? encryptAES(payload.plainIdentity)
      : generateEncryptedUserRef();

    // Evaluate ML Urgency
    const mlResult = await this.predictUrgency(payload.description);

    const newComplaint: Complaint = normalizeComplaintData({
      complaintId,
      encryptedUserRef,
      category: normCategory,
      description: payload.description.trim(),
      hostelOrLocation: effectiveLoc.trim(),
      status: 'submitted',
      upvoteCount: 1,
      urgencyScore: mlResult.urgency_score,
      photoUrl: payload.photoUrl,
      createdAt: new Date().toISOString(),
      hasUpvoted: true,
    }, true);

    const voterHash = getVoterHashedId(userId);
    const upvoteDocId = `${complaintId}_${voterHash}`;

    // 1. Write to live Firestore if configured
    if (isFirebaseConfigured && firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'complaints', complaintId), newComplaint);
        await setDoc(doc(firestoreDb, 'upvotes', upvoteDocId), {
          upvoteId: upvoteDocId,
          complaintId,
          hashedVoterId: voterHash,
          createdAt: new Date().toISOString(),
        } as UpvoteDoc);
      } catch (err) {
        console.warn('[Firestore createComplaint]', err);
      }
    }

    // 2. Try Backend API
    try {
      await this.request('/complaints', {
        method: 'POST',
        body: JSON.stringify(newComplaint),
      }, activeRole, userId);
    } catch {
      // local sync
    }

    // 3. Update local cache & upvoted set
    const current = await this.getComplaints({}, activeRole, userId);
    const updated = [newComplaint, ...current.filter((c) => c.complaintId !== complaintId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const userUpvotedIds = await this.getUserUpvotedIds(userId);
    userUpvotedIds.add(complaintId);
    localStorage.setItem(`${UPVOTES_STORAGE_KEY_PREFIX}${voterHash}`, JSON.stringify(Array.from(userUpvotedIds)));

    return newComplaint;
  }

  /**
   * Upvote a complaint (creates record in upvotes collection with SHA-256 hash of user ID)
   * Prevents duplicate votes by checking real Firestore data
   * Updates upvoteCount on the complaint document in real time
   */
  static async upvoteComplaint(
    complaintId: string,
    userId?: string,
    activeRole: UserRole = 'student'
  ): Promise<{ complaint: Complaint; alreadyUpvoted: boolean }> {
    // 1. Hash current user's ID with SHA-256 to prevent duplicate votes without storing identity
    const hashedVoterId = getVoterHashedId(userId);
    const upvoteDocId = `${complaintId}_${hashedVoterId}`;

    let alreadyUpvotedInFirestore = false;
    let updatedCountFromFirestore = 0;

    // 2. Check & update in Live Firestore Direct Client
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const upvoteRef = doc(firestoreDb, 'upvotes', upvoteDocId);
        const upvoteSnap = await getDoc(upvoteRef);

        if (upvoteSnap.exists()) {
          alreadyUpvotedInFirestore = true;
          const comp = await this.getComplaintById(complaintId, activeRole);
          return { complaint: { ...comp!, hasUpvoted: true }, alreadyUpvoted: true };
        }

        // Store anonymous upvote record in Firestore upvotes collection
        await setDoc(upvoteRef, {
          upvoteId: upvoteDocId,
          complaintId,
          hashedVoterId,
          createdAt: new Date().toISOString(),
        } as UpvoteDoc);

        // Update upvoteCount on the complaint document in real time
        const complaintRef = doc(firestoreDb, 'complaints', complaintId);
        await updateDoc(complaintRef, {
          upvoteCount: increment(1),
        });

        const refreshedDoc = await getDoc(complaintRef);
        if (refreshedDoc.exists()) {
          updatedCountFromFirestore = (refreshedDoc.data() as any).upvoteCount || 0;
        }
      } catch (err) {
        console.warn('[Firestore upvote]', err);
      }
    }

    // 3. Backend API sync
    try {
      const response = await this.request<{ success: boolean; data: Complaint; alreadyUpvoted: boolean }>(
        `/complaints/${complaintId}/upvote`,
        { method: 'POST' },
        activeRole,
        userId
      );
      if (response && response.data) {
        const norm = normalizeComplaintData(response.data, true);
        this.broadcastLocalSync(complaintId, hashedVoterId, norm.upvoteCount);
        return { complaint: norm, alreadyUpvoted: !!response.alreadyUpvoted };
      }
    } catch {
      // local fallback
    }

    if (alreadyUpvotedInFirestore) {
      const comp = await this.getComplaintById(complaintId, activeRole);
      return { complaint: { ...comp!, hasUpvoted: true }, alreadyUpvoted: true };
    }

    // 4. Update Local Storage Cache & trigger real-time event
    const current = await this.getComplaints({}, activeRole, userId);
    let target = current.find((c) => c.complaintId === complaintId || c.id === complaintId);
    if (!target) return { complaint: current[0], alreadyUpvoted: false };

    const newCount = updatedCountFromFirestore > 0 ? updatedCountFromFirestore : (target.upvoteCount + 1);
    const updatedTarget: Complaint = {
      ...target,
      upvoteCount: newCount,
      upvotes: newCount,
      hasUpvoted: true,
    };

    const updatedList = current.map((c) => (c.complaintId === complaintId || c.id === complaintId ? updatedTarget : c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // Save upvote record in local user voter set
    const userUpvotedIds = await this.getUserUpvotedIds(userId);
    userUpvotedIds.add(complaintId);
    localStorage.setItem(`${UPVOTES_STORAGE_KEY_PREFIX}${hashedVoterId}`, JSON.stringify(Array.from(userUpvotedIds)));

    this.broadcastLocalSync(complaintId, hashedVoterId, newCount);

    return { complaint: updatedTarget, alreadyUpvoted: false };
  }

  private static broadcastLocalSync(complaintId: string, hashedVoterId: string, newCount: number) {
    try {
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT_NAME, {
          detail: { complaintId, hashedVoterId, newCount },
        })
      );
    } catch {
      // ignore
    }
  }

  /**
   * Update complaint status.
   *
   * Live Firestore path: reads the current complaint document to determine the
   * TRUE `oldStatus`, then atomically updates the `complaints/{id}` document
   * AND appends a NEW immutable document to the `statusUpdates` collection on
   * every transition (via writeBatch). No-op transitions (same status) are
   * skipped so the ledger only contains real changes.
   */
  static async updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    resolutionNotes: string,
    activeRole: UserRole = 'admin',
    adminId?: string
  ): Promise<Complaint | null> {
    const normStatus = status.toLowerCase().replace(' ', '_') as ComplaintStatus;
    const nowIso = new Date().toISOString();
    const updatedById = adminId || activeRole;

    // 1. Live Firestore
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const complaintRef = doc(firestoreDb, 'complaints', complaintId);
        const currentSnap = await getDoc(complaintRef);

        if (currentSnap.exists()) {
          const currentRaw = currentSnap.data() as any;
          const oldStatus = (currentRaw.status || 'submitted').toLowerCase().replace(' ', '_');

          const isStatusChange = oldStatus !== normStatus;
          const isNewlyResolved = normStatus === 'resolved' && oldStatus !== 'resolved';

          const updatePayload: any = {};
          if (isStatusChange) updatePayload.status = normStatus;
          if (resolutionNotes) updatePayload.resolutionNotes = resolutionNotes;
          if (isNewlyResolved) updatePayload.resolvedAt = nowIso;

          // Pure no-op (same status, no new notes): nothing to commit, and no
          // statusUpdates row is created so the ledger only records real changes.
          if (Object.keys(updatePayload).length === 0) {
            return normalizeComplaintData({ ...currentRaw, complaintId });
          }

          const updateId = `STATUS_UPD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const statusUpdateDoc: StatusUpdateDoc = {
            updateId,
            complaintId,
            updatedBy: updatedById,
            oldStatus,
            newStatus: normStatus,
            timestamp: nowIso,
          };

          // Atomically commit the complaint change; a status transition also
          // appends an immutable ledger entry in the same writeBatch.
          const batch = writeBatch(firestoreDb);
          batch.update(complaintRef, updatePayload);
          if (isStatusChange) {
            batch.set(doc(firestoreDb, 'statusUpdates', updateId), statusUpdateDoc);
          }
          await batch.commit();

          return normalizeComplaintData({ ...currentRaw, ...updatePayload, complaintId }, false);
        }
      } catch (err) {
        console.warn('[Firestore updateStatus]', err);
      }
    }

    // 2. Backend API
    try {
      const response = await this.request<{ success: boolean; data: Complaint }>(
        `/complaints/${complaintId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: normStatus, resolutionNotes }),
        },
        activeRole
      );
      if (response && response.data) {
        return normalizeComplaintData(response.data);
      }
    } catch {
      // local fallback
    }

    const current = await this.getComplaints({}, activeRole);
    const updatedList = current.map((c) => {
      if (c.complaintId === complaintId) {
        const isNewlyResolved = normStatus === 'resolved' && c.status !== 'resolved';
        return normalizeComplaintData({
          ...c,
          status: normStatus,
          resolutionNotes: resolutionNotes || c.resolutionNotes,
          resolvedAt: isNewlyResolved ? nowIso : c.resolvedAt,
        });
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList.find((c) => c.complaintId === complaintId) || null;
  }

  /**
   * Trigger Identity Reveal (Head Admin only, commits to immutable revealLogs)
   */
  static async triggerIdentityReveal(
    complaintId: string,
    reason: string,
    activeRole: UserRole = 'head_admin',
    userId?: string
  ): Promise<{ decryptedIdentity: string; logId: string; timestamp: string }> {
    if (activeRole !== 'head_admin') {
      throw new Error('Unauthorized: Only Head Admin can trigger identity reveal.');
    }

    // 1. Backend API
    try {
      const response = await this.request<{ success: boolean; data: any }>(
        `/complaints/${complaintId}/reveal`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        },
        activeRole,
        userId
      );
      if (response && response.data) {
        return {
          decryptedIdentity: response.data.decryptedUserRef,
          logId: response.data.auditLogId,
          timestamp: response.data.timestamp,
        };
      }
    } catch {
      // local fallback
    }

    // 2. Client Decryption & Firestore write
    const comp = await this.getComplaintById(complaintId, activeRole);
    if (!comp) throw new Error('Complaint not found.');

    const decrypted = decryptAES(comp.encryptedUserRef);
    const logId = `REVEAL_${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (isFirebaseConfigured && firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'revealLogs', logId), {
          logId,
          complaintId,
          revealedByAdminId: userId || 'head_admin_client',
          reason,
          timestamp: nowIso,
        } as RevealLogDoc);
      } catch (err) {
        console.warn('[Firestore revealLogs write]', err);
      }
    }

    return {
      decryptedIdentity: decrypted,
      logId,
      timestamp: nowIso,
    };
  }

  /**
   * Fetch the immutable reveal audit ledger (`revealLogs` collection).
   * Strictly Head-Admin-only — the backend route and Firestore security rules
   * reject regular `admin` / `student` roles. Returns records newest-first.
   */
  static async getRevealLogs(
    activeRole: UserRole = 'head_admin'
  ): Promise<RevealLogDoc[]> {
    if (activeRole !== 'head_admin') {
      throw new Error('Unauthorized: Only Head Admin can read the reveal audit log.');
    }

    // 1. Live Firestore direct client read (enforced Head-Admin-only by rules)
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const logsRef = collection(firestoreDb, 'revealLogs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => docSnap.data() as RevealLogDoc);
        }
      } catch (err) {
        console.warn('[Firestore getRevealLogs]', err);
      }
    }

    // 2. Backend API sync attempt (requireHeadAdmin on the route)
    try {
      const response = await this.request<{ success: boolean; data: RevealLogDoc[] }>(
        '/complaints/reveal-logs',
        { method: 'GET' },
        activeRole
      );
      if (response && Array.isArray(response.data)) {
        return [...response.data].sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
      }
    } catch {
      // backend unavailable
    }

    return [];
  }

  /**
   * Get single complaint by ID
   */
  static async getComplaintById(complaintId: string, activeRole: UserRole = 'student'): Promise<Complaint | null> {
    const list = await this.getComplaints({}, activeRole);
    return list.find((c) => c.complaintId === complaintId || c.id === complaintId) || null;
  }

  /**
   * Fetch the immutable status transition ledger for a single complaint.
   * Returns a chronological list of StatusUpdateDoc entries pulled from the
   * `statusUpdates` Firestore collection, ordered oldest-first. When live
   * Firestore is unavailable it falls back to any locally cached records.
   */
  static async getStatusUpdates(complaintId: string): Promise<StatusUpdateDoc[]> {
    // 1. Live Firestore direct client read
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const statusUpdatesRef = collection(firestoreDb, 'statusUpdates');
        const q = query(
          statusUpdatesRef,
          where('complaintId', '==', complaintId),
          orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const updates = snapshot.docs.map((docSnap) => docSnap.data() as StatusUpdateDoc);
          // Persist locally so the timeline survives offline refreshes
          try {
            const cacheKey = `sage_status_updates_${complaintId}`;
            localStorage.setItem(cacheKey, JSON.stringify(updates));
          } catch {
            // ignore storage errors
          }
          return updates;
        }
      } catch (err) {
        console.warn('[Firestore getStatusUpdates]', err);
      }
    }

    // 2. Fallback: locally cached status updates (written during admin updates)
    try {
      const cacheKey = `sage_status_updates_${complaintId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((u) => u && u.complaintId === complaintId)
            .sort(
              (a, b) =>
                new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
            );
        }
      }
    } catch {
      // ignore storage errors
    }

    // 3. Backend API sync attempt
    try {
      const response = await this.request<{ success: boolean; data: StatusUpdateDoc[] }>(
        `/complaints/${complaintId}/status-updates`,
        { method: 'GET' },
        'student'
      );
      if (response && Array.isArray(response.data)) {
        const updates = response.data.sort(
          (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );
        try {
          localStorage.setItem(`sage_status_updates_${complaintId}`, JSON.stringify(updates));
        } catch {
          // ignore
        }
        return updates;
      }
    } catch {
      // endpoint may not exist yet on backend; ignore
    }

    return [];
  }

  /**
   * Read the admin-tunable auto-escalation settings (threshold + last run report).
   * Admin-only backend endpoint: GET /api/settings/escalation
   */
  static async getEscalationSettings(activeRole: UserRole = 'admin'): Promise<EscalationSettingsDoc | null> {
    try {
      const response = await this.request<{ success: boolean; data: EscalationSettingsDoc }>(
        '/settings/escalation',
        { method: 'GET' },
        activeRole
      );
      return response?.data ?? null;
    } catch (err) {
      console.warn('[getEscalationSettings] Backend unavailable:', err);
      return null;
    }
  }

  /**
   * Update the auto-escalation upvote threshold (clamped 1..500 by the backend).
   * Admin-only backend endpoint: PUT /api/settings/escalation/threshold
   */
  static async setEscalationThreshold(
    threshold: number,
    activeRole: UserRole = 'admin'
  ): Promise<EscalationSettingsDoc> {
    const response = await this.request<{ success: boolean; data: EscalationSettingsDoc }>(
      '/settings/escalation/threshold',
      {
        method: 'PUT',
        body: JSON.stringify({ threshold }),
      },
      activeRole
    );
    if (!response?.data) {
      throw new Error('Backend returned no escalation settings.');
    }
    return response.data;
  }

  /**
   * Manually trigger an auto-escalation sweep right now (skips the hourly wait).
   * Admin-only backend endpoint: POST /api/settings/escalation/run
   */
  static async runEscalationSweep(activeRole: UserRole = 'admin'): Promise<EscalationRunReport> {
    const response = await this.request<{ success: boolean; data: EscalationRunReport }>(
      '/settings/escalation/run',
      { method: 'POST', body: JSON.stringify({}) },
      activeRole
    );
    if (!response?.data) {
      throw new Error('Backend returned no escalation report.');
    }
    return response.data;
  }

  /**
   * Reset to initial seed
   */
  static async resetSeed(activeRole: UserRole = 'head_admin'): Promise<void> {
    try {
      await this.request('/complaints/reset', { method: 'POST' }, activeRole);
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS.map((c) => normalizeComplaintData(c))));
  }
}
