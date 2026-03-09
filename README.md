# Odora MVP Foundation

Odora is an Italian-first fragrance discovery and comparison platform.
This MVP foundation focuses on technical structure and UX scaffolding for:

- Browsing perfumes
- Filtering by style and profile
- Viewing perfume detail pages
- Comparing offers from stores
- Preparing for a future finder/advisor flow

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL (Supabase)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env
```

3. Generate Prisma client and sync database:

```bash
npm run db:push
```

4. Seed sample data:

```bash
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment Notes (Vercel)

- The app is configured to **build safely even if `DATABASE_URL` is missing**.
- Routes that rely on Prisma are runtime-dynamic and use safe fallbacks when DB config is absent.
- To enable full database-backed behavior in production, set:
  - `DATABASE_URL` (for example `file:./dev.db` locally; for Vercel use a production database URL when you introduce one)
- For local SQLite development, continue using `.env` from `.env.example`.

## Database Commands

- `npm run db:push` -> apply schema to PostgreSQL
- `npm run db:seed` -> seed realistic fragrance sample data
- `npm run db:studio` -> inspect data in Prisma Studio

## Catalog Provenance

Perfume records now include provenance metadata and quality classification:

- `catalogStatus`: `DEMO` | `IMPORTED_UNVERIFIED` | `VERIFIED`
- `sourceName`
- `sourceType`: `INTERNAL_DEMO` | `MANUAL_CURATION` | `COMMERCIAL_LICENSED` | `BRAND_OFFICIAL` | `PARTNER_FEED` | `OTHER`
- `officialSourceUrl`
- `sourceConfidence` (0-1)
- `dataQuality`: `LOW` | `MEDIUM` | `HIGH`

To exclude demo records from listing endpoints:

```bash
ODORA_CATALOG_MODE=no_demo
```

Or only show verified catalog records:

```bash
ODORA_CATALOG_MODE=verified_only
```

## Verified Catalog Import

Import verified manually curated/commercial catalog data:

- Dry run:

```bash
npm run import:verified:dry
```

- Real import:

```bash
npm run import:verified
```

Default input path: `data/verified/perfumes.csv` (override with `--input=...`).

Supported formats:

- CSV
- JSON array

Supported record fields:

- `brand`, `brand_slug` (optional)
- `name`, `slug` (optional)
- `gender`
- `year` / `release_year`
- `family` / `fragrance_family`
- `description_short`, `description_long`
- `price_range`
- `image_url`
- `rating`
- `is_arabic`, `is_niche`
- `top_notes`, `heart_notes`, `base_notes`
- `catalog_status`, `source_name`, `source_type`, `official_source_url`, `source_confidence`, `data_quality`

## Verified Images Sync (Supabase Storage)

Sync verified perfume images from source URLs to Supabase Storage and write back `image_public_url` in `data/verified/perfumes.csv`.

Required env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (optional, defaults to `perfumes`)

CSV image fields used by the sync script:

- `image_source_url`
- `image_storage_path`
- `image_public_url`

Commands:

```bash
# Normal mode: skip rows that already have image_public_url
npm run sync:verified:images

# Force mode: re-upload and overwrite image_public_url
npm run sync:verified:images:force
```

## Backfill Existing Demo Data

Backfill provenance for legacy records with missing source metadata:

```bash
npm run catalog:backfill:provenance:dry
npm run catalog:backfill:provenance
```

## Implemented MVP Scope

- Global layout with responsive header and footer
- Home page (`/`) with hero, featured perfumes, quick filters, and trending preview cards
- Perfumes catalog (`/perfumes`) with client-side filtering UI
- Perfume detail page (`/perfumes/[slug]`) with notes, scores, badges, offers, and related placeholder
- Finder placeholder page (`/finder`)
- Top/editorial placeholder page (`/top`)
- Reusable UI and domain components
- Prisma schema with full domain models (brands, perfumes, notes, moods, seasons, occasions, stores, offers)
- Seed script with:
  - 6 brands
  - 12 perfumes
  - notes, moods, seasons, occasions
  - 3 stores
  - multi-offer data per perfume

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  globals.css
  perfumes/
    page.tsx
    PerfumesClient.tsx
    [slug]/
      page.tsx
  finder/
    page.tsx
  top/
    page.tsx
components/
  layout/
    Header.tsx
    Footer.tsx
    Container.tsx
  home/
    Hero.tsx
    FeaturedPerfumes.tsx
    QuickFilters.tsx
  perfumes/
    PerfumeCard.tsx
    PerfumeGrid.tsx
    PerfumeFilters.tsx
    PerfumeHero.tsx
    OfferTable.tsx
    NotesList.tsx
    MoodBadges.tsx
  ui/
    Button.tsx
    Badge.tsx
    SectionTitle.tsx
lib/
  prisma.ts
  utils.ts
  sample-data.ts
prisma/
  schema.prisma
  seed.ts
public/
  images/
.env.example
README.md
```

## What to Build Next

1. URL-driven filtering and sorting state for `/perfumes`
2. Rich perfume comparison view (side-by-side)
3. Finder flow (multi-step preferences + recommendation logic)
4. Better media pipeline and real product imagery
5. Editorial and ranking logic for `/top`
6. Automated tests for filtering and detail rendering
