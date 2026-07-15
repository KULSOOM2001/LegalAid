# LegalAid — AI-Assisted Public Legal Services Platform

<div align="center">

![LegalAid Banner](https://img.shields.io/badge/LegalAid-⚖️-12233b?style=for-the-badge)

**"Democratising Justice Through Technology"**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini_API-b98a3d?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-12233b?style=flat-square&logo=tailwindcss&logoColor=38B2AC)](https://tailwindcss.com/)

</div>

---

## 📖 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔑 Test Accounts](#-test-accounts)
- [👥 Role Access Matrix](#-role-access-matrix)
- [🤖 AI Features](#-ai-features)
- [📊 Database Schema](#-database-schema)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🎯 Demo Scenarios](#-demo-scenarios)
- [⚠️ Known Issues](#️-known-issues)

---

## 🌟 Features

### 🤖 Intelligent Case Management
- **AI-Powered Classification** — new case submissions are triaged into a legal domain + urgency tier via Gemini, with a one-line rationale stored on the case.
- **Document Summariser** — uploaded case documents are summarised in plain language, with an urgent-action flag.
- **AI-Assisted Advisory Letters** — volunteer rough notes are reformatted into a formal draft letter, which the volunteer must explicitly approve before it counts as sent.
- **Outcome Predictor (bonus)** — an on-demand advisory badge estimating likelihood of a favourable outcome, visible only to volunteers/supervisors.
- **Graceful Fallback** — every AI call is wrapped; if `GEMINI_API_KEY` is missing or the call fails, the feature degrades (manual dropdown / static message / manual letter) instead of breaking the flow.

### 👥 Role-Based Dashboards
| Role | Dashboard Features |
|------|--------------------|
| 🏛️ **Admin** | User management (invite/edit/deactivate), 8 reporting endpoints, full case visibility |
| 👔 **Supervisor** | Caseload overview, case reassignment, volunteer capacity management, reviews volunteer notes |
| ⚖️ **Volunteer** | Assigned cases, document vault, AI letter drafting, case outcome entry, availability & appointments |
| 🏠 **Citizen** | Case submission, document upload, live status timeline, appointment booking |

### ⚡ Real-Time Everything
- Socket.io gateway (`NotificationsGateway`) — clients `join` with their JWT and are placed in a `user:<id>` room and a `role:<role>` room.
- Live events: case status changes, case assignment, document uploads, appointment requests/reminders, and a broadcast to `role:supervisor` the moment a **high-urgency** case is triaged.

### 🔒 Security
- JWT access + refresh token pair (Passport strategies), refresh-token rotation via `/auth/refresh`.
- `RolesGuard` + `@Roles()` decorator on every protected route.
- Document access is logged per view/download (`DocumentAccessLog`) and restricted to the assigned volunteer + supervisors/admin.
- Case status transitions are guarded by an explicit state machine (`CASE_STATUS_TRANSITIONS`), not left to the client.

---

## 🏗️ Architecture

```
FRONTEND
React 18 + TypeScript · Vite · Router v6 · Zustand
        |
        |  REST (Axios) + Socket.io client
        v
BACKEND — NestJS (modular)
Auth · Users · Cases · Documents · Notes · Appointments
Admin (reports) · Notifications Gateway · AI Proxy
(single egress point — no direct frontend -> LLM calls)
        |
        +------------------------+
        v                        v
PostgreSQL 15                Gemini API
(TypeORM, synchronize)       gemini-3.1-flash-lite
10 entities, Neon-compatible SSL
```

Every AI feature is called from a backend service (`CasesService`, `DocumentsService`, `AiProxyController`) through `AiProxyService`, which logs each attempt — prompt, output, latency, and whether the fallback fired — to the `ai_interactions` table.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- PostgreSQL 15 (local via Docker, or a Neon connection string)
- Gemini API key (optional — every AI feature has a fallback without it)

### 1. Install

```bash
git clone <this-repo>
cd LegalAid-main

cd legalaid-backend && npm install
cd ../legalaid-frontend && npm install
```

### 2. Configure environment

`legalaid-backend/.env`

```bash
DATABASE_URL=postgresql://legalaid:legalaid_dev_password@localhost:5432/legalaid?sslmode=disable
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
GEMINI_API_KEY=your_gemini_key_here
PORT=3000
FRONTEND_URL=http://localhost:5173
```

`legalaid-frontend/.env`

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Database

`TypeOrmModule.forRoot` runs with `synchronize: true`, so the schema is created automatically from the entities on first boot — no manual migration step needed for local dev. (A baseline migration, `1700000000000-InitialSchema.ts`, is kept in `legalaid-backend/migrations/` for reference/production use.)

```bash
cd legalaid-backend
docker compose up
```

> ⚠️ Before running this, open `docker-compose.yml` and remove the hardcoded fallback value on `GEMINI_API_KEY` — a real-looking key is currently committed as the default. Rotate that key and pass your own via a `.env` file instead.

### 4. Run

```bash
# Terminal 1 — backend
cd legalaid-backend
npm run start:dev
# http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs

# Terminal 2 — frontend
cd legalaid-frontend
npm run dev
# http://localhost:5173

# Terminal 3 — seed test accounts (one-time; skips if users already exist)
cd legalaid-backend
npm run seed
```

---

## 🔑 Test Accounts

Seeded by `src/seed.ts` — password is `password123` for all of them:

| Name | Role | Email |
|------|------|-------|
| Kulsoom Admin | 👑 admin | `kulsoom@legalaid.test` |
| Bilal Supervisor | 👔 supervisor | `bilal@legalaid.test` |
| Sara Volunteer | ⚖️ volunteer (reports to Bilal) | `sara@legalaid.test` |
| Hamza Volunteer | ⚖️ volunteer (reports to Bilal) | `hamza@legalaid.test` |
| Fatima Citizen | 🏠 citizen | `fatima@legalaid.test` |
| Usman Citizen | 🏠 citizen | `usman@legalaid.test` |

> The seed script only creates **users** — no demo cases/documents/appointments are pre-populated, so caseloads start empty until you create cases through the app.
> Note: `test/app.e2e-spec.ts` currently logs in as `saleena@legalaid.test` for the volunteer — update that to `sara@legalaid.test` so the e2e suite matches the seed.

---

## 👥 Role Access Matrix

Derived directly from the `@Roles()` guards in each controller:

| Action | Admin | Supervisor | Volunteer | Citizen |
|---|:---:|:---:|:---:|:---:|
| Create case | ❌ | ❌ | ❌ | ✅ |
| Delete case | ✅ | ❌ | ❌ | ✅ (own) |
| View cases (scoped to role) | ✅ all | ✅ all | assigned only | own only |
| Update case status | ✅ | ✅ | ✅ | ❌ |
| Assign / reassign case | ✅ | ✅ | ❌ | ❌ |
| Set case outcome | ✅ | ✅ | ✅ | ❌ |
| Upload / view documents | ✅ | ✅ | ✅ | ✅ (own case) |
| View document access logs | ✅ | ✅ | ❌ | ❌ |
| Write / approve case notes | ❌ | view only | ✅ | ❌ |
| Book appointment | — | — | — | ✅ |
| Set weekly availability | — | — | ✅ | — |
| Set volunteer capacity | ✅ | ✅ | ❌ | ❌ |
| Predict-outcome (AI, bonus) | ✅ | ✅ | ✅ | ❌ (never shown) |
| Reporting dashboard (8 endpoints) | ✅ | ❌ | ❌ | ❌ |
| Invite / edit / deactivate users | ✅ | ❌ | ❌ | ❌ |

---

## 🤖 AI Features

All four features are routed through `AiProxyService`, which calls the Gemini `generateContent` endpoint and **always** logs the interaction (success or fallback) to `ai_interactions`.

### 1. Legal Query Classifier & Router
- **Trigger:** `PATCH /cases/:id/classify`, or automatically on submission.
- **Output:** `domain`, `urgency`, one-sentence `rationale` — written back onto the `Case` row.
- **Escalation:** a `critical`/`high` urgency result fires `notifyHighUrgencyCase`, broadcast to the `role:supervisor` socket room.
- **Fallback:** citizen is shown a manual domain dropdown (`ManualClassifyDto`).

### 2. Document Summariser
- **Trigger:** after a document upload finishes processing.
- **Output:** 2–4 sentence plain-language `summary`, `urgent` boolean, `urgentReason`.
- **Fallback:** `summaryPending` stays true; volunteer reviews the raw document manually.

### 3. Advisory Letter Draft Assistant
- **Trigger:** volunteer submits rough notes on a case.
- **Output:** full formal letter text, stored as a `CaseNote` with `isAiDraft: true` until the volunteer explicitly `approve`s it.
- **Fallback:** volunteer writes and sends the letter manually — the AI path is never mandatory.

### 4. Outcome Predictor — bonus
- **Trigger:** `POST /ai/predict-outcome`, called on demand from the frontend badge.
- **Output:** `predictedOutcome`, `confidence`, one-sentence advisory `rationale`.
- **Visibility:** volunteer/supervisor/admin only — never returned to the citizen.

The shared call pattern in `AiProxyService` (simplified):

```typescript
if (!apiKey) return { success: false, fallback: true, error: 'Missing API Key' };
try {
  const raw = await callGemini(prompt);
  await logInteraction(feature, prompt, raw, /*fallbackFired*/ false);
  return { success: true, data: parse(raw) };
} catch (err) {
  await logInteraction(feature, prompt, null, /*fallbackFired*/ true, err.message);
  return { success: false, fallback: true, error: err.message };
}
```

---

## 📊 Database Schema

10 TypeORM entities (`legalaid-backend/src/**/entities`):

```
User
 ├── Case (citizen / volunteer)
 │     ├── CaseStatusLog   (status-change audit trail)
 │     ├── Document ────── DocumentAccessLog (view/download log)
 │     ├── CaseNote        (isAiDraft, approved)
 │     └── Appointment     (cascades on case delete)
 ├── Availability   (volunteer weekly slots)
 ├── Notification   (per-user, jsonb meta)
 └── AiInteraction  (feature, prompt, output, fallbackFired, latencyMs)
```

Key enums: `CaseDomain` (housing/family/employment/immigration/consumer/other), `CaseUrgency` (low/medium/high/critical), `CaseStatus` (submitted → triaged → assigned → in_progress ⇄ awaiting_citizen → resolved → closed), `CaseOutcome` (won/settled/referred/withdrawn/unresolved).

---

## 🛠️ Tech Stack

### Backend
| Technology | Role |
|---|---|
| NestJS + TypeScript | modular REST + WebSocket API |
| TypeORM | entities, `synchronize: true` for dev, migration file kept for prod |
| PostgreSQL 15 | primary datastore (Neon-compatible, SSL) |
| Passport + JWT | access/refresh auth |
| Socket.io (`@nestjs/websockets`) | real-time notifications, per-user + per-role rooms |
| `@nestjs/schedule` | appointment reminder cron (24h / 1h) |
| Swagger (`@nestjs/swagger`) | auto-generated docs at `/api/docs` |
| Multer | document upload, 10 MB limit |
| Gemini API (`gemini-3.1-flash-lite`) | all 4 AI features, via `AiProxyService` |

### Frontend
| Technology | Role |
|---|---|
| React 18 + TypeScript | UI |
| Vite | dev server / build |
| React Router v6 | routing, `ProtectedRoute` + `RoleRoute` |
| Zustand | case & notification stores |
| Axios | REST client with silent-refresh interceptor |
| Socket.io-client | live updates (`useSocket` hook) |
| Recharts | 5 admin analytics charts |
| Tailwind CSS | custom "civic navy / parchment / brass" theme — see `tailwind.config.js` |
| lucide-react, date-fns, clsx | icons / dates / class utils |

---

## 📁 Project Structure

```
LegalAid-main/
  legalaid-backend/
    src/
      auth/            JWT strategies, guards, decorators
      users/           includes capacity management
      cases/           entity, enums + state machine, service, controller
      documents/       upload, access logs
      notes/           case notes / AI letter drafts
      appointments/    booking, availability, reminder scheduler
      notifications/   Socket.io gateway
      ai-proxy/        Gemini integration + prompt templates
      admin/           8 reporting endpoints + user management
      seed.ts
    migrations/
    test/              Jest + Supertest e2e
    docker-compose.yml

  legalaid-frontend/
    src/
      api/             axios instance, auth/cases calls
      components/
        ai/            AIClassifierBanner, DocumentSummaryCard, LetterDraftEditor, OutcomePredictionBadge
        case/          CaseCard, CaseDetail (with outcome entry), StatusBadge, StatusTimeline
        charts/        Volume, Outcome, Resolution, Utilisation, StatusBreakdown
        layout/        RoleLayout, Sidebar, Topbar
      pages/
        admin/ · supervisor/ (with capacity panel) · volunteer/ · citizen/ · auth/
      context/, hooks/, routes/, store/, types/
      App.tsx
```

---

## 🎯 Demo Scenarios

**1 — Citizen journey:** log in as `fatima@legalaid.test` → submit a new case → watch AI classification set the domain/urgency → upload a document → see the AI summary appear → track status on the live timeline.

**2 — Volunteer workflow:** log in as `sara@legalaid.test` → open an assigned case → try an invalid status jump (guard blocks it) → write rough notes → generate the AI letter draft → review and approve it → set the case outcome once resolved.

**3 — Supervisor capacity check:** log in as `bilal@legalaid.test` → open Caseload Overview → adjust a volunteer's max active cases → see the over-capacity flag update live.

**4 — Real-time collaboration:** open a citizen session and a volunteer session side by side → citizen uploads a document → volunteer's `role:volunteer` room gets `document:uploaded` instantly.

**5 — AI fallback:** unset `GEMINI_API_KEY` and restart the backend → classification, summary, and letter-drafting all still work through their manual fallback paths → check `ai_interactions` for `fallbackFired: true` rows.

**6 — Admin oversight:** log in as `kulsoom@legalaid.test` → Reports page (volume by domain/volunteer/month, resolution time, outcomes, utilisation) → invite a new volunteer → deactivate a user.

---

<div align="center">

**[⬆ Back to Top](#legalaid--ai-powered-legal-case-management-system)**

[![Star on GitHub](https://img.shields.io/github/stars/yourusername/legalaid?style=social)](https://github.com/yourusername/legalaid)

</div>

---
