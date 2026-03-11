# Verified Catalog Format

The verified importer accepts:

- CSV files (`.csv`)
- JSON arrays (`.json`)

Default verified catalog target:

- `data/verified/perfumes.csv`

## CSV Header Example

```csv
brand,name,slug,gender,concentration,year,top_notes,heart_notes,base_notes,family,rating,longevity_score,sillage_score,versatility_score,imageUrl,image_source_url,image_storage_path,image_public_url,description_short,description_long,price_range,is_arabic,is_niche,catalog_status,source_name,source_type,official_source_url,source_confidence,data_quality
Maison Francis Kurkdjian,Baccarat Rouge 540,maison-francis-kurkdjian-baccarat-rouge-540,UNISEX,,2015,Saffron;Jasmine,Amberwood;Ambergris,Fir Resin;Cedar,Amber,4.6,9,8,6,,https://assets.example.com/mfk/baccarat-rouge-540.jpg,verified/maison-francis-kurkdjian/baccarat-rouge-540.jpg,,Airy amber floral with saffron and woods.,A luminous amber floral composition with saffron and mineral ambergris facets.,LUXURY,false,true,VERIFIED,Brand Product Sheet,BRAND_OFFICIAL,https://www.maisonfranciskurkdjian.com/baccarat-rouge-540,0.97,HIGH
```

## JSON Record Example

```json
[
  {
    "brand": "Dior",
    "name": "Sauvage Elixir",
    "slug": "dior-sauvage-elixir",
    "gender": "MEN",
    "concentration": "Parfum",
    "release_year": 2021,
    "top_notes": ["Cinnamon", "Nutmeg", "Cardamom", "Grapefruit"],
    "heart_notes": ["Lavender"],
    "base_notes": ["Licorice", "Sandalwood", "Amber", "Patchouli"],
    "family": "Woody",
    "rating": 4.5,
    "longevity_score": 9,
    "sillage_score": 8,
    "versatility_score": 6,
    "image_url": "https://cdn.example.com/sauvage-elixir.jpg",
    "image_source_url": "https://assets.example.com/dior/sauvage-elixir.jpg",
    "image_storage_path": "verified/dior/sauvage-elixir.jpg",
    "image_public_url": "https://<project-ref>.supabase.co/storage/v1/object/public/perfumes/verified/dior/sauvage-elixir.jpg",
    "description_short": "Concentrated aromatic-spicy profile.",
    "description_long": "Dense spicy opening with aromatic lavender and warm woods.",
    "price_range": "PREMIUM",
    "is_arabic": false,
    "is_niche": false,
    "catalog_status": "VERIFIED",
    "source_name": "Licensed distributor feed",
    "source_type": "COMMERCIAL_LICENSED",
    "official_source_url": "https://www.dior.com/en_us/beauty/products/sauvage-elixir",
    "source_confidence": 0.93,
    "data_quality": "HIGH"
  }
]
```

## Canonical Commands

```bash
# Normalize, validate, match trusted local sources, and export an enriched CSV
npm run perfumes:enrich

# Validate only
npm run perfumes:verify

# Import into PostgreSQL
npm run perfumes:import

# Notes-only enrichment for existing perfumes
npm run perfumes:import -- --mode=notes
```

Default verified outputs:

- `data/verified/perfumes.enriched.csv`
- `data/verified/perfume-enrichment-report.json`

Validation currently enforces:

- `catalog_status=VERIFIED` for the verified pipeline
- lowercase, dash-separated, unique slugs
- `gender` normalized to `MEN`, `WOMEN`, or `UNISEX`
- required fields: `brand`, `name`, `slug`, `gender`, `fragranceFamily`
- optional `longevity_score`, `sillage_score`, and `versatility_score` values within `0-10`

Verified enrichment currently uses only trusted local source snapshots:

- `data/import/parfumo-top-men.csv`
- `data/import/parfumo-top-women.csv`
- `data/import/parfumo-top-unisex.csv`

The enriched CSV keeps the canonical import columns and appends record-level provenance columns:

- `matched_source`
- `matched_url`
- `matched_name`
- `matched_confidence`
- `enrichment_status`
- `enrichment_notes`
- `source_last_checked_at`

The shared normalization and validation rules for these commands live in `lib/perfume-data/`.
