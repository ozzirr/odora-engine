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
- SQLite (local development)

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

- `npm run db:push` -> apply schema to SQLite
- `npm run db:seed` -> seed realistic fragrance sample data
- `npm run db:studio` -> inspect data in Prisma Studio

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
