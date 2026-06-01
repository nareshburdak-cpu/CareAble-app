# CareAble

**Caregiver Self-Assessment Platform**  
La Trobe University · Capstone 2026 · Team NEXA

[![Live Site](https://img.shields.io/badge/Live-careable.site-teal)](https://careable.site)
[![API](https://img.shields.io/badge/API-careable--api.onrender.com-blue)](https://careable-api.onrender.com)

---

## Overview

CareAble is a full-stack web application that allows caregivers to self-assess their capability across 12 evidence-based domains, receive a tiered proficiency level, and download a verifiable PDF certificate. Employers can validate those certificates in real time via QR code or certificate ID.

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend | https://careable.site |
| Backend API | https://careable-api.onrender.com |
| Admin Panel | https://careable.site/admin-*** |
| Certificate Verify | https://careable.site/verify/`<certificateId>` |

> **Note:** The backend runs on Render's free tier — expect a ~30 s cold start on first request after inactivity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind v4, React Router v7, Axios, Recharts, react-hot-toast |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, nanoid, PDFKit, qrcode, Resend |
| Database | MongoDB Atlas (Sydney, free tier) |
| Email | Resend (verified `careable.site` domain) |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Features

### Carer
- Register and verify email
- Take a self-assessment across 12 capability domains
- Receive a tiered result — **Strength** / **Growth** / **Support**
- Download a branded PDF certificate with QR code
- View past assessments and results

### Employer
- Dashboard to verify caregiver certificates by ID
- Calls the public `/api/verify/:certificateId` endpoint
- Instant status: valid / revoked / not found

### Admin
- Full user management with role assignment (`carer`, `employer`, `admin`)
- Question and category management with soft-delete / archiving
- Analytics dashboard (Recharts)
- Audit log with 90-day auto-purge
- Certificate revocation

---

## Assessment Engine

- **12 capability domains** stored in the `Category` collection
- **1–5 scale** per question (Likert or Frequency)
- Multi-select questions are **excluded** from scoring (demographic only)
- **Domain score** = mean of all scored answers in that domain (2 dp)
- **Overall score** = mean of all domain scores (2 dp)
- **Tiers:** Strength ≥ 4.0 · Growth ≥ 3.0 · Support < 3.0
- **Top capability areas** = domains scoring ≥ 4.0 (shown on certificate, max 5)

---

## Certificate Format

- ID pattern: `CA-YYYY-XXXXXX` (e.g. `CA-2026-FNVX9W`)
- A4 landscape PDF — brand teal/blue colour scheme
- QR code encodes the public verify URL
- Publicly verifiable at `/verify/:certificateId` — no login required

---

## Project Structure

```
Project CareAble/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/axios.js     # HTTP client with error-normalising interceptors
│   │   ├── components/      # Shared UI components
│   │   │   └── admin/       # Admin-specific components
│   │   ├── context/         # AuthContext — exposes hasRole() helper
│   │   ├── hooks/useAuth.js # Global auth state
│   │   ├── pages/           # Top-level routes
│   │   │   └── admin/       # Admin panel pages
│   │   └── utils/toast.js   # Toast wrapper
│   └── vercel.json          # SPA catch-all rewrite
│
└── server/                  # Express API
    ├── assets/              # careable-logo.png (used in PDF)
    ├── controllers/         # Route handlers
    ├── middleware/          # protect, requireAdmin, requireCarer, requireEmployer, errorHandler
    ├── models/              # Mongoose schemas (User, Assessment, Category, Question …)
    ├── routes/              # Express routers
    ├── seed/                # One-off scripts (promoteToAdmin.js …)
    └── utils/               # ApiError, asyncHandler, audit, scoring, generateCertificate,
                             # categoryCache, emailRateLimit
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)
- Resend account (for email)

### Backend

```powershell
cd "Project CareAble/server"
npm install
```

Create `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/careable
JWT_SECRET=<random-secret>
RESEND_API_KEY=re_<your-key>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```powershell
npm run dev    # starts on http://localhost:5000
```

### Frontend

```powershell
cd "Project CareAble/client"
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```powershell
npm run dev    # starts on http://localhost:5173
```

> **Windows / PowerShell:** use `curl.exe` not `curl` (which aliases to `Invoke-WebRequest`).

---

## Environment Variables (Production)

| Service | Variable | Value |
|---|---|---|
| Render (backend) | `MONGO_URI` | Atlas connection string |
| Render (backend) | `JWT_SECRET` | Random secret |
| Render (backend) | `RESEND_API_KEY` | Resend key |
| Render (backend) | `CLIENT_URL` | `https://careable.site` |
| Render (backend) | `NODE_ENV` | `production` |
| Vercel (frontend) | `VITE_API_URL` | `https://careable-api.onrender.com/api` |

---

## Deployment

- **Frontend** — push to `main` → Vercel auto-deploys (~1–2 min)
- **Backend** — push to `main` → Render auto-deploys (~3–5 min)
- After deploy: force-refresh browser (`Ctrl+Shift+R`)

---

## Admin Utilities

```powershell
# Promote a user to admin
node seed/promoteToAdmin.js nareshburdak25@gmail.com
```

**Test accounts**

| Email | Role |
|---|---|
| `admin@careable.com` | Admin |
| `demo2@careable.com` | Carer |

**Sample certificate:** `CA-2026-FNVX9W`

---

## Multi-Role Architecture

`User.roles` (array) is the source of truth.

| roles value | Access |
|---|---|
| `["carer"]` | Carer dashboard + assessment |
| `["employer"]` | Employer dashboard + certificate verify |
| `["carer", "employer"]` | Both dashboards |
| `["carer", "admin"]` | Admin panel + carer features |

`User.role` (string) is kept for backward compatibility only — always derived from `roles` via `user.syncLegacyRole()`. Admin role is never self-selectable; promotion is admin-only.

---

## API Response Format

All endpoints return:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Something went wrong", "extra": { ... } }
```

Errors thrown via `new ApiError(statusCode, message, extra?)` and caught by the global error handler.

---

## Phases Completed

| Phase | Summary |
|---|---|
| Foundation | Auth, JWT, email verification, password reset |
| Assessment engine | 12 domains, 1–5 scoring, Strength/Growth/Support tiers |
| Certificates | PDF + QR, public verify endpoint, brand redesign |
| Admin panel | Analytics, audit log, user/question/category management |
| Multi-role | roles array, employer registration, requireCarer/Employer middleware |
| Employer dashboard | Certificate verification widget, role-aware routing, EmployerRoute guard |
| Assessment templates | Multi-template support, admin create/edit/archive, carer template selection |

---

## Coding Conventions

- Async handlers wrapped in `asyncHandler()` — no unhandled rejections
- Soft deletes everywhere — `isActive`, `isArchived` flags; never hard-delete user data
- Category/question cache via `categoryCache.js` — invalidate after mutations
- Audit log via `logAdminAction()` for every admin mutation
- Email rate limiting: 60 s cooldown for verify/reset, 10 emails/user/day cap
- Frontend API calls via `src/api/axios.js`; public verify calls use raw `fetch()`
- StrictMode double-mount guard via `useRef(false)` for one-time effects

---

## Team

**Team NEXA** — La Trobe University Capstone 2026

| Member | Role | Contribution |
|---|---|---|
| **Naresh Kumar** | Team Leader & Full-Stack Developer | Led end-to-end design, development, and deployment — database architecture, REST API design, React frontend, cloud infrastructure |
| **Shivanshi Joon** | Security & Backend Developer | Authentication system (JWT, OTP flows, role-based access control), API security, database schema |
| **Jayan Sekhar Mallu** | AI & Data Integration | AI insights feature and data integration layer; Python, R, TensorFlow for data-driven assessment outcomes |
| **Hema Priya** | Full-Stack Developer | Responsive UI components, API integration, authentication flow support |
| **Sreenivasulu Reddy** | Data & Analytics Developer | Analytics dashboards, data visualisations, MongoDB schema design, assessment scoring and reporting |
| **Yogesh Tajane** | QA & Documentation Lead | Quality assurance, test case design, technical documentation, usability standards |

---

## Licence

This project is created for educational purposes as part of La Trobe University's Capstone program. Not licensed for production use outside the program without explicit permission.