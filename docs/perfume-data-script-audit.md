# Perfume Data Script Audit

This audit covers the catalog and perfume data scripts that previously lived under `scripts/import/`.

## Classification

| Script | Classification | Notes |
| --- | --- | --- |
| `scripts/enrich-perfumes.ts` | REFACTOR | Canonical verified enrichment entrypoint; now runs normalize, validate, match, enrich, verify, and export. |
| `scripts/verify-perfumes.ts` | KEEP | Canonical validation entrypoint. |
| `scripts/import-perfumes.ts` | KEEP | Canonical DB import entrypoint for verified and Parfumo sources. |
| `scripts/audit-verified-scores.ts` | KEEP | Canonical score-gap audit entrypoint for verified perfumes. |
| `scripts/sync-prices.ts` | KEEP | Canonical offer-to-price-range sync entrypoint. |
| `lib/perfume-data/enrich.ts` | KEEP | Canonical adapter-driven enrichment orchestrator with field policy, field-level provenance, and review queue output. |
| `lib/perfume-data/enrichment-policy.ts` | KEEP | Canonical source-priority, overwrite, missing-value, and conflict policy map. |
| `lib/perfume-data/sources/base.ts` | KEEP | Shared source-adapter contract and reusable matching primitives. |
| `lib/perfume-data/sources/parfumo.ts` | KEEP | Implemented trusted Parfumo top-list adapter. |
| `lib/perfume-data/sources/fragrantica.ts` | REFACTOR | Placeholder adapter; architecture-ready but not implemented because no trusted local integration exists yet. |
| `lib/perfume-data/sources/official-brand.ts` | REFACTOR | Placeholder adapter for future official-site integrations. |
| `scripts/import/import-verified-catalog.ts` | REFACTOR | Core verified import logic moved into `lib/perfume-data/normalize.ts`, `lib/perfume-data/import.ts`, and `scripts/import-perfumes.ts`. |
| `scripts/import/import-parfumo.ts` | REFACTOR | Reusable Parfumo normalization/import logic moved into the same shared services and canonical import script. |
| `scripts/import/lib/normalize.ts` | REFACTOR | CSV, note, rating, and year normalization moved into `lib/perfume-data/normalize.ts`. |
| `scripts/import/lib/mapGender.ts` | REFACTOR | Gender normalization moved into `lib/perfume-taxonomy.ts`. |
| `scripts/import/lib/mapFamily.ts` | REFACTOR | Family normalization moved into `lib/perfume-taxonomy.ts`. |
| `scripts/import/lib/slug.ts` | REFACTOR | Slug generation moved into `lib/perfume-data/normalize.ts`. |
| `scripts/import/backfill-catalog-provenance.ts` | ARCHIVE | One-shot catalog provenance backfill. |
| `scripts/import/bulk-upload-approved-images.ts` | ARCHIVE | Operational image upload flow, not part of the canonical perfume data path. |
| `scripts/import/fetch-images-from-brave.ts` | ARCHIVE | External image fetcher, one-off operational workflow. |
| `scripts/import/fetch-parfumo-tops.ts` | ARCHIVE | Source scraping helper for historical list imports. |
| `scripts/import/fill-verified-image-fields.ts` | ARCHIVE | Worklist generation for manual image curation. |
| `scripts/import/generate-approved-images-manifest.ts` | ARCHIVE | Manifest helper tied to the old image workflow. |
| `scripts/import/generate-missing-images-manifest-from-db.ts` | ARCHIVE | DB manifest helper tied to the old image workflow. |
| `scripts/import/generate-parfumo-dataset.ts` | ARCHIVE | Synthetic seed-style dataset generator; no longer part of the maintained flow. |
| `scripts/import/import-parfumo-tops.ts` | ARCHIVE | Historical CSV append flow for Parfumo top lists. |
| `scripts/import/repair-image-storage-paths.ts` | ARCHIVE | Legacy data repair migration. |
| `scripts/import/run-overnight-image-pipeline.ts` | ARCHIVE | Orchestrator for the retired image pipeline. |
| `scripts/import/suggest-image-source-urls.ts` | ARCHIVE | Operational image suggestion tool, not part of the canonical catalog flow. |
| `scripts/import/sync-verified-images.ts` | ARCHIVE | Retired image sync pipeline. |
| `data/sources/parfumo/top-men.csv` | KEEP | Trusted local Parfumo snapshot used for conservative verified enrichment matches. |
| `data/sources/parfumo/top-women.csv` | KEEP | Trusted local Parfumo snapshot used for conservative verified enrichment matches. |
| `data/sources/parfumo/top-unisex.csv` | KEEP | Trusted local Parfumo snapshot used for conservative verified enrichment matches. |
| `data/archive/synthetic/parfumo/perfumes.csv` | ARCHIVE | Synthetic dataset; excluded from real-data verified enrichment. |

## Kept Commands

- `npm run perfumes:enrich`
- `npm run perfumes:verify`
- `npm run perfumes:import`
- `npm run perfumes:scores:audit`
- `npm run prices:sync`

## New Single Source Of Truth

- `lib/perfume-taxonomy.ts`
- `lib/perfume-data/normalize.ts`
- `lib/perfume-data/validate.ts`
- `lib/perfume-data/import.ts`
- `lib/perfume-data/prices.ts`
- `lib/perfume-data/enrich.ts`
- `lib/perfume-data/enrichment-policy.ts`
- `lib/perfume-data/sources/base.ts`
- `lib/perfume-data/sources/parfumo.ts`
- `lib/perfume-data/sources/fragrantica.ts`
- `lib/perfume-data/sources/official-brand.ts`

## Current Adapter Coverage

- Real and trusted: `parfumo-top-lists`
  Provides conservative identity matching and `imageSourceUrl`
- Placeholder only: `fragrantica`
  Planned for notes, family, descriptions, scores, and images once a trusted ingestion path exists
- Placeholder only: `official-brand`
  Planned for official URLs, release year, notes, descriptions, and images once a trusted ingestion path exists

## Review Queue

The enrichment pipeline now writes:

- `data/generated/verified/perfume-review-queue.json`
- `data/generated/verified/perfume-review-queue.csv`

The score audit pipeline now writes:

- `data/generated/verified/perfume-score-gap-report.json`
- `data/generated/verified/perfume-score-worklist.csv`

These contain rows that are low-confidence, ambiguous, unmatched, or conflicting and are intended for manual curation before adding broader source integrations.
