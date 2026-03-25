# Data Schema

> All data models, storage formats, and normalization rules.

**Last updated:** 2026-03-26

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

## 2. Multi-Category Data (LIVE)

The `data.json` top-level structure uses category-specific arrays. All categories share the same `MonthEntry` schema. Currently populated: 26 months járelturg + 26 months newCars. Imports array is empty (infoleht has no import sheet; needs alternative source).

### ImportMonthEntry (Planned)

When import data becomes available, may extend `MonthEntry` with:

| Additional Field | Type | Description |
|-----------------|------|-------------|
| `originCountry` | `string \| null` | ISO 3166-1 alpha-2 country code of origin (if available) |

---

## 3. Vehicle Lookup

### VIN Decode Result (client-side)

Returned by `decodeVIN(vin)` in `index.html`:

```json
{
  "isValid": true,
  "vin": "WBAXXXXXXXXXXXXXXX",
  "wmi": "WBA",
  "vds": "XXXXXX",
  "make": "BMW",
  "modelYear": 2018,
  "yearCode": "J",
  "plant": "X",
  "serial": "XXXXXX"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `isValid` | `boolean` | Whether VIN passes validation (17 chars, no I/O/Q) |
| `vin` | `string` | Uppercase VIN string |
| `wmi` | `string` | World Manufacturer Identifier (chars 1-3) |
| `vds` | `string` | Vehicle Descriptor Section (chars 4-9) |
| `make` | `string` | Decoded manufacturer from WMI_MAP (70+ codes) |
| `modelYear` | `number \| null` | Decoded from position 10 via YEAR_CODES |
| `yearCode` | `string` | Raw character at VIN position 10 |
| `plant` | `string` | Assembly plant code (char 11) |
| `serial` | `string` | Sequential production number (chars 12-17) |

### mntstat.ee Scraper Result (server-side)

Returned by `scrape_vehicle.py` `search_by_reg()`:

```json
{
  "regNumber": "100BMW",
  "status": "Arvel",
  "count": "1",
  "make": "BMW",
  "model": "IX XDRIVE40",
  "bodyType": "Mahtuniversaal",
  "year": 2022,
  "color": "HALL",
  "fuelType": "Elekter",
  "transmission": "Automaatkäigukast",
  "powerKw": 240,
  "engineCc": 0,
  "weightKg": 2440,
  "county": "Harju maakond"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `regNumber` | `string` | Estonian registration plate number |
| `status` | `string` | Registration status (e.g., "Arvel") |
| `make` | `string` | Manufacturer, UPPERCASE |
| `model` | `string` | Full model name |
| `bodyType` | `string` | Body type in Estonian (e.g., "Mahtuniversaal") |
| `year` | `number` | Production/registration year |
| `color` | `string` | Vehicle color in Estonian |
| `fuelType` | `string` | Fuel type in Estonian (e.g., "Diisel", "Elekter") |
| `transmission` | `string` | Transmission type in Estonian |
| `powerKw` | `number` | Engine power in kilowatts |
| `engineCc` | `number` | Engine displacement in cc (0 for electric) |
| `weightKg` | `number` | Vehicle weight in kg |
| `county` | `string` | Registration county in Estonian |

### VehicleLookup (Planned — ATV API)

Full vehicle registry data from Transpordiamet ATV API (pending formal application + €15/mo):

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
| **Current** | Single `data.json` with 3 categories | ~2MB (26 months × 2 categories) | Now (Phase 2 complete) |
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
