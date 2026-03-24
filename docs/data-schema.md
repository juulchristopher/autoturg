# Data Schema

> All data models, storage formats, and normalization rules.

**Last updated:** 2026-03-25

---

## 1. Current Data Model

### data.json — Top Level

```json
{
  "jarelturg": [ MonthEntry, ... ],
  "newCars":   [ MonthEntry, ... ],
  "imports":   [ MonthEntry, ... ]
}
```

### MonthEntry

```json
{
  "year": 2024,
  "month": 1,
  "label": "Jan 2024",
  "sheetUsed": "Järelturg",
  "rows": [ TransactionRow, ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `year` | `number` | Calendar year (e.g., 2024) |
| `month` | `number` | Month 1-12 |
| `label` | `string` | Human-readable label (e.g., "Jan 2024") |
| `sheetUsed` | `string` | Name of the Excel sheet this data was parsed from |
| `rows` | `TransactionRow[]` | All parsed transaction rows for this month |

### TransactionRow

```json
{
  "make": "VOLKSWAGEN",
  "model": "GOLF",
  "variant": "GTI",
  "fullModel": "GOLF GTI",
  "prodYear": 2015,
  "count": 127
}
```

| Field | Type | Description |
|-------|------|-------------|
| `make` | `string` | Manufacturer name, UPPERCASE (e.g., "VOLKSWAGEN", "BMW") |
| `model` | `string` | First word of the full model name (e.g., "GOLF") |
| `variant` | `string` | Remaining words after model (e.g., "GTI", "1.6 TDI"). Empty string if no variant. |
| `fullModel` | `string` | Original complete model string from the source data |
| `prodYear` | `number \| null` | Production/registration year. Null if not available in source data. |
| `count` | `number` | Number of owner-change transactions in this month |

### Model Splitting Rules

The `fullModel` string is split into `model` + `variant`:

- Default: first word becomes `model`, everything after becomes `variant`
- **Multi-word exceptions:** Tesla models are kept whole — "MODEL 3", "MODEL S", "MODEL X", "MODEL Y" are treated as the model name, not split
- **Summary row exclusion:** Rows with make containing "KOKKU", "TOTAL", "ZUSAMMEN", or "SUM" are skipped (these are totals, not individual models)

### localStorage Key

Client-side data is cached under key `jarelturDB_v3`. The value is the full `data.json` structure serialized as JSON.

---

## 2. Planned: Multi-Category Transaction Data

### Extended data.json Structure

```json
{
  "jarelturg": [ MonthEntry, ... ],
  "newCars": [ MonthEntry, ... ],
  "imports": [ ImportMonthEntry, ... ]
}
```

The top-level `months` array will be replaced with category-specific arrays. Each uses the same `MonthEntry` schema, with category-specific extensions.

### ImportMonthEntry

Extends `MonthEntry` with import-specific fields:

```json
{
  "year": 2024,
  "month": 6,
  "label": "Jun 2024",
  "sheetUsed": "Import",
  "rows": [
    {
      "make": "BMW",
      "model": "3",
      "variant": "320d",
      "fullModel": "3 320d",
      "prodYear": 2018,
      "count": 45,
      "originCountry": "DE"
    }
  ]
}
```

| Additional Field | Type | Description |
|-----------------|------|-------------|
| `originCountry` | `string \| null` | ISO 3166-1 alpha-2 country code of origin (if available) |

---

## 3. Planned: Vehicle Lookup

### VehicleLookup

Returned from ATV API or Open Data Portal when a user queries by VIN or registration number.

```json
{
  "vin": "WBAXXXXXXXXXXXXXXX",
  "regNumber": "123ABC",
  "make": "BMW",
  "model": "320d",
  "variant": "M Sport",
  "prodYear": 2018,
  "fuelType": "diesel",
  "powerKw": 140,
  "bodyType": "sedan",
  "color": "black",
  "firstRegDate": "2018-06-15",
  "firstRegInEstonia": "2020-03-10",
  "mileage": null,
  "ownerChangeCount": 2
}
```

| Field | Type | Description |
|-------|------|-------------|
| `vin` | `string` | 17-character Vehicle Identification Number |
| `regNumber` | `string` | Estonian registration plate number |
| `make` | `string` | Manufacturer |
| `model` | `string` | Model name |
| `variant` | `string` | Trim/configuration |
| `prodYear` | `number` | Year of manufacture |
| `fuelType` | `string` | petrol, diesel, electric, hybrid, plugin_hybrid |
| `powerKw` | `number` | Engine power in kilowatts |
| `bodyType` | `string` | sedan, wagon, hatchback, suv, coupe, convertible, van |
| `color` | `string` | Vehicle color |
| `firstRegDate` | `string` | ISO 8601 date of first registration anywhere |
| `firstRegInEstonia` | `string \| null` | ISO 8601 date of first registration in Estonia |
| `mileage` | `number \| null` | Last known mileage (km), if available |
| `ownerChangeCount` | `number` | Number of ownership changes in Estonia |

---

## 4. Planned: Pricing Data

### ListingPrice

Individual listing from a marketplace platform.

```json
{
  "source": "mobile.de",
  "sourceId": "abc123",
  "make": "BMW",
  "model": "320d",
  "variant": "M Sport",
  "prodYear": 2018,
  "mileage": 85000,
  "fuelType": "diesel",
  "price": 22500,
  "currency": "EUR",
  "listedDate": "2026-03-15",
  "url": "https://..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `source` | `string` | Platform name: mobile.de, autoscout24, auto24.ee, autoportaal.ee |
| `sourceId` | `string` | Listing ID on the source platform |
| `make` | `string` | Manufacturer (normalized) |
| `model` | `string` | Model name (normalized) |
| `variant` | `string` | Trim/configuration |
| `prodYear` | `number` | Production year |
| `mileage` | `number` | Odometer reading in km |
| `fuelType` | `string` | Fuel type |
| `price` | `number` | Asking price |
| `currency` | `string` | ISO 4217 currency code (always normalized to EUR) |
| `listedDate` | `string` | ISO 8601 date when listing was captured |
| `url` | `string` | Direct link to the listing |

### PriceAggregate

Computed summary for a make/model/variant/year combination.

```json
{
  "make": "BMW",
  "model": "320d",
  "variant": "M Sport",
  "prodYear": 2018,
  "sampleSize": 47,
  "medianPrice": 22500,
  "p25Price": 19800,
  "p75Price": 25200,
  "minPrice": 15000,
  "maxPrice": 31000,
  "avgMileage": 92000,
  "lastUpdated": "2026-03-20"
}
```

---

## 5. Planned: Depreciation Data

### DepreciationCurve

Computed from pricing data across production years for a given model.

```json
{
  "make": "BMW",
  "model": "320d",
  "variant": null,
  "dataPoints": [
    { "ageYears": 1, "medianPrice": 38000, "sampleSize": 12 },
    { "ageYears": 2, "medianPrice": 32000, "sampleSize": 28 },
    { "ageYears": 3, "medianPrice": 27000, "sampleSize": 45 },
    { "ageYears": 5, "medianPrice": 22000, "sampleSize": 67 },
    { "ageYears": 8, "medianPrice": 15000, "sampleSize": 34 },
    { "ageYears": 10, "medianPrice": 10000, "sampleSize": 18 }
  ],
  "annualDepreciationPct": 12.5,
  "lastUpdated": "2026-03-20"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `variant` | `string \| null` | Null means aggregate across all variants |
| `dataPoints` | `array` | One entry per age bracket |
| `dataPoints[].ageYears` | `number` | Vehicle age in years (current year - prodYear) |
| `dataPoints[].medianPrice` | `number` | Median asking price in EUR |
| `dataPoints[].sampleSize` | `number` | Number of listings in this bracket |
| `annualDepreciationPct` | `number` | Average annual depreciation percentage |

---

## 6. Data Normalization Rules

### Make Name Normalization

Different sources use different spellings. Normalize to a canonical form:

| Source Variation | Canonical |
|-----------------|-----------|
| MERCEDES-BENZ, MERCEDES, MB | MERCEDES-BENZ |
| VW, VOLKSWAGEN | VOLKSWAGEN |
| ALFA ROMEO, ALFAROMEO | ALFA ROMEO |
| LAND ROVER, LANDROVER | LAND ROVER |

Normalization happens at ingestion time. A `make_aliases.json` lookup table maps variations to canonical names.

### Model Name Matching

Cross-source model matching uses fuzzy matching with these rules:
1. Exact match after uppercase normalization
2. Strip spaces and hyphens for comparison (e.g., "3 SERIES" == "3SERIES")
3. Manual override table for known mismatches

### Currency

All prices are stored in EUR. Listings in other currencies are converted at ingestion time using the ECB reference rate for that day.

### Production Year vs First Registration

- `prodYear`: year the vehicle was manufactured (from Transpordiamet or listing data)
- `firstRegDate`: date of first registration anywhere (from vehicle registry)
- These may differ by 0-2 years. Use `prodYear` for depreciation calculations.

---

## 7. Storage Strategy

| Stage | Format | Size Estimate | When |
|-------|--------|---------------|------|
| **Current** | Single `data.json` | ~1MB (26 months, jarelturg only) | Now |
| **Phase 1** | Single `data.json` with 3 categories | ~3MB | After expanding to 3 categories |
| **Phase 3** | `data.json` + `prices.json` | ~5-10MB total | After adding pricing data |
| **Phase 4+** | SQLite or cloud DB | Unlimited | When static JSON becomes unwieldy |

### Migration Path

1. **JSON files** — committed to repo, fetched by frontend. Simple, versioned, works with GitHub Pages.
2. **Split JSON** — separate files per category (`jarelturg.json`, `newcars.json`, `imports.json`, `prices.json`) to allow incremental loading.
3. **SQLite** — single file database, queryable, still works with static hosting if pre-built.
4. **Cloud DB** — Supabase or PlanetScale for real-time queries. Requires backend/proxy.

---

## 8. Future API Response Formats

When a backend or serverless proxy is introduced, these are the planned endpoints:

```
GET /api/transactions?make=BMW&model=320d&category=jarelturg
GET /api/transactions/overview?category=jarelturg&months=12
GET /api/prices?make=BMW&model=320d&prodYear=2018
GET /api/prices/aggregate?make=BMW&model=320d
GET /api/vehicle?vin=WBAXXXXXXXXXXXXXXX
GET /api/vehicle?reg=123ABC
GET /api/depreciation?make=BMW&model=320d
```

Response format: standard JSON with `{ data, meta }` wrapper:

```json
{
  "data": { ... },
  "meta": {
    "source": "autoturg",
    "timestamp": "2026-03-24T12:00:00Z",
    "cacheHit": true
  }
}
```
