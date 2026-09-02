# S.A.G.E. Firestore Database Schema & Security Architecture

This directory contains the production Firebase Firestore security rules, indexes, and schema definitions for the **5 core collections** of S.A.G.E. (Student Anonymous Grievance & Escalation System).

---

## 1. Core Collections Schema

### `1. users`
Stores role profiles with client-side encrypted identities.
- `userId` (string, auto UID)
- `encryptedIdentity` (string, AES-256 encrypted, never plain text)
- `role` (enum: `"student" | "admin" | "head_admin"`)
- `department` (string, e.g. "Computer Science & Engineering")
- `createdAt` (timestamp)

### `2. complaints`
Public-facing grievance records with cryptographic submitter references.
- `complaintId` (string, e.g. `"SAGE-2847"`, document ID)
- `encryptedUserRef` (string, AES-256 encrypted reference to submitter, not plain userId)
- `category` (enum: `"infrastructure" | "mess" | "harassment" | "wifi" | "hygiene" | "other"`)
- `description` (string, 20-1000 characters)
- `hostelOrLocation` (string, e.g. `"Hostel Block A - Room 204"`)
- `status` (enum: `"submitted" | "under_review" | "resolved"`)
- `upvoteCount` (number, default 0)
- `urgencyScore` (number, default 0, evaluated by ML microservice)
- `photoUrl` (string, optional)
- `createdAt` (timestamp)
- `resolutionNotes` (string, optional)
- `resolvedAt` (timestamp, optional)

### `3. upvotes`
Anonymous voting ledger preventing duplicate endorsements while preserving privacy.
- `upvoteId` (string, auto)
- `complaintId` (string, reference to complaint)
- `hashedVoterId` (string, SHA-256 hash string)
- `createdAt` (timestamp)

### `4. statusUpdates`
Append-only history of grievance status changes and administrative notes.
- `updateId` (string, auto)
- `complaintId` (string, reference to complaint)
- `updatedBy` (string, admin UID)
- `oldStatus` (string)
- `newStatus` (string)
- `timestamp` (timestamp)

### `5. revealLogs` (Strictly Immutable Audit Trail)
Audited emergency identity reveal records accessible exclusively to Head Admin.
- `logId` (string, auto)
- `complaintId` (string, reference to complaint)
- `revealedByAdminId` (string, Head Admin UID)
- `reason` (string, minimum 10 characters justifying emergency action)
- `timestamp` (timestamp)

---

## 2. Security Rules Guarantee

1. **Strict Identity Decoupling**: The rules reject any complaint document containing `studentName`, `studentEmail`, `studentId`, or plain `userId`.
2. **Access Hierarchy**:
   - `student`: Can lodge complaints, view public ledger, and upvote. Cannot access `revealLogs` or decrypted identities.
   - `admin`: Can update grievance status (`under_review`, `resolved`) and create `statusUpdates`. Cannot access reveal functions.
   - `head_admin`: Can trigger identity decryption and view `revealLogs`.
3. **Immutable Audits**: `revealLogs`, `statusUpdates`, and `upvotes` have `allow update, delete: if false;` preventing tampering or deletion.
