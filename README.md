# GarajeAR

Vehicle ownership and garage management SaaS.

## Requirements

- Node.js 20+
- PostgreSQL 16+
- npm

## Setup

```bash
# install dependencies
npm install

# configure environment
cp .env.example apps/api/.env
# edit apps/api/.env

# generate prisma client
npm run db:generate -w apps/api

# apply migrations
npm run db:migrate -w apps/api

# seed demo data
npm run db:seed -w apps/api
```

## Run

```bash
# terminal 1: api
npm run dev -w apps/api

# terminal 2: web
npm run dev -w apps/web
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Swagger: http://localhost:4000/api-docs (if enabled)

## Demo credentials (development only)

- Email: demo@garajear.local
- Password: Demo1234!

## Tests

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Docker

```bash
docker compose up --build
```

## Environment variables

See `.env.example`.
