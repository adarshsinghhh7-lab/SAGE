<div align="center">

# 🎓 S.A.G.E.

### **Student Anonymous Grievance & Escalation System**

*A privacy-first campus complaint platform with ML-powered urgency scoring and end-to-end encryption*

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

S.A.G.E. is a full-stack web application that enables **anonymous** reporting of campus grievances — from infrastructure issues to harassment — while keeping student identities cryptographically protected.

**Key principles:**
- 🔐 **Zero-knowledge anonymity** — Identities are AES-256 encrypted client-side; no plain-text PII touches the database
- 🤖 **ML-driven triage** — A TF-IDF + Logistic Regression model scores urgency in real time
- 📊 **Community-powered** — An anonymous upvote system surfaces the most impactful issues
- 🛡️ **Dual-layer security** — Firestore rules *and* UI-level routing enforce role-based access
- 📝 **Immutable audit trails** — Every identity reveal and status change is permanently logged

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                   │
│  Vite · TypeScript · Tailwind CSS · Motion · Recharts    │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Landing  │  │ Submit   │  │  Public  │  │  Admin  │ │
│  │   Page   │  │  Form    │  │  Feed    │  │Dashboard│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Complaint │  │  Auth    │  │  Status  │  │  Head   │ │
│  │  Detail  │  │  Modal   │  │ Timeline │  │  Admin  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────┐     ┌───────────────────────────┐  │
│  │  Express.js API  │◄───►│  Firebase Firestore       │  │
│  │   (port 3000)    │     │  + Firebase Auth          │  │
│  └────────┬─────────┘     └───────────────────────────┘  │
│           ▼                                              │
│  ┌──────────────────┐     ┌───────────────────────────┐  │
│  │  Flask ML API    │◄───►│  Scikit-learn Model       │  │
│  │   (port 5000)    │     │  TF-IDF + LogReg          │  │
│  └──────────────────┘     └───────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│              Firebase Firestore · Firebase Auth · Gemini  │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | ≥ 18 | Frontend runtime |
| [Python](https://www.python.org) | ≥ 3.10 | ML microservice |
| [Firebase Account](https://console.firebase.google.com) | — | Database & auth |

### 1. Clone & install

```bash
git clone https://github.com/your-org/sage.git
cd sage
npm install
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

### 3. Start the services

```bash
# Terminal 1 — Frontend + Express API (port 3000)
npm run dev

# Terminal 2 — ML Microservice (port 5000)
python app.py
```

Open **http://localhost:3000** 🎉

---

## 🧩 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI Framework** | React 19 + TypeScript | Modern, type-safe components |
| **Build Tool** | Vite 6 | Lightning-fast HMR and build |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Animations** | Motion (Framer Motion) | Smooth transitions & micro-interactions |
| **Charts** | Recharts | Admin dashboard analytics |
| **Backend API** | Express.js | RESTful complaint CRUD |
| **Database** | Firebase Firestore | Real-time NoSQL with security rules |
| **Auth** | Firebase Authentication | Role-based user management |
| **Encryption** | CryptoJS (AES-256) | Client-side identity protection |
| **ML** | Scikit-learn (TF-IDF + LogReg) | Urgency classification |
| **ML Serving** | Flask | Lightweight Python API server |

---

## 🗂️ Project Structure

```
SAGE/
├── src/
│   ├── components/            # 17 React components
│   │   ├── LandingPage.tsx        # Hero + feature showcase
│   │   ├── SubmissionForm.tsx     # Complaint submission wizard
│   │   ├── PublicFeed.tsx         # Anonymous public complaint ledger
│   │   ├── ComplaintCard.tsx      # Individual complaint card
│   │   ├── ComplaintDetail.tsx    # Full complaint view with timeline
│   │   ├── StatusTimeline.tsx     # Status progression visualizer
│   │   ├── AdminDashboard.tsx     # Admin complaint management
│   │   ├── HeadAdminDashboard.tsx # Head admin + identity reveal
│   │   ├── AuthModal.tsx          # Login / register dialog
│   │   └── Navbar.tsx             # Navigation bar
│   ├── context/AuthContext.tsx    # Global auth state
│   ├── firebase/config.ts        # Firebase initialization
│   ├── services/api.ts           # Firestore API + subscriptions
│   ├── utils/
│   │   ├── crypto.ts             # AES-256 helpers
│   │   └── formatters.ts         # Date & label formatters
│   ├── App.tsx                   # Root app + hash routing
│   └── types.ts                  # TypeScript interfaces
├── app.py                    # Flask ML microservice
├── train_and_evaluate.py     # ML model training script
└── requirements.txt          # Python dependencies
```

---

## 📜 Firestore Database Schema

### `users` — Role profiles with encrypted identities

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Auto-generated Firebase UID |
| `encryptedIdentity` | string | AES-256 encrypted, **never** plain text |
| `role` | enum | `"student"` \| `"admin"` \| `"head_admin"` |
| `department` | string | e.g. `"Computer Science & Engineering"` |
| `createdAt` | timestamp | Account creation time |

### `complaints` — Public grievance records

| Field | Type | Description |
|-------|------|-------------|
| `complaintId` | string | e.g. `"SAGE-2847"` (document ID) |
| `encryptedUserRef` | string | AES-256 encrypted submitter reference |
| `category` | enum | `"infrastructure"` \| `"mess"` \| `"harassment"` \| `"wifi"` \| `"hygiene"` \| `"other"` |
| `description` | string | 20–1000 characters |
| `hostelOrLocation` | string | e.g. `"Hostel Block A - Room 204"` |
| `status` | enum | `"submitted"` \| `"under_review"` \| `"resolved"` |
| `upvoteCount` | number | Community upvotes (default: `0`) |
| `urgencyScore` | number | ML-predicted score `0.0`–`1.0` |
| `photoUrl` | string | Optional evidence photo |
| `createdAt` | timestamp | Submission time |
| `resolutionNotes` | string | Optional admin notes |
| `resolvedAt` | timestamp | Resolution time |

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
| `oldStatus` | string | Previous status |
| `newStatus` | string | Updated status |
| `timestamp` | timestamp | Change time |

### `revealLogs` — Emergency identity reveal audit trail

| Field | Type | Description |
|-------|------|-------------|
| `logId` | string | Auto-generated |
| `complaintId` | string | Reference to complaint |
| `revealedByAdminId` | string | Head Admin UID |
| `reason` | string | Minimum 10-char justification |
| `timestamp` | timestamp | Reveal time |

---

## 🛡️ Security Architecture

S.A.G.E. enforces privacy through **three layers of defense**:

### 1. Cryptographic Identity Decoupling
- All student identities are encrypted with **AES-256** on the client before reaching Firestore
- Complaint documents are **rejected** if they contain `studentName`, `studentEmail`, `studentId`, or plain `userId`
- Identity can only be decrypted by the **Head Admin** through a logged, audited emergency reveal

### 2. Role-Based Access Control

| Capability | Student | Admin | Head Admin |
|-----------|:-------:|:-----:|:----------:|
| Submit complaint | ✅ | ✅ | ✅ |
| Upvote complaints | ✅ | ✅ | ✅ |
| View public feed | ✅ | ✅ | ✅ |
| Update complaint status | ❌ | ✅ | ✅ |
| Create status updates | ❌ | ✅ | ✅ |
| Access admin dashboard | ❌ | ✅ | ✅ |
| Reveal identities | ❌ | ❌ | ✅ |
| View reveal logs | ❌ | ❌ | ✅ |
| Configure auto-escalation | ❌ | ✅ | ✅ |

### 3. Immutable Audit Trails
- `revealLogs`, `statusUpdates`, and `upvotes` have `allow update, delete: if false;` in Firestore rules
- Every identity reveal is logged with **who**, **when**, and **why** (minimum 10-character justification)
- Tampering or deletion of audit records is **impossible** at the database level

### 4. Dual-Layer Admin Dashboard Enforcement
- **UI routing**: Students attempting to access `/admin` are shown an access-denied screen — no admin data is loaded
- **Firestore rules**: All admin write operations require `isAdmin()` claims and are validated against strict field allow-lists; identity fields are permanently rejected

---

## 🤖 ML Urgency Scoring

The built-in ML microservice automatically classifies complaint urgency:

- **Model**: TF-IDF vectorizer + Logistic Regression (scikit-learn)
- **Training**: Synthetic dataset of ~300 categorized complaint templates
- **Endpoint**: `POST /predict-urgency` → `{ urgency_score: 0.0–1.0, label: "urgent"|"normal" }`
- **Threshold**: `≥ 0.50` → flagged as **urgent**, triggering automatic escalation

```bash
curl -X POST http://localhost:5000/predict-urgency \
  -H "Content-Type: application/json" \
  -d '{"text": "Live electric wire sparking outside hostel corridor"}'

# Response
{ "urgency_score": 0.9847, "label": "urgent" }
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-checking (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` and `server.js` |
| `python app.py` | Start ML microservice on port 5000 |

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
