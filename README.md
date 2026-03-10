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

- `DATABASE_URL` (required for DB-backed routes and Prisma commands)
- `ODORA_CATALOG_MODE` (optional): `all` | `no_demo` | `verified_only`
- `NEXT_PUBLIC_SUPABASE_URL` (required for auth client/session middleware)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (required for auth client/session middleware)
- `NEXT_PUBLIC_SITE_URL` (recommended, used for auth email callback links)
- `SUPABASE_URL` (required for image upload/sync scripts)
- `SUPABASE_SERVICE_ROLE_KEY` (required for image upload/sync scripts)
- `SUPABASE_STORAGE_BUCKET` (optional, default `perfumes`)

Important:

- Do not quote `DATABASE_URL`
- Do not commit secrets

### Auth (Email/Password) Setup

Odora uses Supabase Auth (SSR) for email/password:

- `/login` -> real `signInWithPassword`
- `/signup` -> real `signUp`
- `/auth/callback` -> verifies callback tokens/codes
- `middleware.ts` -> keeps auth session cookies refreshed

Social providers (Google/Apple/Facebook) are still placeholder buttons in UI until provider keys are configured.

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

## Data Import Pipelines

### 1) Demo / Parfumo-style Import

- Generate synthetic Parfumo-style dataset:

```bash
npm run generate:parfumo-dataset
```

- Dry run import (first 2000):

```bash
npm run import:parfumo:dry
```

- Real import (first 2000):

```bash
npm run import:parfumo
```

### 2) Verified Catalog Import

Input default: `data/verified/perfumes.csv`

- Dry run:

```bash
npm run import:verified:dry
```

- Real import:

```bash
npm run import:verified
```

- Notes enrichment only (safe for existing catalog rows; no perfume upsert):

```bash
npm run import:verified:notes:dry
npm run import:verified:notes
```

This mode reads `top_notes`, `heart_notes`, `base_notes`, normalizes them, upserts `Note` records, and creates
`PerfumeNote` links for matched existing perfumes (slug first, then brand+name fallback), with idempotent duplicate
protection.

### 3) Backfill Provenance for Existing Records

```bash
npm run catalog:backfill:provenance:dry
npm run catalog:backfill:provenance
```

## Image Workflows

### A) Build Image Worklist

Generates curation worklists and auto-fills missing `image_storage_path` when needed.

```bash
npm run images:worklist
npm run images:worklist:verified
```

Output:

- `data/verified/worklists/image-sourcing-worklist.csv`
- `data/verified/worklists/image-sourcing-worklist.json`

### B) Suggest `image_source_url` Candidates

Attempts suggestions from `official_source_url` using metadata/JSON-LD/common image selectors.

```bash
npm run images:suggest-sources
npm run images:suggest-sources:verified
```

You can pass extra flags, for example:

```bash
npm run images:suggest-sources:verified -- --limit=50
```

Output:

- `data/verified/worklists/image-source-suggestions.csv`
- `data/verified/worklists/image-source-suggestions.json`

Includes diagnostics per row (`review_status`, `failure_reason`, `http_status_code`, `final_url`).

### C) Sync Images from Source URLs to Supabase Storage

Reads `image_source_url`, uploads to Storage, writes back `image_public_url`.

```bash
npm run sync:verified:images
npm run sync:verified:images:force
```

### D) Bulk Upload Approved Local Images (Fastest Production Path)

Manifest:

- `data/verified/approved-images-manifest.csv`
- `image_storage_path` format: `<brand-slug>/<perfume-slug>.jpg` (no leading `perfumes/`)

Expected local files (example pattern):

- `data/verified/approved-images/<brand-slug>/<perfume-slug>.jpg`

Commands:

```bash
npm run images:manifest:generate
npm run images:bulk-upload:dry
npm run images:bulk-upload
npm run images:bulk-upload:db
```

Optional flags (examples):

```bash
npm run images:bulk-upload:dry -- --limit=10
npm run images:bulk-upload -- --force --limit=50
npm run images:bulk-upload:db -- --force
```

Behavior:

- Uploads local image files to Supabase bucket `perfumes`
- Updates matching rows in `data/verified/perfumes.csv`
- Matching by `slug`, fallback to normalized `brand + name`
- `--update-db` also updates `Perfume.imageUrl` in PostgreSQL

### E) Repair Incorrect Storage Paths / URLs

Fixes legacy values where storage path started with `perfumes/` and URLs contained `/public/perfumes/perfumes/`.

```bash
npm run images:repair-paths:dry
npm run images:repair-paths
```

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
scripts/import/
data/verified/
  perfumes.csv
  approved-images-manifest.csv
  worklists/
```

## Troubleshooting

- Prisma URL error (`protocol postgresql:// or postgres://`):
  - verify `prisma/schema.prisma` datasource provider is `postgresql`
  - verify root `.env` has valid unquoted `DATABASE_URL`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing:
  - set them in root `.env` before running image upload/sync scripts
- `images:suggest-sources` returns many `FETCH_FAILED` with `BLOCKED:HTTP 403`:
  - some brand domains block automated requests; use approved local image workflow (`images:bulk-upload`) for reliable production ingestion
