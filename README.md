# LegalAid — Web Technologies Course Project

Full-stack legal-aid case management system: NestJS + PostgreSQL (Neon.tech) backend,
React + Vite frontend, real AI integration via the Anthropic API (Claude), Socket.io
notifications, and role-based dashboards for citizens, volunteers, supervisors, and admins.

This matches the system design document (`Group2_LegalAid_Spec.docx`): 8 entities,
guarded case-status transitions with a full audit trail, 4 AI features with graceful
fallback, and a Socket.io notification gateway.

## 1. Prerequisites

- Node.js 20+
- A free [Neon.tech](https://neon.tech) Postgres project (just sign up, create a project,
  copy the **pooled connection string**)
- An [Anthropic API key](https://console.anthropic.com) (for the 4 AI features)

## 2. Backend setup

```bash
cd legalaid-backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — paste your Neon pooled connection string
  (looks like `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`)
- `ANTHROPIC_API_KEY` — paste your key from console.anthropic.com
- Change `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to any random strings

Then run:

```bash
npm run start:dev
```

On first boot, TypeORM's `synchronize: true` creates all tables on your Neon database
automatically — no manual migration needed for the course project.

Seed test accounts (one per role, password `password123` for all):

```bash
npm run seed
```

API runs at `http://localhost:3000/api`. Swagger docs at `http://localhost:3000/api/docs`.

## 3. Frontend setup

```bash
cd legalaid-frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## 4. Test accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@legalaid.test | password123 |
| Supervisor | supervisor@legalaid.test | password123 |
| Volunteer | volunteer1@legalaid.test | password123 |
| Volunteer | volunteer2@legalaid.test | password123 |
| Citizen | citizen1@legalaid.test | password123 |
| Citizen | citizen2@legalaid.test | password123 |

Public `/register` only ever creates citizen accounts — this matches the spec
("role restricted to citizen at signup; other roles seeded/invited by admin").
Admin can invite volunteer/supervisor/admin accounts from Users → Invite user.

## 5. Demo flow for your presentation

1. Log in as a **citizen** → "New case" → submit a case → watch the AI classifier
   banner triage it live (domain + urgency).
2. Upload a document on that case → AI summary appears within a few seconds.
3. Log in as a **volunteer** → see the case in the pool → a **supervisor** can assign
   it via Caseload Overview → Reassign.
4. As the volunteer, open the case → try to skip a status (e.g. straight to
   "resolved") to show the guarded-transition error, then do a valid transition.
5. Use "Draft with AI" to generate a letter, edit it, and approve it.
6. Show `AI_INTERACTION` evidence: every AI call (success or fallback) is logged —
   query it via Swagger or a DB browser for your Deliverable 4 report.
7. To demo the **fallback path**: temporarily remove/blank `ANTHROPIC_API_KEY` in
   `.env` and restart the backend — case submission, document upload, and letter
   drafting all still work end-to-end via their manual fallback paths.
8. Log in as **admin** → Reports for the charts, Users to invite a new volunteer.

## 6. Project structure

```
legalaid-backend/    NestJS API (auth, cases, documents, notes, appointments,
                      notifications gateway, ai-proxy, admin reporting)
legalaid-frontend/   React + Vite + Tailwind, role-based routing, Socket.io client
```

See each folder's own structure for the module breakdown — it mirrors the design
doc's backend/frontend folder structures exactly (Section 3 & 4 of the spec).

