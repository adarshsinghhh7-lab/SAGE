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
   - `student`: Can lodge complaints, view public ledger, and upvote. **Cannot** open the Admin Dashboard (blocked at the router) and cannot perform any disposition write in Firestore.
   - `admin`: Can open the Admin Dashboard, update grievance status (`under_review`, `resolved`), and create `statusUpdates`. Cannot access reveal functions.
   - `head_admin`: Everything an `admin` can do, plus identity decryption triggers and `revealLogs` access.
3. **Immutable Audits**: `revealLogs`, `statusUpdates`, and `upvotes` have `allow update, delete: if false;` preventing tampering or deletion.
4. **Admin Dashboard Enforcement (dual-layer)**:
   - **UI routing**: The `admin` view only renders the dashboard for `admin` / `head_admin` roles. Students attempting to open it are redirected to an access-denied screen with no admin data and no identity-reveal action.
   - **Firestore rules**:
     - Complaints `update` Case B (`status` / `resolutionNotes` / `resolvedAt` / `urgencyScore`) requires `isAdmin()` and can only affect those allowed keys; identity fields are permanently rejected by the rules.
     - `statusUpdates` `create` requires `isAdmin()` and validates the full ledger payload (allowed transitions, `updatedBy` admin UID, ISO `timestamp`).
     - `settings` (auto-escalation engine) is readable/writable only by admin roles.
     - `revealLogs` remains Head-Admin-only and immutable.
   - The Admin Dashboard displays **no student identity information** and exposes **no reveal/decrypt button** in the UI.
