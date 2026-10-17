# GarajeAR

GarajeAR is a full-stack vehicle ownership and garage management platform. It helps individuals and families track vehicles, maintenance, fuel and EV charging, expenses, inspections, documents, reminders, and financial analytics across multiple currencies.

## Features

- Multi-vehicle garage (cars, motorcycles, SUVs, pickups, vans, trucks, other)
- Maintenance history with linked expenses
- Fuel fill-ups and EV charging with consumption metrics
- Expense management with multi-currency support
- Technical inspections (VTV/RTO/ITV/generic) with reminders and expenses
- Document vault with secure upload/download
- Reminders (date and odometer based) with in-app notification center
- Reports and charts (spending, categories, vehicles, maintenance, energy)
- Historical exchange-rate snapshots (ARS/USD, extensible)
- Inflation-adjusted analytics using CPI indices
- Vehicle profile photos
- Google Sign-In (optional) + email/password
- Spanish and English with locale-aware formatting
- CSV/JSON export and account deletion
- Dark/light/system theme

## Tech stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Recharts, i18next
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Pino, Helmet, Multer
- Infra: Docker Compose, PostgreSQL, nginx

## Requirements

- Node.js 20+
- PostgreSQL 16+
- npm

## Setup

```bash
# 1. install dependencies
npm install

# 2. configure environment
cp .env.example apps/api/.env
# edit apps/api/.env (DATABASE_URL, SESSION_SECRET, etc.)

# 3. generate prisma client
npm run db:generate -w apps/api

# 4. apply migrations
npm run db:migrate -w apps/api

# 5. seed demo data (optional)
npm run db:seed -w apps/api
```

## Run (development)

```bash
# terminal 1
npm run dev -w apps/api

# terminal 2
npm run dev -w apps/web
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/health

## Demo credentials (development only)

- Email: `demo@garajear.local`
- Password: `Demo1234!`

Do not enable demo credentials in production.

## Tests

```bash
npm run test        # api + web
npm run typecheck   # tsc for shared/api/web
npm run lint        # eslint
npm run build       # production build
```

## Docker

```bash
docker compose up --build
```

Services: PostgreSQL (with healthcheck), API, web (nginx SPA proxying /api to api).

## Environment variables

See `.env.example`. Key variables:

- `NODE_ENV` — development | production
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — long random string
- `WEB_ORIGIN` — frontend origin (CORS)
- `UPLOAD_DIR` — file storage directory
- `MAX_UPLOAD_SIZE` — bytes
- `SMTP_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` — optional email
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — optional Google Sign-In

## Google Sign-In setup

1. Create OAuth 2.0 credentials in Google Cloud Console.
2. Authorized redirect URI: `http://localhost:4000/api/v1/auth/google/callback` (dev) or your production callback.
3. Set the env vars. If unset, the app runs with email/password only and `/auth/google` returns 501.

## Multi-currency and inflation

- Every financial record keeps its original amount and currency.
- Historical exchange-rate snapshots are stored manually (or via provider) with quote date, rate type, provider, manual override flag.
- For weekend/holiday transactions use the latest valid quote on or before the date (documented policy).
- Inflation adjustment uses published monthly CPI indices (user/admin supplied per country/series/month). `adjusted = nominal × referenceIndex / transactionIndex`.
- Never fabricates rates or CPI data; unavailable conversions are reported, not silently substituted.

## Internationalization

Spanish and English are fully supported. Language preference is persisted per user and restored across sessions. All user-facing text goes through i18n resources.

## Project structure

```
apps/
  api/        Express + Prisma + PostgreSQL
  web/        React + Vite
packages/
  shared/     Shared types/constants
docker-compose.yml
.env.example
README.md
README.es.md
```

## License

MIT
