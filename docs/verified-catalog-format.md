# Verified Catalog Format

The verified importer accepts:

- CSV files (`.csv`)
- JSON arrays (`.json`)

Default verified catalog target:

- `data/verified/perfumes.csv`

## CSV Header Example

```csv
brand,name,gender,year,top_notes,heart_notes,base_notes,family,rating,imageUrl,image_source_url,image_storage_path,image_public_url,description_short,description_long,price_range,is_arabic,is_niche,catalog_status,source_name,source_type,official_source_url,source_confidence,data_quality
Maison Francis Kurkdjian,Baccarat Rouge 540,UNISEX,2015,Saffron;Jasmine,Amberwood;Ambergris,Fir Resin;Cedar,Amber Floral,4.6,,https://assets.example.com/mfk/baccarat-rouge-540.jpg,verified/maison-francis-kurkdjian/baccarat-rouge-540.jpg,,Airy amber floral with saffron and woods.,A luminous amber floral composition with saffron and mineral ambergris facets.,LUXURY,false,true,VERIFIED,Brand Product Sheet,BRAND_OFFICIAL,https://www.maisonfranciskurkdjian.com/baccarat-rouge-540,0.97,HIGH
```

## JSON Record Example

```json
[
  {
    "brand": "Dior",
    "name": "Sauvage Elixir",
    "gender": "MEN",
    "release_year": 2021,
    "top_notes": ["Cinnamon", "Nutmeg", "Cardamom", "Grapefruit"],
    "heart_notes": ["Lavender"],
    "base_notes": ["Licorice", "Sandalwood", "Amber", "Patchouli"],
    "family": "Aromatic Spicy",
    "rating": 4.5,
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
# Normalize the file in-place
npm run perfumes:enrich

# Validate only
npm run perfumes:verify

# Import into PostgreSQL
npm run perfumes:import

# Notes-only enrichment for existing perfumes
npm run perfumes:import -- --mode=notes
```

The shared normalization and validation rules for these commands live in `lib/perfume-data/`.
