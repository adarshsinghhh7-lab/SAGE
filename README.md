<div align="center">

# 🎓 S.A.G.E.

### **Student Anonymous Grievance & Escalation System**

*A privacy-first campus complaint platform with ML-powered urgency scoring, server-sealed identity, and an audited reveal protocol for fake-complaint accountability*

---

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](#license)

</div>

---

## ✨ Overview

S.A.G.E. is a full-stack web application that enables **anonymous** reporting of campus grievances — from infrastructure issues to harassment — while keeping student identities cryptographically **sealed** and reversible only through a strictly audited Head-Admin protocol.

**Key principles:**
- 🔐 **Server-sealed anonymity** — The backend AES-256-encrypts each verified UID with the server-only `SAGE_MASTER_KEY` at deposit time. No plaintext identity ever reaches the browser, an API response, or the database, and the ciphertext is stripped from every client-facing payload.
- 🪪 **Verified deposits only** — Filing a complaint requires a verified (non-anonymous) college sign-in; Firebase anonymous accounts are rejected. “Anonymous” means *identity concealment*, never *ownerless*.
- ⚖️ **Tracked fake complaints** — Any admin can flag a complaint as **Disputed** (suspected false/malicious) with a written justification. The Head Admin can then decrypt the sealed identity **at any time**, with a mandatory written reason, while every reveal is appended to a permanent, immutable `revealLogs` audit ledger.
- 🤖 **ML-driven triage** — A TF-IDF + Logistic Regression microservice scores urgency in real time, with an intelligent NLP keyword fallback when the model is offline.
- 📊 **Community-powered** — An anonymous upvote system (SHA-256-hashed voter IDs) surfaces the most impactful issues.
- 🛡️ **Dual-layer security** — Firestore security rules *and* role-based UI routing enforce access control.
- 📝 **Immutable audit trails** — Every identity reveal, status change, and dispute flag is permanently logged.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                        │
│  Vite 6 · TypeScript · Tailwind CSS 4 · Motion · Recharts     │
│  LandingPage · SubmissionForm · PublicFeed · ComplaintDetail   │
│  AdminDashboard (+ FlagDisputedModal)                          │
│  HeadAdminDashboard (+ RevealIdentityModal · Reveal Logs)      │
│  AuthContext · services/api.ts (VITE_API_URL, default /api)    │
└───────────────────────┬────────────────────────────────────────┘
                        │  /api (proxied by the Vite dev server)
┌───────────────────────▼────────────────────────────────────────┐
│           S.A.G.E. BACKEND — Express.js on :5000               │
│  authenticate()  Firebase Admin JWT  OR  dev role headers      │
│  Identity Sealing — AES-256 encrypts the verified UID          │
│  Reveal protocol — decrypt + immutable revealLogs write        │
│  Dispute flags · statusUpdates · hourly escalation scheduler   │
└───────────────┬──────────────────────────────┬─────────────────┘
                │ Firestore Admin SDK           │ HTTP request
   ┌────────────▼─────────────┐   ┌────────────▼───────────────┐
   │ Firebase Firestore + Auth │   │ ML MICROSERVICE — :5001    │
   │ (or in-memory sandbox     │   │ Flask · scikit-learn       │
   │  when no service account) │   │ TF-IDF + LogReg (joblib)   │
   └──────────────────────────┘   └───────────────┬─────────────┘
                                                   │ unreachable →
                                       NLP keyword fallback in backend
```

---

## 🔐 How the fake-case owner is tracked (Identity Reveal Protocol)

S.A.G.E. uses **sealed anonymity** — the system does *not* throw identities away. Every complaint is cryptographically bound to the verified account that filed it; the binding is simply invisible to everyone except the Head Admin.

### Phase 1 — Sealing at submission (server-side only)

1. A student signs in with their **verified college account** (Firebase). Anonymous sign-in is **rejected** — the backend refuses to deposit ownerless complaints.
2. `POST /api/complaints` validates the payload. Identity fields such as `studentName`, `studentEmail`, `studentId`, `rollNumber`, `userId`, `plainIdentity`, and even `encryptedUserRef` are **forbidden** from the request body (HTTP 400).
3. The backend AES-encrypts the verified Firebase UID with the server-only `SAGE_MASTER_KEY` → `encryptedUserRef` ciphertext. This happens **only on the server** — never in the browser.
4. Only the ciphertext is stored on the complaint document. `sanitizeComplaint()` strips it from every API response, so no client, admin page, or network observer ever sees it.

### Phase 2 — An admin flags the complaint as “Disputed”

1. An admin (or Head Admin) suspects a complaint is false or malicious and opens **Flag Disputed** (`FlagDisputedModal`).
2. A written suspicion justification (minimum **10 characters**) is required before the flag is accepted.
3. `POST /api/complaints/:id/dispute` stores `disputed: true`, `disputeReason`, `disputedAt`, `disputedBy` **and** appends an audited `statusUpdates` entry naming the flagging admin.
4. A red **Disputed** badge appears on the complaint in the Admin and Head Admin dashboards, with the reason shown on hover — this is how suspicious cases surface for investigation.

### Phase 3 — The Head Admin reveals the owner

1. Only the **Head Admin** role can reveal. Regular admins and students get **HTTP 403** (`requireHeadAdmin`).
2. The Head Admin clicks **Reveal Identity** on the complaint — and the reveal is **ungated**: it works with or without the dispute flag, so a suspicious deposition can be investigated immediately.
3. The modal requires a **written legal justification (minimum 10 characters)** — the confirm button stays disabled until it is provided.
4. Backend `triggerIdentityReveal()` decrypts `encryptedUserRef` with `SAGE_MASTER_KEY` → the **submitter’s plaintext UID**, and writes a **permanent, immutable** `revealLogs` entry:

| Field | Value |
|-------|-------|
| `logId` | Auto-generated, e.g. `REVEAL_LOG_1699…` |
| `complaintId` | The complaint under investigation |
| `revealedByAdminId` | **The Head Admin’s own UID** — the reveal itself is attributable |
| `reason` | The written justification |
| `timestamp` | When the reveal happened |

5. The Head Admin resolves the revealed UID to the student via the account registry (`users` collection — itself AES-encrypted — or Firebase Auth) and takes the appropriate disciplinary/adjudication action.
6. The full ledger remains readable at `GET /api/complaints/reveal-logs` — Head Admin only, newest first.

> ⚖️ **Why this stops fake complaints without breaking anonymity**
> - Filing *requires* a verified sign-in, so a fabricated complaint always has a **sealed owner**.
> - Ordinary admins and graders never see any identity — the ciphertext never leaves the backend.
> - A reveal is a **serious, logged, attributed action**: the Head Admin who ordered it is recorded together with the reason, deterring casual or vindictive reveals.
> - Sandbox/seed records (`isSandbox: true` on the doc) are demo data only and decrypt to fake references, never to a real student.

---
## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | ≥ 18 | Frontend + backend runtime |
| [Python](https://www.python.org) | ≥ 3.10 | ML microservice |
| [Firebase](https://console.firebase.google.com) | optional | Live Firestore & Auth (falls back to an in-memory sandbox) |

### 1. Clone & install

```bash
git clone https://github.com/your-org/sage.git
cd sage
npm install                            # root deps (backend, tooling, tsx)
cd frontend && npm install && cd ..    # frontend deps (react, vite, tailwind, …)
pip install -r requirements.txt        # ML microservice dependencies
```

### 2. Configure environment (optional)

```bash
cp .env.example .env
```

| Variable | Purpose | Default |
|----------|---------|---------|
| `SAGE_MASTER_KEY` | Server-only AES key that seals identities. **Required in production** — the backend refuses to start without it. In development a clearly-labelled fallback key is used, with a loud warning that it must never protect real data. | dev fallback key |
| `ML_SERVICE_URL` | Urgency-scoring endpoint | `http://localhost:5001/predict-urgency` |
| `VITE_API_URL` | Backend base URL used by the browser | `/api` (dev-server proxy to :5000) |
| `PORT` | Backend listen port | `5000` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` / `GOOGLE_APPLICATION_CREDENTIALS` | Service-account JSON (or path) to connect to live Firestore + Auth | — (sandbox mode) |

### 3. Start the services

```bash
# Terminal 1 — Frontend on :3000 (Vite auto-starts the backend if :5000 is free)
npm run dev

# Terminal 2 — Backend / Sealing Server on :5000 (only if not already auto-started)
npm run dev:backend

# Terminal 3 — ML microservice on :5001
python ml-service/app.py
```

Open **http://localhost:3000** 🎉

> 💡 **Try the reveal flow locally** — switch the role to **Admin** in the navbar and flag a complaint as **Disputed**, then switch to **Head Admin** and use **Reveal Identity** (a written reason of at least 10 characters is enforced). A scripted end-to-end check lives in `scripts/e2e-reveal-test.mjs`.

---

## 🔌 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/health` | public | Health check + Firestore status |
| `GET` | `/api/complaints` | public | List complaints (sanitized — identity data never leaves the backend) |
| `GET` | `/api/complaints/:id` | public | Single complaint detail |
| `POST` | `/api/complaints` | verified student | Deposit complaint; backend seals the UID (anonymous sign-ins rejected) |
| `POST` | `/api/complaints/:id/upvote` | public | Upvote with SHA-256 hashed voter ID |
| `POST` | `/api/complaints/reset` | public | Reset sandbox demo data |
| `PATCH` | `/api/complaints/:id/status` | admin / head admin | Update status + audited `statusUpdates` entry |
| `POST` | `/api/complaints/:id/dispute` | admin / head admin | Flag as suspected false/malicious (audited) |
| `POST` | `/api/complaints/:id/reveal` | **head admin only** | Decrypt the sealed identity + immutable `revealLogs` write |
| `GET` | `/api/complaints/reveal-logs` | **head admin only** | Read the immutable reveal audit ledger (newest first) |
| `DELETE` | `/api/complaints/:id` | **head admin only** | Delete a complaint |
| `GET` | `/api/analytics` | public | Dashboard analytics counts |
| `GET/PUT` | `/api/settings/escalation[/threshold]` | admin / head admin | Tune the auto-escalation threshold |
| `POST` | `/api/settings/escalation/run` | admin / head admin | Run an escalation sweep immediately |
| `GET` | `/api/auth/me` | signed-in | Current user + role |
| `POST` | `/api/auth/set-role` | **head admin only** | Assign a role to a user |
| `POST` | `/api/auth/bootstrap-admin` | signed-in (one-time) | Bootstrap the **first** Head Admin; self-disables after first use |

### Bootstraping the first Head Admin (production, one-time setup)

On a fresh deployment where Firebase Auth has no `head_admin` custom claim yet, the
`POST /api/auth/set-role` endpoint is unreachable because it is itself gated by
`requireHeadAdmin`. A dedicated one-time endpoint solves that chicken-and-egg
problem. It works for the very first authenticated user, then permanently refuses
further bootstrapping (a durable `settings/adminBootstrap` document is written and
checked).

```bash
# From the browser console of the signed-in user you want to promote (F12 → Console):
fetch('/api/auth/bootstrap-admin', { method: 'POST' }).then((r) => r.json()).then(console.log);

# ...or via curl with a fresh Firebase ID token (replace <ID_TOKEN>):
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json"
```

After a 200 response, **refresh the auth token** so the backend reads the new
custom claim (e.g. `await firebase.auth().currentUser.getIdToken(true)` or just
reload the app). Then `GET /api/auth/me` shows `"role": "head_admin"` and the
reveal flow works.

### Reveal in practice (curl sketch)

```bash
# Head Admin reveals SAGE-2847 with a written reason
curl -X POST http://localhost:5000/api/complaints/SAGE-2847/reveal \
  -H "Content-Type: application/json" \
  -H "x-sage-role: head_admin" \
  -H "x-sage-uid: head_proctor_1" \
  -d '{"reason": "Complaint proven fabricated during the review hearing."}'

# Response
{ "success": true, "data": { "decryptedUserRef": "realFirebaseUid...", "auditLogId": "REVEAL_LOG_..." } }
```

> 🔒 In production the role and UID come from the verified Firebase ID token (`Authorization: Bearer <token>`). The `x-sage-role` / `x-sage-uid` headers are a local-development convenience only.

---

## 🧩 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI Framework** | React 19 + TypeScript | Modern, type-safe components |
| **Build Tool** | Vite 6 | Fast HMR, dev-server proxy, backend auto-start plugin |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Animations** | Motion (Framer Motion) | Smooth transitions & micro-interactions |
| **Charts** | Recharts | Admin dashboard analytics |
| **Icons** | lucide-react | Consistent UI iconography |
| **Backend API** | Express.js on :5000 | Sealing server, REST API, reveal protocol |
| **Database** | Firebase Firestore (Admin SDK) | Real-time NoSQL with an in-memory sandbox fallback |
| **Auth** | Firebase Authentication | Verified ID-token verification; dev role headers locally |
| **Encryption** | CryptoJS AES-256 (**server-side** with `SAGE_MASTER_KEY`) | Identity sealing + Head-Admin decryption; SHA-256 voter hashing |
| **ML** | Scikit-learn (TF-IDF + LogReg) on :5001 | Urgency classification + NLP keyword fallback |
| **ML Serving** | Flask | Lightweight Python API server |

---

## 📁 Project Structure

```
SAGE/
├── frontend/                       # React frontend (Vite, :3000) — self-contained
│   ├── src/
│   │   ├── components/               # 23 components
│   │   │   ├── SubmissionForm.tsx     # Sealed-deposit wizard
│   │   │   ├── FlagDisputedModal.tsx  # Admin dispute flag (10-char reason gate)
│   │   │   ├── RevealIdentityModal.tsx# Head-Admin identity reveal
│   │   │   ├── HeadAdminDashboard.tsx # Reveal buttons + reveal-log ledger
│   │   │   └── PublicFeed.tsx, ComplaintDetail.tsx, AuthModal.tsx, ...
│   │   ├── context/AuthContext.tsx   # Global auth + role state
│   │   ├── services/api.ts           # API layer (proxy → :5000, sandbox fallback)
│   │   ├── utils/crypto.ts           # SHA-256 voter helpers only — no client decrypt
│   │   └── firebase/config.ts        # Client Firebase init
│   ├── index.html                    # Vite entry point
│   ├── public/                       # Static assets served at / (sage-logo.svg, …)
│   ├── vite.config.ts                # proxy /api → :5000 + backend auto-start plugin
│   ├── tsconfig.json                 # TypeScript config (react-jsx, @/* paths)
│   ├── package.json                  # Frontend deps (react, vite, tailwind, …)
│   └── dist/                         # Production build output (served by backend)
├── backend/src/                      # Express sealing server (:5000)
│   ├── controllers/                  # complaint · auth · analytics · escalation settings
│   ├── services/
│   │   ├── firestoreService.ts        # create / reveal / dispute / escalate + sandbox store
│   │   ├── mlService.ts              # ML call + NLP fallback
│   │   └── escalationService.ts       # hourly auto-escalation scheduler
│   ├── middleware/authMiddleware.ts   # JWT verify / dev headers / requireAdmin, requireHeadAdmin
│   ├── routes/ · types/ · utils/crypto.ts (AES seal/decrypt, SHA-256)
│   └── config/                       # firebaseAdmin · escalationConfig
├── ml-service/                       # Flask ML microservice (:5001)
│   ├── app.py                        # POST /predict-urgency
│   ├── train_and_evaluate.py          # model training script
│   └── urgency_model.joblib           # trained TF-IDF + LogReg model
├── database/                         # firestore.rules · firestore.indexes.json · seed.ts
├── scripts/                          # e2e-reveal-test.mjs · diag-reveal.cjs · …
├── app.py · train_and_evaluate.py · requirements.txt  # legacy ML entry points
└── api/index.ts                      # Vercel serverless entry (serverless-http wrapper)
```

---

## 🗄️ Firestore Database Schema

### `users` — Role profiles with encrypted identities

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase UID |
| `encryptedIdentity` | string | AES-256 encrypted, **never** plain text |
| `role` | enum | `student` \| `admin` \| `head_admin` |
| `department` | string | e.g. `Computer Science & Engineering` |
| `createdAt` | timestamp | Account creation time |

### `complaints` — Public grievance records

| Field | Type | Description |
|-------|------|-------------|
| `complaintId` | string | e.g. `SAGE-2847` (document ID) |
| `encryptedUserRef` | string | **AES-256 ciphertext** of the verified submitter UID (server-sealed; never returned by the API) |
| `category` | enum | `infrastructure` \| `mess` \| `harassment` \| `wifi` \| `hygiene` \| `other` |
| `description` | string | 20–1000 characters |
| `hostelOrLocation` | string | e.g. `Hostel Block A - Room 204` |
| `status` | enum | `submitted` \| `under_review` \| `resolved` |
| `upvoteCount` | number | Community upvotes |
| `urgencyScore` | number | ML-predicted score `0.0`–`1.0` |
| `highPriority` | boolean | Set by the auto-escalation engine |
| `photoUrl` / `videoUrl` | string | Optional evidence |
| `disputed` / `disputeReason` / `disputedAt` / `disputedBy` | bool/string | Set when an admin flags the complaint as suspected false/malicious |
| `isSandbox` | boolean | True only for demo/seed records (not real sealed identities) |
| `createdAt` / `resolvedAt` / `resolutionNotes` | | Submission / resolution metadata |

### `upvotes` — Anonymous voting ledger

| Field | Type | Description |
|-------|------|-------------|
| `upvoteId` | string | Auto-generated |
| `complaintId` | string | Reference to complaint |
| `hashedVoterId` | string | SHA-256 hash (prevents double-voting) |
| `createdAt` | timestamp | Vote time |

### `statusUpdates` — Append-only status history

| Field | Type | Description |
|-------|------|-------------|
| `updateId` | string | Auto-generated |
| `complaintId` | string | Reference to complaint |
| `updatedBy` | string | Admin UID |
| `oldStatus` / `newStatus` | string | Status change |
| `timestamp` | timestamp | Change time |

### `revealLogs` — Immutable identity-reveal audit trail

| Field | Type | Description |
|-------|------|-------------|
| `logId` | string | Auto-generated (`REVEAL_LOG_...`) |
| `complaintId` | string | Reference to complaint |
| `revealedByAdminId` | string | **Head Admin UID who ordered the reveal** |
| `reason` | string | Minimum 10-char justification |
| `timestamp` | timestamp | Reveal time |

### `settings` — Auto-escalation tuning

| Field | Type | Description |
|-------|------|-------------|
| `settingsId` | string | `escalation` (singleton doc) |
| `threshold` | number | Upvotes required to trigger escalation (default 20) |
| `defaultThreshold` | number | Factory default |
| `updatedBy` / `updatedAt` | | Last tuner + time |
| `lastRunAt` / `lastRun` | | Last sweep report |

---
## 🛡️ Security Architecture

### 1. Cryptographic Identity Decoupling (server-side)

- The **backend only** seals identities: `encryptAES(uid)` with the server-only `SAGE_MASTER_KEY` at deposit time.
- **Fail-closed**: in production the backend starts even without `SAGE_MASTER_KEY` (so the deployed site shows a clear diagnostic instead of a generic 500), but identity sealing is disabled — complaint submissions return `503` with exact setup instructions, and the health endpoint reports `"masterKeyConfigured": false`.
- Complaint bodies containing identity fields (`studentName`, `studentEmail`, `studentId`, `rollNumber`, `userId`, `plainIdentity`, `encryptedUserRef`) are **rejected** with HTTP 400.
- The ciphertext is stripped from every API response — it exists only inside the backend ledger.
- Decryption happens **only inside `triggerIdentityReveal()`**, guarded by `requireHeadAdmin` (HTTP 403 for every other role).

### 2. Role-Based Access Control

| Capability | Student | Admin | Head Admin |
|-----------|:-------:|:-----:|:----------:|
| Submit complaint (verified sign-in) | ✅ | ✅ | ✅ |
| Upvote complaints | ✅ | ✅ | ✅ |
| View public feed | ✅ | ✅ | ✅ |
| Update complaint status | ❌ | ✅ | ✅ |
| Flag complaint as disputed | ❌ | ✅ | ✅ |
| Access admin dashboard | ❌ | ✅ | ✅ |
| Reveal identities | ❌ | ❌ | ✅ |
| View reveal logs | ❌ | ❌ | ✅ |
| Configure auto-escalation | ❌ | ✅ | ✅ |
| Delete complaints | ❌ | ❌ | ✅ |

### 3. Immutable Audit Trails

- `revealLogs`, `statusUpdates`, and `upvotes` are write-once collections (`allow update, delete: if false;` in Firestore rules).
- Every identity reveal logs **who** (Head Admin UID), **when**, and **why** (minimum 10-char justification).
- Every dispute flag and status change logs the acting admin UID.
- Audit records cannot be edited or deleted at the database level.

### 4. Dual-Layer Admin Dashboard Enforcement

- **UI routing** — students reaching `/admin` see an access-denied screen; no admin data loads.
- **API role guards** — `requireAdmin` / `requireHeadAdmin` middleware return HTTP 403 for unauthorized roles.
- **Firestore rules** — admin writes require `isAdmin()` claims and identity fields are rejected at the database layer as well.

---

## 🤖 ML Urgency Scoring

The ML microservice (Flask on **:5001**) classifies complaint urgency:

- **Model**: TF-IDF vectorizer + Logistic Regression (scikit-learn), serialized to `ml-service/urgency_model.joblib`
- **Training**: categorized complaint templates via `ml-service/train_and_evaluate.py`
- **Endpoint**: `POST /predict-urgency` → `{ urgency_score: 0.0–1.0, label: "urgent" | "normal" }`
- **Fallback**: when the microservice is unreachable, the backend scores urgency in-process with an NLP keyword heuristic (`source: "nlp_fallback"`)
- **Usage**: scoring runs at complaint submission; the result is stored as `urgencyScore` and feeds the AI-flagged and escalation logic

```bash
curl -X POST http://localhost:5001/predict-urgency \
  -H "Content-Type: application/json" \
  -d '{"text": "Live electric wire sparking outside hostel corridor"}'

# Response
{ "urgency_score": 0.98, "label": "urgent" }
```

---

## ⏱️ Auto-Escalation Engine

- An hourly scheduler (`services/escalationService.ts`) sweeps complaints that cross the configurable upvote threshold (default **20**) and escalates them.
- Escalation follows per-department email routing (`backend/src/config/escalationConfig.ts`) with console/webhook delivery.
- Admins can tune the threshold or trigger a sweep immediately via `/api/settings/escalation*`.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend on :3000 — Vite auto-starts the backend if :5000 is free |
| `npm run dev:backend` | Backend sealing server on :5000 (`tsx watch backend/src/server.ts`) |
| `npm run build` | Production frontend build to `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Frontend type-checking (`cd frontend && tsc --noEmit`) |
| `npm run clean` | Remove build output (`frontend/dist`, `backend/dist`) |
| `cd backend && npm run dev` | Backend only (`tsx watch`) |
| `cd backend && npm run build && npm start` | Build + run compiled backend |
| `cd frontend && npm run dev` | Frontend only on :3000 |
| `python ml-service/app.py` | ML microservice on :5001 |
| `node scripts/e2e-reveal-test.mjs` | End-to-end reveal-protocol test (requires backend on :5000) |

---

## 🚀 Production Deployment

> **If you deployed only the frontend, grievance submission fails with
> *"Cannot reach the S.A.G.E. Sealing Server"* — that is by design.**
> The browser's default API base is the same-origin `/api`, which works in
> development only because the Vite dev server **proxies** `/api` → the
> backend on `:5000`. A deployed static build has no proxy and no backend
> process, so every `/api` call fails (see the fail-closed guard in
> `frontend/src/services/api.ts`). The fix is to deploy the Express Sealing Server too.

### Option A — Vercel serverless (recommended, single project)

The repo ships with an `api/index.ts` serverless entry point that wraps the
Express app with `serverless-http`, plus a `vercel.json` that routes every
`/api/*` request to that function while serving the built React app
(from `frontend/dist/`). One Vercel project = frontend **and** backend on the
same origin — free tier included, no credit card required.

1. **Set secrets** in *Project Settings → Environment Variables* (the backend
   starts without them but **identity sealing is disabled** and complaints
   cannot be deposited):
   - `SAGE_MASTER_KEY` — **required for the app to function**. The health
     endpoint reports `sealing.masterKeyConfigured: false` when it is missing,
     and complaint submissions return a clear `503` with instructions.
   - `FIREBASE_SERVICE_ACCOUNT_KEY` + `FIREBASE_PROJECT_ID` — required for live
     Firestore/Auth; without them the backend runs an in-memory sandbox that
     **loses all data on restart**.
2. **Push the repo to GitHub**, then in the Vercel dashboard choose
   *Add New Project → Import* and select the repository. Vercel auto-detects
   Vite for the frontend and the `api/` directory for functions.
3. Click **Deploy**, then verify the API:
   ```bash
   curl https://<your-project>.vercel.app/api/health   # → 200 JSON
   ```
4. Open the site and submit a grievance end-to-end. Done.

**How it works:** `vercel.json` rewrites `/api/*` → `/api/index`, and
`api/index.ts` imports the Express app from `backend/src/server.ts` via
`serverless-http`. The direct-run guard in `server.ts` means `app.listen()`
only fires when the file is executed directly (e.g. `node backend/dist/server.js`);
under the Vercel runtime the function is imported, so no port is ever bound.

**Limitations:** the Vercel Hobby (free) tier caps request bodies at **~4.5 MB**,
so very large video evidence uploads may fail. Upgrade to Pro, or store large
media in Firebase Storage and reference it by URL, if this is a concern.

### Option B — Render / Railway / Fly.io (long-running Node)

The included `render.yaml` blueprint still works on container PaaS hosts:

```bash
# Build:   npm ci && cd frontend && npm ci && cd .. && npm run build && cd backend && npm ci && npm run build
# Start:   node backend/dist/server.js
# Env:     NODE_ENV=production, SERVE_STATIC=true
```

> **Heads up:** Render's free tier requires a credit card on file — without one,
> new services are quickly suspended and the API returns a 503 until a card is
> added. If you hit that, prefer Option A. The same build/start commands work on
> Railway, Fly.io, Heroku (`Procfile` provided), or any Node VPS.

### Option C — Static frontend + separate API (keep your current host)

If you keep the frontend on a static host and run the backend separately:

1. **Deploy the backend** to Render, Railway, Fly.io, or a VPS (same build/start
   commands as Option B, but leave `SERVE_STATIC` unset). Confirm it is alive:
   ```bash
   curl https://<your-backend-host>/api/health   # → 200 JSON
   ```
2. **Rebuild the frontend pointing at the live backend.** The value must end
   with `/api` — the client appends endpoint paths directly:
   ```bash
   # PowerShell
   $env:VITE_API_URL="https://<your-backend-host>/api"; npm run build
   # bash/zsh
   VITE_API_URL="https://<your-backend-host>/api" npm run build
   ```
3. Redeploy `frontend/dist/` to your static host.

### Pre-flight checklist

- [ ] `GET https://<your-host>/api/health` returns `200` with `"status": "healthy"` **and** `"sealing" → "masterKeyConfigured": true`.
- [ ] `SAGE_MASTER_KEY` is set — the server starts without it (no crash) but sealing is disabled: health reports `masterKeyConfigured: false`, and complaints return a `503` explaining what to do.
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` + `FIREBASE_PROJECT_ID` are set — otherwise data is in-memory only and lost on every Vercel cold start.
- [ ] Frontend wiring: `vercel.json` rewrite (works out of the box on Vercel) **or**
      `VITE_API_URL=https://<your-backend-host>/api` at **build time**.

---
## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please ensure your code follows the existing TypeScript conventions and passes `npm run lint`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for safer, more accountable campuses**

*Your voice matters. Your identity stays yours.*

</div>