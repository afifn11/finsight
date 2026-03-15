# FinSight — Personal Finance Dashboard

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://getfinsight.vercel.app)
[![CI](https://github.com/afifn11/finsight/actions/workflows/ci.yml/badge.svg)](https://github.com/afifn11/finsight/actions)

**Full-stack personal finance dashboard with AI-powered insights, receipt scanning, and PWA support.**

[**Live Demo →**](https://getfinsight.vercel.app)

</div>

---

## Screenshots

<div align="center">

**Dashboard**
<img width="1400" alt="Dashboard" src="https://github.com/user-attachments/assets/51804ed2-739b-41fe-b655-a791038015fd" />

<br/>

**Transactions & Add Modal**
<img width="1400" alt="Transactions" src="https://github.com/user-attachments/assets/07aa9921-b310-4bda-9a44-1798118a72da" />

<br/>

**OCR Receipt Scanning**
<img width="1400" alt="OCR Scan" src="https://github.com/user-attachments/assets/f037f778-998c-4e45-9fed-682bf2b6876b" />

<br/>

**Financial Goals**
<img width="1400" alt="Financial Goals" src="https://github.com/user-attachments/assets/cfb4e8a2-a6e1-4fe0-81fd-2eb52fb0cf19" />

<br/>

| PDF Export with Receipts | Mobile View (PWA) |
|:---:|:---:|
| <img width="400" alt="PDF Export" src="https://github.com/user-attachments/assets/81ab3aec-73f3-430f-8021-4943c20fcc5d" /> | <img width="200" alt="Mobile View" src="https://github.com/user-attachments/assets/a499879b-3b1f-4006-8e5e-f37061561db4" /> |

</div>

---

## Overview

FinSight is a production-ready personal finance application that helps users track transactions, manage budgets, set financial goals, and understand their spending patterns through AI-powered analysis. Built as a portfolio project demonstrating modern full-stack development with real-world features across the entire stack.

**Highlights:**
- 🤖 AI spending analysis powered by Google Gemini 2.5 Flash
- 📸 OCR receipt scanning — photograph a receipt to auto-fill transaction forms
- 🎯 Financial goals tracking with progress visualization
- 📱 Progressive Web App — installable on mobile and desktop
- 🔔 Smart budget alerts with automatic threshold notifications
- 📄 PDF & CSV export with receipt image attachments

---

## Features

### 📊 Dashboard
Real-time financial overview with summary cards (income, expense, net balance, saving rate), 6-month income vs expense trend chart, category spending breakdown pie chart, budget progress strips, recent transactions, and AI-generated spending insights.

### 💳 Transactions
Full CRUD with OCR receipt scanning via Gemini Vision, file attachment support (images/PDF stored in Supabase Storage), full-text search with 300ms debounce, category/date/type filters, recurring transactions (daily/weekly/monthly/yearly), and paginated list.

### 💰 Budget Management
Per-category monthly spending limits with real-time progress bars, configurable alert thresholds, and automatic toast notifications when a budget is exceeded — deduplicated to one alert per budget per month.

### 🎯 Financial Goals
Set savings targets with deadlines, track progress manually, and mark goals as complete. Supports custom icons, colors, and motivational notes per goal.

### 🤖 AI Insights
Queries real transaction data to generate 3 personalized insights per month — spending patterns, budget warnings, and saving tips. Results cached in PostgreSQL to minimize API costs.

### 📸 OCR Receipt Scanning
Upload or photograph a receipt. Gemini Vision extracts amount, date, merchant, and category to pre-fill the transaction form automatically.

### 📄 Export
CSV for spreadsheet analysis (includes receipt filename column). PDF with full transaction table, summary section, and a receipt image appendix — each transaction's receipt embedded at actual size.

### 🔐 Authentication
Email/password and Google OAuth via NextAuth.js. JWT sessions with 30-day persistence. Route protection via Next.js middleware with public path exclusions.

### 📱 PWA
Installable on Android, iOS (Safari), and desktop Chrome. Service worker for offline fallback. Add to Home Screen works across all supported platforms.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 — strict mode |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js v4 |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| File Storage | Supabase Storage (receipts) |
| Validation | Zod v4 |
| Forms | React Hook Form v7 |
| Charts | Recharts v3 |
| PDF | jsPDF + jsPDF-AutoTable |
| Testing | Vitest (165 tests) |
| CI/CD | GitHub Actions → Vercel |

---

## Project Structure

```
finsight/
├── app/
│   ├── (auth)/                 # Login, Register, Onboarding
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── transactions/       # Transaction management
│   │   ├── budgets/            # Budget management
│   │   ├── goals/              # Financial goals
│   │   ├── analytics/          # Detailed analytics
│   │   └── settings/           # User settings
│   ├── api/
│   │   ├── auth/               # NextAuth + registration
│   │   ├── transactions/       # CRUD + receipt upload API
│   │   ├── budgets/            # CRUD + alert checking
│   │   ├── goals/              # Financial goals CRUD
│   │   ├── categories/         # System + custom categories
│   │   ├── dashboard/summary/  # Aggregated dashboard data
│   │   ├── ai/insight/         # Gemini AI integration
│   │   ├── ocr/                # Receipt OCR via Gemini Vision
│   │   ├── export/             # CSV + PDF export
│   │   └── user/               # Settings, onboarding, delete account
│   └── manifest.ts             # PWA manifest (Next.js native)
├── components/
│   ├── dashboard/              # Summary cards, charts, AI insight card
│   ├── transactions/           # List, form modal, OCR scanner, receipt uploader
│   ├── budgets/                # Budget manager, alert bell
│   ├── goals/                  # Goals manager + goal cards
│   ├── settings/               # Settings form with delete account
│   ├── shared/                 # Sidebar, Header, BottomNav, Providers
│   └── ui/                     # Skeleton loaders
├── lib/
│   ├── prisma.ts               # Prisma client singleton (pg adapter)
│   ├── supabase.ts             # Supabase Storage client
│   ├── auth.ts                 # NextAuth configuration
│   ├── utils.ts                # Formatting, color helpers
│   └── validations.ts          # Zod schemas (shared client/server)
├── hooks/                      # useTransactions, useDebounce, etc.
├── types/                      # TypeScript interfaces
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Demo data seeder
├── public/
│   └── sw.js                   # Service worker (PWA)
└── middleware.ts               # Auth + onboarding route protection
```

---

## Key Engineering Decisions

**Prisma 7 driver adapter** — Uses `@prisma/adapter-pg` with connection pooling for Supabase pgBouncer compatibility, preventing "too many clients" errors on free tier. Schema defined separately in `prisma.config.ts`.

**Parallel data fetching** — Dashboard endpoint uses `Promise.all()` to run 3 aggregation queries concurrently instead of sequentially, cutting response time by ~60%.

**AI cost optimization** — Gemini insights are cached in PostgreSQL with `@@unique([userId, month, year])`. The model is only called once per user per month regardless of how many times the dashboard is visited.

**Supabase Storage with signed URLs** — Receipts stored privately under `{userId}/{transactionId}/` path structure. Signed URLs (1-hour expiry) generated server-side on every access — files are never directly public.

**Budget alert deduplication** — `BudgetAlert` has `@@unique([budgetId, month, year])` constraint. Alerts triggered client-side after every expense transaction, but only one notification fires per budget per calendar month.

**OCR without a separate Vision API** — Receipt scanning reuses the existing `GOOGLE_AI_API_KEY` with Gemini's multimodal capability (text + image in the same request), avoiding a separate Google Cloud Vision billing account.

**TypeScript `exactOptionalPropertyTypes`** — Enforces strict distinction between `undefined` and `null` throughout the codebase, preventing subtle bugs in optional form fields and Prisma update payloads.

---

## Local Development

### Prerequisites

- Node.js >= 20
- A [Supabase](https://supabase.com) project (free tier)
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client
- A [Google AI Studio](https://aistudio.google.com) API key

### Setup

```bash
git clone https://github.com/afifn11/finsight.git
cd finsight

npm install

cp .env.example .env.local
# Fill in all values — see below

npx prisma db push
npm run db:seed   # optional demo data

npm run dev
```

### Environment Variables

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database — Supabase PostgreSQL
DATABASE_URL=              # Pooler URL  (port 6543, ?pgbouncer=true)
DIRECT_URL=                # Direct URL  (port 5432)

# Google OAuth — console.cloud.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini AI — aistudio.google.com
GOOGLE_AI_API_KEY=

# Supabase Storage — project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Testing & Quality

```bash
npm run test:run     # 165 unit tests (Vitest)
npm run type-check   # TypeScript strict check
npm run lint         # ESLint
npm run build        # Full production build
```

GitHub Actions runs all four checks on every push to `main`. The CI badge at the top reflects the current status.

---

## Deployment

Deployed on Vercel with automatic deployments triggered by pushes to `main`. Build command: `prisma generate && next build`.

Database schema changes are applied manually via `npx prisma db push` against the production Supabase instance before merging.

---

## Scripts

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
npm run db:push       # Push schema to database
npm run db:studio     # Prisma Studio GUI
npm run db:seed       # Seed demo data
npm run test:run      # Run all tests
```

---

## License

MIT — free to use for educational and portfolio purposes.

---

<div align="center">

Built by [Muhammad Afif Naufal](https://github.com/afifn11)

</div>