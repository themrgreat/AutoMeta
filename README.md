# Outreach AI — AI-Powered Bulk Email Platform

Upload an Excel/CSV file of contacts, generate personalized outreach emails with
**Gemini**, review them in a queue, and send through **Zoho Mail SMTP** with
automatic sender rotation.

This is the **core MVP** vertical slice: `Upload → Preview → AI Generate →
Review → Send`. Analytics, campaigns, and auth are intentionally out of scope for
this iteration (see [Roadmap](#roadmap)).

## Tech stack

| Layer    | Tech                                                            |
| -------- | -------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Framer Motion |
| Backend  | Express, Mongoose (MongoDB), Multer, SheetJS (`xlsx`), Nodemailer |
| AI       | Google Gemini (`@google/generative-ai`)                        |
| Email    | Zoho Mail SMTP                                                  |

```
akash/
├── backend/   Express API + MongoDB models, services, routes
├── frontend/  React SPA (Vite)
└── sample-contacts.csv   demo data to try the flow
```

## Prerequisites

- Node.js 18+
- A running **MongoDB** (local `mongod` or a MongoDB Atlas URI)
- A **Gemini API key** — https://aistudio.google.com/apikey
- A **Zoho Mail** account with an app-specific password (for actually sending)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

- `MONGODB_URI` — your MongoDB connection string
- `GEMINI_API_KEY` — your Gemini key
- `ENCRYPTION_KEY` — generate a real one:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Start it:

```bash
npm run dev      # http://localhost:5050  (seeds 5 starter templates on first boot)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173  (proxies /api → :5050)
```

Open http://localhost:5173.

## Using it

1. **File Import** — drag in `sample-contacts.csv`. The app auto-detects the
   email column and shows a preview.
2. **Templates** — pick a seeded template (Sales Outreach, Lead Gen, …) or create
   your own with `{{company_name}}`, `{{industry}}`, etc. Use **Enhance with AI**
   to refine a rough prompt.
3. Back on **File Import**, choose a template and click **Generate emails** —
   Gemini writes a personalized subject + body per contact.
4. **Review & Send** — search/filter, edit any email, add CC/BCC, approve/reject
   in bulk, regenerate, then **Send**. Emails rotate across active sender accounts
   and respect each account's daily limit.
5. **Sender Accounts** — add Zoho accounts (app password is **encrypted at
   rest**), click **Verify** to test SMTP, and set a default.

> Sending requires at least one verified sender account. Generation requires a
> valid `GEMINI_API_KEY`.

## API overview

| Method | Endpoint                     | Purpose                          |
| ------ | ---------------------------- | -------------------------------- |
| POST   | `/api/imports`               | Upload + parse a spreadsheet     |
| GET    | `/api/imports/:id`           | Full import with rows            |
| GET/POST/PUT/DELETE | `/api/templates`  | Template CRUD                    |
| POST   | `/api/templates/enhance`     | AI-refine a prompt               |
| POST   | `/api/generate`              | Generate emails for an import    |
| GET    | `/api/emails`                | List/filter review queue         |
| PATCH  | `/api/emails/:id`            | Edit one email                   |
| POST   | `/api/emails/bulk-status`    | Approve/reject many              |
| POST   | `/api/emails/:id/regenerate` | Re-run AI for one email          |
| POST   | `/api/emails/send`           | Send selected emails             |
| GET/POST/PUT/DELETE | `/api/senders`    | Zoho sender CRUD                 |
| POST   | `/api/senders/:id/verify`    | Test SMTP credentials            |

## Security notes

- SMTP passwords are encrypted with **AES-256-GCM** (`ENCRYPTION_KEY`) and never
  returned to the client.
- `.env` is git-ignored. Use Zoho **app-specific passwords**, not your login.

## Roadmap

Deferred from the full spec, in rough priority order:

- JWT auth + role-based access control
- Campaign grouping, scheduling, and a background job queue for very large sends
- Analytics dashboard (open/click/reply tracking, charts)
- Deliverability tooling (SPF/DKIM/DMARC checks, bounce & unsubscribe handling)
- Hybrid auto-send-by-category workflow
