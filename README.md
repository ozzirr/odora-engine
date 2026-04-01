# Odora Engine

Odora is an Italian-first fragrance discovery and comparison platform.
This repository contains the MVP web app, Prisma schema, and data pipelines used to build and maintain a production-grade perfume catalog.

## Current MVP Scope

- Next.js App Router frontend with responsive premium UI
- URL-driven perfume discovery on `/perfumes`:
  - gender, family, price, arabic/niche toggles
  - note filters (`note`, `top`, `heart`, `base`)
  - sorting (`rating`, `longevity`, `sillage`, `price_low`, `price_high`)
- Perfume detail page `/perfumes/[slug]` with:
  - notes, moods, seasons, occasions
  - best-price computation from offers
  - similar fragrances + cheaper alternatives
- Finder MVP on `/finder` (preference-based matching)
- Editorial discovery page `/top` with computed sections
- Catalog provenance support (`DEMO`, `IMPORTED_UNVERIFIED`, `VERIFIED`)
- Verified data and image ingestion workflows

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Prisma ORM
- PostgreSQL (Supabase)

## Requirements

- Node.js 20+
- npm 10+
- Supabase project (for Postgres + Storage)

## Environment Variables

Use one root `.env` file:

```bash
cp .env.example .env
```

Required/optional variables:

- `DATABASE_URL` (required): runtime DB URL used by the web app
- `DIRECT_URL` (recommended on Supabase/Vercel): direct or session-mode DB URL used by Prisma CLI commands
- `ODORA_CATALOG_MODE` (optional): `all` | `no_demo` | `verified_only`
- `ODORA_DB_CONNECTION_LIMIT` (optional): Prisma pool size override for runtime
- `ODORA_DB_POOL_TIMEOUT` (optional): Prisma pool timeout override for runtime
- `NEXT_PUBLIC_SUPABASE_URL` (required for auth client/session proxy)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (required for auth client/session proxy)
- `NEXT_PUBLIC_SITE_URL` (recommended, used for auth email callback links)
- `SUPABASE_URL` (required for image upload/sync scripts)
- `SUPABASE_SERVICE_ROLE_KEY` (required for image upload/sync scripts)
- `SUPABASE_STORAGE_BUCKET` (optional, default `perfumes`)

Important:

- Do not quote `DATABASE_URL`
- Do not commit secrets

### Vercel + Supabase Recommended Setup

For Vercel deployments, keep Prisma runtime on the Supabase pooled connection string and use a separate direct/session URL for Prisma CLI:

- `DATABASE_URL`: Supabase transaction pooler (`6543`) with `pgbouncer=true`
- `DIRECT_URL`: Supabase direct DB URL or session pooler (`5432`)
- `ODORA_DB_CONNECTION_LIMIT=1`: recommended starting point on Vercel
- `ODORA_DB_POOL_TIMEOUT=20`: safe default

Recommended rollout:

1. Start production with `ODORA_DB_CONNECTION_LIMIT=1`
2. Only raise to `2` if you see real pool contention or request queuing
3. Leave higher values alone unless you have measured evidence they help

### Auth Setup

Odora uses Supabase Auth (SSR) for email/password and OAuth:

- `/login` -> real `signInWithPassword`
- `/signup` -> real `signUp`
- `/auth/callback` -> verifies email tokens and exchanges OAuth codes for a session
- `proxy.ts` -> keeps auth session cookies refreshed on the protected auth/profile routes

The Google button calls `supabase.auth.signInWithOAuth(...)`. For Google with Supabase SSR/PKCE, configure both Google Cloud and Supabase:

1. In Google Cloud -> Google Auth Platform -> Clients, create a `Web application` OAuth client.
2. Under `Authorized JavaScript origins`, add your app origins:
   - local: `http://localhost:3000`
   - LAN/dev box: `http://<your-local-ip>:3000`
   - production: `https://<your-domain>`
3. Under `Authorized redirect URIs`, add your Supabase callback URL, not your app callback:
   - hosted Supabase: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - local Supabase CLI: `http://127.0.0.1:54321/auth/v1/callback`
4. In Supabase Dashboard -> Auth -> Providers -> Google, enable the provider and paste the Google client ID/secret.
5. In Supabase Dashboard -> Auth -> URL Configuration, set:
   - `Site URL`: your canonical site origin, for example `https://<your-domain>`
   - `Redirect URLs`: your app callback URLs, for example:
     - `http://localhost:3000/auth/callback`
     - `http://<your-local-ip>:3000/auth/callback`
     - `https://<your-domain>/auth/callback`
6. Set `NEXT_PUBLIC_SITE_URL` to your canonical public origin for email links and fallback redirects.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Push schema to DB:

```bash
npm run db:push
```

4. Seed baseline data:

```bash
npm run db:seed
```

Optional: populate homepage hero/trending/featured placements and discovery collections on an existing catalog:

```bash
npm run homepage:bootstrap
```

5. Start dev server:

```bash
npm run dev
```

Open: `http://localhost:3000`

## Core Commands

- `npm run dev` -> start Next.js in development
- `npm run build` -> generate Prisma client + production build
- `npm run start` -> run production build locally
- `npm run lint` -> run ESLint
- `npm run db:push` -> apply Prisma schema
- `npm run db:seed` -> seed baseline catalog
- `npm run db:studio` -> open Prisma Studio
- `npm run homepage:bootstrap` -> mark hero/trending/featured perfumes and homepage collections from real DB records

## Catalog Provenance

`Perfume` records include source-quality metadata:

- `catalogStatus`: `DEMO` | `IMPORTED_UNVERIFIED` | `VERIFIED`
- `sourceName`
- `sourceType`: `INTERNAL_DEMO` | `MANUAL_CURATION` | `COMMERCIAL_LICENSED` | `BRAND_OFFICIAL` | `PARTNER_FEED` | `OTHER`
- `officialSourceUrl`
- `sourceConfidence` (0-1)
- `dataQuality`: `LOW` | `MEDIUM` | `HIGH`

Catalog visibility for frontend queries is controlled via:

```bash
ODORA_CATALOG_MODE=all
ODORA_CATALOG_MODE=no_demo
ODORA_CATALOG_MODE=verified_only
```

## Perfume Data Flow

The catalog workflow now runs through four canonical commands:

```bash
npm run perfumes:update
npm run perfumes:enrich
npm run perfumes:verify
npm run perfumes:import
npm run perfumes:scores:audit
npm run prices:sync
```

What each command does:

- `perfumes:update` runs `verify -> enrich -> import` in sequence for the current perfume source.
- `perfumes:enrich` reads `data/verified/perfumes.csv`, keeps it untouched, and writes normalized/enriched artifacts into `data/generated/verified/`.
- `perfumes:verify` checks the same normalization and validation rules without writing anything.
- `perfumes:import` upserts the import-ready catalog into PostgreSQL. By default it reads `data/generated/verified/perfumes.enriched.csv`. Use `-- --source=verified|parfumo` and `-- --mode=upsert|notes` when needed.
- `perfumes:scores:audit` writes a score-gap report and CSV worklist for verified perfumes missing `longevity`, `sillage`, or `versatility`.
- `prices:sync` recomputes `Perfume.priceRange` from current offers and refreshes `Offer.isBestPrice`.

Defaults:

- `perfumes:update` runs the full verified flow with one command
- `perfumes:verify` targets `data/verified/perfumes.csv`
- `perfumes:enrich` writes `data/generated/verified/perfumes.cleaned.csv`, `data/generated/verified/perfumes.enriched.csv`, and the related reports
- `perfumes:import` targets `data/generated/verified/perfumes.enriched.csv`
- `perfumes:scores:audit` writes `data/generated/verified/perfume-score-gap-report.json` and `data/generated/verified/perfume-score-worklist.csv`
- `perfumes:* -- --source=parfumo` targets the archived synthetic dataset at `data/archive/synthetic/parfumo/perfumes.csv`
- all commands support `-- --dry-run`
  For `perfumes:update`, `-- --dry-run` runs only `verify + enrich` and skips the DB import step.

The single source of truth for perfume data normalization now lives in:

- `lib/perfume-taxonomy.ts`
- `lib/perfume-data/normalize.ts`
- `lib/perfume-data/validate.ts`
- `lib/perfume-data/import.ts`
- `lib/perfume-data/prices.ts`

Historical one-off import/image scripts were moved to `scripts/archive/import/` for reference only.

## Deployment Notes (Vercel)

- Repository root is the app root for Vercel.
- Dynamic routes use runtime DB access where needed.
- Set env vars in Vercel Project Settings:
  - `DATABASE_URL`
  - `ODORA_CATALOG_MODE` (optional)
  - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (if image scripts or server-side integrations require them)

## Project Structure (Key Paths)

```text
app/
components/
lib/
prisma/
scripts/
scripts/archive/import/
data/verified/
  perfumes.csv
data/generated/verified/
  perfumes.cleaned.csv
  perfumes.enriched.csv
  perfume-validation-report.json
  perfume-enrichment-report.json
  perfume-review-queue.json
  perfume-review-queue.csv
data/sources/parfumo/
  top-men.csv
  top-women.csv
  top-unisex.csv
data/archive/
  synthetic/parfumo/perfumes.csv
  verified/images/
```

## Troubleshooting

- Prisma URL error (`protocol postgresql:// or postgres://`):
  - verify `prisma/schema.prisma` datasource provider is `postgresql`
  - verify root `.env` has valid unquoted `DATABASE_URL`
- dry-run a catalog command before writing:
  - `npm run perfumes:verify`
  - `npm run perfumes:enrich -- --dry-run`
  - `npm run perfumes:import -- --dry-run`
