# TacticalShack

Precision shooter's utility platform — find ranges, gunsmiths, track NFA wait times, verify parts compatibility.

## Project structure

- **`client/`** — React + Vite + Tailwind + React Router frontend
- **`server/`** — Node.js + Express + Prisma backend
- **`tacticalshack-brief.md`** — Product brief
- **`tacticalshack-ranges-instructions.md`** — Ranges feature build instructions

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Database (PostgreSQL)

Create a PostgreSQL database, then:

```bash
cd server
cp .env.example .env
# Edit .env and set DATABASE_URL
```

### 3. Prisma

```bash
npm run db:migrate   # Creates tables
npm run db:seed      # Seeds 6 sample ranges
```

### 4. Run development servers

```bash
npm run dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:3001

Or double‑click `start-dev.cmd` (Windows).

## Environment variables

See `server/.env.example`. Required for local development:

- `DATABASE_URL` — PostgreSQL connection string

Optional (for full functionality):

- `CLERK_SECRET_KEY` — Auth (claims, reviews require login)
- `GOOGLE_PLACES_API_KEY` — Google ratings
- `GOOGLE_MAPS_API_KEY` — Maps embeds

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run client + API (concurrent) |
| `npm run build` | Build client for production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed ranges |
| `npm run db:studio` | Open Prisma Studio |

## Deploy to Railway

- **Frontend:** Build `client/`, serve `dist/`
- **Backend:** Deploy `server/` as Node service
- **Database:** Add PostgreSQL from Railway

## GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/ts.git
git push -u origin main
```
