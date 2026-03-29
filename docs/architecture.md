# Architecture

> System components, data flow, technology decisions, and integration design.

**Last updated:** 2026-03-27 (ADR-006–009 added: dual-tier monetization)

---

## 1. System Overview

```mermaid
flowchart TB
    subgraph sources["Data Sources"]
        TA["Transpordiamet\ninfoleht .xlsx"]
        ATV["ATV API\nabi.ria.ee"]
        ODP["Open Data Portal\nandmed.eesti.ee"]
        MDE["mobile.de API"]
        AS24["AutoScout24 API"]
        A24["auto24.ee"]
        AP["autoportaal.ee"]
    end

    subgraph ingestion["Ingestion Layer"]
        PP["parse.py\n(Excel → JSON)"]
        SV["scrape_vehicle.py\n(mntstat.ee)"]
        API_PROXY["API Proxy\n(serverless)"]
        SCRAPER["Scraper\n(auto24/autoportaal)"]
    end

    subgraph storage["Storage"]
        DJ["data.json\n(transaction data)"]
        PJ["prices.json\n(listing prices)"]
        VDB["vehicle DB\n(lookup cache)"]
    end

    subgraph frontend["Frontend (React SPA)"]
        REACT["React 18 + Vite\nsrc/pages/*, src/components/*"]
        CJS["Chart.js 4.4\nvia react-chartjs-2"]
        CTX["DataContext\n(global state)"]
        LS["localStorage\n(proxy URL override)"]
    end

    subgraph hosting["Hosting"]
        GHP["GitHub Pages"]
        GHA["GitHub Actions\n(monthly cron)"]
    end

    TA --> PP
    ODP --> PP
    PP --> DJ
    MNT["mntstat.ee"] --> SV
    SV --> VDB
    ATV --> API_PROXY
    MDE --> API_PROXY
    AS24 --> API_PROXY
    A24 --> SCRAPER
    AP --> SCRAPER
    API_PROXY --> PJ
    API_PROXY --> VDB
    SCRAPER --> PJ
    STAT["Statistikaamet\nandmed.stat.ee"] --> PP
    DJ --> REACT
    PJ --> SPA
    VDB --> SPA
    SPA --> CJS
    SPA --> LS
    GHA --> PP
    SPA --> GHP
```

---

## 2. Current Architecture (v1)

The current system is deliberately simple: a static site with a Python data pipeline.

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React SPA (Vite + TypeScript + Tailwind + shadcn/ui) | Single-page dashboard with 4 views (Overview, Comparison, Vehicle Lookup, Data Status) |
| **Charts** | Chart.js 4.4.1 (CDN) | Line, donut, bar, stacked bar, and box plot charts |
| **Excel parsing** | SheetJS 0.18.5 (CDN) | Client-side .xlsx parsing for manual uploads |
| **Data pipeline** | `parse.py` (Python 3, openpyxl) | Server-side Excel parsing for 3 categories, outputs data.json. Tries avaandmed.eesti.ee API first, falls back to URL-guessing |
| **Price pipeline** | `fetch_prices.py` (Python 3) | Fetches pricing data from mobile.de, AutoScout24, auto24.ee. Outputs prices.json with aggregates + listings |
| **Vehicle scraper** | `scrape_vehicle.py` (Python 3) | Server-side mntstat.ee scraper for vehicle lookup by reg number or filters |
| **Vehicle API client** | `fetch_vehicle.py` (Python 3) | ATV API client with mntstat.ee fallback, CLI + HTTP proxy server mode |
| **Vehicle CORS proxy** | `worker/vehicle-proxy.js` (Cloudflare Worker) | Proxies vehicle lookups for client-side access with CORS headers and ATV API auth |
| **VIN decode** | `src/lib/vin-decoder.ts` | Decodes make + model year from VIN using 70+ WMI codes |
| **Storage** | `data.json` + `prices.json` (committed to repo) | Transaction data (~2MB) + pricing data (~500KB) |
| **Client storage** | localStorage (`jarelturDB_v3`) | Cached data for offline use |
| **CI/CD** | GitHub Actions | Monthly cron (20th) for transactions, weekly cron (Monday) for pricing |
| **Hosting** | GitHub Pages | Static file serving |

### Data Flow (current)

```mermaid
sequenceDiagram
    participant TA as Transpordiamet
    participant GHA as GitHub Actions
    participant PP as parse.py
    participant DJ as data.json
    participant SPA as index.html
    participant LS as localStorage

    Note over GHA: 20th of each month
    GHA->>PP: Run parse.py
    PP->>ODP: Try avaandmed.eesti.ee API (if API key set)
    ODP-->>PP: Dataset download (or fail)
    PP->>TA: Fallback: URL-guessing for infoleht .xlsx
    TA-->>PP: .xlsx file
    PP->>PP: Find sheets for järelturg, newCars, imports
    PP->>PP: Parse rows (make, model, variant, prodYear, count)
    PP->>DJ: Merge new month into data.json (all categories)
    GHA->>GHA: Commit & push data.json

    SPA->>DJ: Fetch data.json on load
    SPA->>LS: Cache in localStorage
    SPA->>SPA: Render charts and tables
    Note over SPA: Vehicle Lookup page
    SPA->>SPA: VIN decode (client-side, 70+ WMI codes)
```

### parse.py Details

- **API-first fetching:** `try_opendata_api()` searches avaandmed.eesti.ee for infoleht dataset using `OPENDATA_API_KEY` env var. Falls back to URL-guessing if API unavailable.
- **URL generation:** `candidate_urls()` builds candidate download URLs using multiple naming patterns (`INFOLEHT-MMYYYY.xlsx`, `_statistika_esmased_ja_uued`, URL-encoded variants, etc.)
- **Multi-category parsing:** `find_sheet_by_category(wb, category)` searches sheets using `SHEET_KEYWORDS` dict for járelturg, newCars, and imports keywords
- **Column detection:** Identifies make (mark/märk), model (mudel), production year (aasta), and count (arv/kokku/hulk) columns
- **Model splitting:** `split_model_variant()` splits "GOLF GTI" into model="GOLF", variant="GTI". Special handling for multi-word models like Tesla "MODEL 3", "MODEL S", "MODEL X", "MODEL Y"
- **Deduplication:** Merges new month data with existing data.json, replacing if month already exists
- **Format migration:** `load_data()` auto-migrates old `{months:[]}` format to new `{jarelturg:[], newCars:[], imports:[]}` schema

### scrape_vehicle.py Details

- **Registration lookup:** `search_by_reg(reg)` queries `mntstat.ee/search.php?reg_nr=XXX`
- **Filtered search:** `search_by_filters(make, model, year_from, year_to)` uses `make[]`, `model[]`, `from`, `to` params
- **HTML parsing:** Extracts `<td>` cells from `searchResult` table, groups by 13 columns (Staatus, Kokku, Mark, Mudel, Keretüüp, Aasta, Värv, Mootoritüüp, Käigukast, Kw, CC, Kg, Maakond)
- **CLI usage:** `python scrape_vehicle.py 100BMW --json`
- **Note:** Server-side only (CORS prevents client-side use). Reg tab UI is ready but pending live data access.

### VIN Decode (client-side)

- `WMI_MAP`: 70+ World Manufacturer Identifier codes covering top 20+ Estonian-market makes
- `YEAR_CODES`: Model year decode from VIN position 10
- `decodeVIN(vin)` validates (17 chars, no I/O/Q) and returns `{isValid, vin, wmi, vds, make, modelYear, yearCode, plant, serial}`

---

## 3. Planned Architecture (v2+)

### Expanded Ingestion

Each data source gets its own ingestion script:

| Script | Source | Output | Schedule |
|--------|--------|--------|----------|
| `parse.py` | Transpordiamet .xlsx + avaandmed.eesti.ee API | data.json (transactions, 3 categories) | Monthly (20th) |
| `scrape_vehicle.py` | mntstat.ee | Vehicle specs (stdout/JSON) | On-demand |
| `fetch_mobile.py` | mobile.de API | prices.json | Weekly |
| `fetch_autoscout.py` | AutoScout24 API | prices.json | Weekly |
| `scrape_auto24.py` | auto24.ee | prices.json | Weekly |
| `fetch_vehicle.py` | ATV API | vehicle cache | On-demand |

### API Proxy Layer

Client-side JavaScript cannot call external APIs directly due to CORS. Options:

1. **Cloudflare Workers** (recommended) — Free tier, edge-deployed, handles auth secrets
2. **Vercel Edge Functions** — Alternative serverless option
3. **Server-side only** — All API calls happen in GitHub Actions; results committed as JSON

Decision: Start with option 3 (server-side pipeline via GitHub Actions) to keep architecture simple. Move to option 1 when real-time vehicle lookup is needed (Phase 2).

### Storage Evolution

| Stage | Storage | When | Trigger |
|-------|---------|------|---------|
| Current | `data.json` (~1MB) | Now | Works fine for transaction data |
| Next | Multiple JSON files (data.json + prices.json) | Phase 3 | Pricing data from multiple sources |
| Future | SQLite or cloud DB (Supabase/PlanetScale) | Phase 3-4 | When JSON files exceed ~10MB or query complexity grows |

---

## 4. API Integration Design

### Transpordiamet ATV (abi.ria.ee/teabevarav/)
- **Auth:** Credential-based (organization API key)
- **Data:** Vehicle registry, VIN lookup, registration number lookup
- **Integration:** Server-side Python script → cached JSON responses
- **Rate limits:** Unknown, need to confirm with Transpordiamet
- **Action needed:** Contact Transpordiamet for API credentials

### Estonian Open Data Portal (avaandmed.eesti.ee)
- **Auth:** API key (free registration at avaandmed.eesti.ee), set via `OPENDATA_API_KEY` env var
- **Docs:** avaandmed.eesti.ee/api/v1/
- **Data:** Infoleht datasets, vehicle registration statistics
- **Integration:** Built into `parse.py` via `try_opendata_api()` — API-first with URL-guessing fallback
- **Status:** DONE — integrated in Phase 2
- **Rate limits:** Reasonable public API limits

### mntstat.ee
- **Auth:** None (public web)
- **Data:** 829K+ registered vehicles in Estonia with specs
- **Endpoints:** `search.php?reg_nr=XXX` (reg lookup), `search.php?make[]=BMW&from=2020&to=2025` (filtered), `data.php` POST (model dropdown)
- **Integration:** `scrape_vehicle.py` — server-side HTML scraping
- **Status:** DONE — integrated in Phase 2

### mobile.de
- **Auth:** HTTP Basic (username/password)
- **Docs:** services.mobile.de/docs/search-api.html
- **Data:** Vehicle listings with prices, search/filter
- **Integration:** Python script → prices.json
- **Rate limits:** Per-account, need to confirm
- **Action needed:** Request API account from mobile.de

### AutoScout24
- **Auth:** OAuth
- **Docs:** listing-creation.api.autoscout24.com/docs
- **Data:** Vehicle listings, make/model reference data, pricing
- **Integration:** Python script → prices.json
- **Third-party option:** Carapis (docs.carapis.com) provides parsed data with code examples

### auto24.ee
- **Auth:** No public API
- **Options:** Web scraping (Playwright/Puppeteer) or direct partnership
- **Data:** Estonian vehicle listings with prices
- **Legal consideration:** Scraping may violate ToS — explore partnership first

### autoportaal.ee
- **Auth:** No public API
- **Options:** Same as auto24.ee
- **Data:** Estonian vehicle listings and prices

---

## 5. Frontend Architecture

### Current Structure (single-file SPA)

```
index.html (~2100 lines)
├── <style>       CSS (design tokens, layout, components, combobox, vehicle lookup)
├── <body>        HTML (sidebar with categories + views, topbar, 4 page containers)
└── <script>      JavaScript
    ├── State     (db object with 3 categories, activeCategory, localStorage persistence)
    ├── Categories(switchCategory(), activeMonths(), CATEGORY_LABELS, CATEGORY_DESC)
    ├── Router    (showPage(), nav button handlers, pageTitlesForCategory())
    ├── Parsers   (parseFile(), extractJarelturg(), detectMonthYear())
    ├── Combobox  (createCombobox() factory — reusable searchable dropdown)
    ├── Render    (renderOverview(), renderComparisonPage(), renderComparison())
    ├── Vehicle   (decodeVIN(), showVehicleInfo(), showVehicleMarketData())
    ├── Charts    (Chart.js instances, chartOpts(), destroyChart(), stacked bar for koguTurg)
    ├── Sync      (triggerAutoFetch(), handleFiles())
    └── Utils     (colorFor(), log(), setProgress())
```

### Evolution Path

1. **Phase 0-2 (DONE):** Single `index.html` with 4 views, category navigation, vehicle lookup. Currently ~2100 lines.
2. **Phase 3:** If file exceeds ~3000 lines, split into `styles.css`, `app.js`, and `index.html`.
3. **Phase 4-5:** Evaluate component framework (Svelte or Preact) if UI complexity warrants it. Decision gate: if more than 5 distinct interactive views are needed.

---

## 6. Architecture Decision Records

### ADR-001: Vanilla JS over framework
**Decision:** No framework. Single index.html with inline CSS and JS.
**Rationale:** Zero build step, instant deployment to GitHub Pages, no node_modules, easy to understand for any developer. The current feature set (3 pages, ~10 charts) doesn't justify framework overhead.
**Revisit when:** More than 5 interactive views, or significant state management complexity.

### ADR-002: data.json over database
**Decision:** Store all data as a JSON file committed to the repository.
**Rationale:** GitHub Pages is static-only. JSON file is versioned in git, accessible via fetch(), and works offline via localStorage. Current data size (~1MB for 26 months) is well within limits.
**Revisit when:** Total data files exceed 10MB, or real-time queries are needed.

### ADR-003: Server-side pipeline over client-side parsing
**Decision:** Use parse.py (server-side) as primary data ingestion, keep SheetJS for manual uploads.
**Rationale:** Server-side parsing is more reliable, handles .xls format via xlrd, and allows automated monthly updates via GitHub Actions.
**Revisit when:** Never — this is the right long-term pattern.

### ADR-004: When to introduce a backend
**Decision:** Defer until Phase 3 (pricing intelligence).
**Rationale:** Phase 2 vehicle lookup is handled via client-side VIN decode and server-side mntstat.ee scraper (CLI tool). Real-time API calls for pricing data in Phase 3 will need a server or serverless proxy.
**Target:** Cloudflare Workers for lightweight API proxy.
**Updated:** Phase 2 completed without needing a backend — mntstat.ee scraper runs server-side only, reg tab UI is ready but pending live data integration.

### ADR-005: API-first data fetching with fallback
**Decision:** parse.py tries avaandmed.eesti.ee Open Data API first, falls back to URL-guessing for Transpordiamet files.
**Rationale:** API is more reliable and forward-looking than URL-guessing (which depends on undocumented naming conventions). Fallback ensures continuity if API is down or API key not configured.
**Date:** 2026-03-25

### ADR-006: Authentication — Supabase Auth (free tier, EU region)
**Decision:** Use Supabase Auth for user accounts and session management.
**Rationale:** GitHub Pages is static-only — no backend. Supabase provides email/password + Google OAuth with a JavaScript client that works directly from the browser. Free tier supports 50K MAU. EU data residency (Frankfurt) satisfies GDPR. Postgres database enables future entitlement queries server-side.
**Alternatives rejected:** Firebase Auth (US-only free tier, weaker GDPR story), Clerk ($25/mo after 10K MAU — overkill), Auth0 (7,500 MAU free tier limit).
**Consequences:** Introduces Supabase dependency. JWT tokens verified client-side. Supabase project must use `eu-central-1` region. Gain Postgres DB for subscriptions and report purchases tables.
**Date:** 2026-03-27

### ADR-007: Paywall — client-side gating + serverless data derivation
**Decision:** Two-layer paywall: (1) React route/component guards check auth tier before rendering; (2) premium computed data is served by Supabase Edge Functions, never embedded in public static files.
**Rationale:** True server-side gating of static files is impossible on GitHub Pages. The free tier (data.json make-level counts) stays fully public. Premium value is in *computed insights* — model-level price trends, depreciation curves, report data — which are calculated on the edge and require a valid JWT.
**Consequences:** data.json remains public and unmodified. prices.json splits into a public `prices-summary.json` (make-level ranges) and a gated edge function endpoint for model-level pricing. Client-side gating can be bypassed by determined users, but the underlying premium data never ships in a public file.
**Date:** 2026-03-27

### ADR-008: Payments — Lemon Squeezy (Merchant of Record)
**Decision:** Use Lemon Squeezy for subscription billing and one-time report purchases.
**Rationale:** No backend required (checkout is an overlay; webhooks go to a Supabase Edge Function). Lemon Squeezy is a Merchant of Record — they handle EU VAT collection, invoicing, and OSS compliance across all EU member states, which is critical for an Estonian seller. EUR pricing native. Supports both recurring subscriptions and one-time products. 5% + $0.50 fee per transaction.
**Alternatives rejected:** Stripe (requires handling EU VAT yourself or paying Stripe Tax fees; needs backend for webhooks), Paddle (minimum $10/mo plan; better for higher-volume SaaS).
**Consequences:** Webhook endpoint needed (Supabase Edge Function `payment-webhook`). Entitlements managed via `subscriptions` and `report_purchases` tables in Supabase.
**Date:** 2026-03-27

### ADR-009: Report format — interactive web + client-side PDF export
**Decision:** Pay-per-report delivers an interactive React page with a "Download PDF" button using `@react-pdf/renderer`.
**Rationale:** Building a server-side PDF pipeline adds significant infrastructure. An interactive report is more valuable (live charts, hover tooltips). Client-side PDF generation avoids needing a headless browser. `@react-pdf/renderer` produces cleaner typeset output than `html2canvas` + `jsPDF`.
**Consequences:** Chart components must be reimplemented as `@react-pdf/renderer` primitives for PDF output, or PDF uses a separate simplified layout. PDF quality is "good enough for market reports" — not typeset-perfect.
**Date:** 2026-03-27
