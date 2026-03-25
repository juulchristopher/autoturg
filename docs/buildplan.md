# Build Plan

> Phased delivery roadmap with milestones and dependencies.

**Last updated:** 2026-03-26

---

## Gantt Chart

```mermaid
gantt
    title Autoturg Build Plan
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Phase 0: Foundation ✓
    Järelturg dashboard                 :done, p0a, 2024-01-01, 2026-03-23
    parse.py data pipeline              :done, p0b, 2026-03-01, 2026-03-15
    GitHub Actions monthly cron         :done, p0c, 2026-03-15, 2026-03-20
    Model comparison (5 slots)          :done, p0d, 2026-03-20, 2026-03-23

    section Phase 1: Expand Data Sources ✓
    Parse new-car registration sheet    :done, p1a, 2026-03-24, 1d
    Multi-category data.json schema     :done, p1c, 2026-03-24, 1d
    UI: category tabs & navigation      :done, p1d, 2026-03-24, 1d
    Combined cross-category overview    :done, p1e, 2026-03-24, 1d

    section Phase 2: API Integration & Data Pipeline ✓
    andmed.eesti.ee API integration     :done, p2a, 2026-03-25, 1d
    VIN decode logic (client-side)      :done, p2d, 2026-03-25, 1d
    mntstat.ee vehicle scraper          :done, p2e, 2026-03-25, 1d
    Vehicle detail panel UI             :done, p2f, 2026-03-25, 1d
    Input UI: VIN / reg / selector      :done, p2g, 2026-03-25, 1d
    Apply for AVP access                :crit, p2h, 2026-03-26, 21d
    Milestone: API + lookup live        :milestone, p2m, 2026-03-26, 0d

    section Phase 3: Pricing Intelligence ✓ (scaffold)
    fetch_prices.py + sample data       :done, p3a, 2026-03-26, 1d
    Price normalization pipeline        :done, p3d, 2026-03-26, 1d
    Price range visualizations          :done, p3e, 2026-03-26, 1d
    Weekly pricing GitHub Actions       :done, p3f, 2026-03-26, 1d
    mobile.de API credentials           :crit, p3g, 2026-03-27, 21d
    AutoScout24 API credentials         :crit, p3h, 2026-03-27, 21d
    auto24.ee data strategy             :crit, p3i, 2026-03-27, 21d
    Milestone: pricing live (sample)    :milestone, p3m, 2026-03-26, 0d

    section Phase 4: Depreciation Analysis
    Depreciation curve computation      :p4a, after p3m, 7d
    Depreciation charts UI              :p4b, after p4a, 7d
    Value retention indicator           :p4c, after p4b, 5d
    Cross-model depreciation comparison :p4d, after p4c, 5d
    Milestone: depreciation live        :milestone, p4m, after p4d, 0d

    section Phase 5: Polish & Scale ✓
    Mobile responsive + hamburger menu  :done, p5a, 2026-03-26, 1d
    Performance (lazy load, defer)      :done, p5b, 2026-03-26, 1d
    Milestone: polish complete          :milestone, p5m, 2026-03-26, 0d
```

---

## Phase 0: Foundation (DONE)

**Objective:** Build a working dashboard for Estonian järelturg transaction data.

**Deliverables:**
- [x] Monthly overview with top 5 makes, market share donut, totals bar chart, sortable table
- [x] Model comparison with up to 5 make/model/variant slots
- [x] Production year distribution charts
- [x] Manual .xlsx upload + auto-fetch from Transpordiamet
- [x] parse.py server-side pipeline with GitHub Actions cron
- [x] 26 months of historical data (Jan 2024 – Feb 2026)

**References:** FR-001, FR-002, FR-003, FR-014

---

## Phase 1: Expand Data Sources (DONE)

**Objective:** Cover all 3 market categories — new cars, imports, and järelturg.

**Completed:** 2026-03-24 (Sprint 1)

**Deliverables:**
- [x] parse.py refactored with `find_sheet_by_category()` and `SHEET_KEYWORDS` dict
- [x] data.json schema changed to `{ jarelturg[], newCars[], imports[] }`
- [x] 26 months järelturg + 26 months newCars data populated
- [x] UI: sidebar category buttons (Järelturg, Uued sõidukid, Import, Kogu turg)
- [x] Combined "Kogu turg" view with stacked bar chart
- [x] GitHub Actions pipeline updated for all categories

**Notes:**
- Import sheets not found in infoleht files — imports array stays empty. Import data needs alternative source.
- New cars parsed from "Sõidu-uus" sheet via keyword matching on "uus"/"uued"
- Auto-migration from old `{ months[] }` format to new schema in both Python and JS

**References:** FR-004 (DONE), FR-005 (Blocked), US-16, US-17, US-18

---

## Phase 2: API Integration & Data Pipeline (DONE)

**Objective:** Replace URL-guessing with proper API access, add vehicle lookup via VIN/registration number.

**Completed:** 2026-03-25 (Sprint 2)

**Deliverables:**
- [x] parse.py tries avaandmed.eesti.ee API first, falls back to URL-guessing
- [ ] Statistikaamet TS322 data integrated (deferred — current pipeline sufficient)
- [x] VIN input decodes make, model year client-side (70+ WMI codes)
- [x] mntstat.ee scraper returns vehicle specs by registration number
- [x] Vehicle detail panel shows specs + transaction history + market position
- [x] Input method switcher (VIN tab, Reg tab, Make/Model selector)

**Notes:**
- OpenData API requires API key (free registration at avaandmed.eesti.ee), configured via `OPENDATA_API_KEY` env var
- mntstat.ee form uses `make[]`, `model[]`, `from`, `to` params (not `automarg`/`aasta_min`)
- mntstat.ee table columns: Staatus, Kokku, Mark, Mudel, Keretüüp, Aasta, Värv, Mootoritüüp, Käigukast, Kw, CC, Kg, Maakond
- Reg number tab UI is ready but pending live data access (mntstat scraper is server-side only)
- AVP formal application still pending (critical path for Phase 3+)

**References:** FR-006 (DONE), FR-010 (DONE), FR-011 (DONE), FR-015 (DONE), FR-016 (DONE)

---

## Phase 3: Pricing Intelligence (DONE — scaffolding with sample data)

**Objective:** Show current asking prices and price distributions from Estonian and European marketplaces.

**Completed:** 2026-03-26 (Sprint 3 — infrastructure + sample data)

**Tasks:**
1. [x] Build `fetch_prices.py` pipeline with source adapters (mobile.de, AutoScout24, auto24.ee)
2. [x] Build price normalization pipeline (currency, make/model matching across sources)
3. [x] Create price range visualizations (box plot, price cards, source comparison)
4. [x] Show current asking prices in vehicle detail panel with "check a price" feature
5. [x] Create `prices.json` with 252 aggregates and 1170 sample listings
6. [x] Weekly pricing GitHub Actions workflow (`.github/workflows/update-prices.yml`)
7. [ ] Obtain mobile.de API account (pending application)
8. [ ] Obtain AutoScout24 API credentials (pending application)
9. [ ] auto24.ee data collection strategy (scraping or partnership — pending)

**Deliverables:**
- [x] Pricing data from 3 sources ingested and stored in prices.json (sample data)
- [x] Price normalization across sources (EUR, canonical make/model names)
- [x] Price range visualization for any make/model/year (box plot + cards)
- [x] "Check a price" feature — enter asking price, get good/fair/above-market assessment
- [x] Price by source comparison (mobile.de, autoscout24, auto24.ee)
- [x] Price by production year chart with depreciation curve
- [x] Weekly pricing updates via GitHub Actions (ready to activate)

**Notes:**
- All pricing UI is live with sample data (labeled "SAMPLE DATA" badge)
- `fetch_prices.py --sample` generates realistic pricing data for 28 models × 9 years
- Live API sources gracefully degrade when credentials not configured (return empty)
- prices.json is ~500KB with sample data
- index.html grew to ~3094 lines — approaching split threshold

**References:** FR-007, FR-008, FR-009, FR-013, US-10, US-11, US-12

---

## Phase 4: Depreciation Analysis

**Objective:** Show how vehicles lose value over time and help buyers understand long-term cost of ownership.

**Prerequisites:** Phase 3 complete (requires pricing data across production years).

**Tasks:**
1. Compute depreciation curves from historical pricing data (median price by vehicle age)
2. Build depreciation chart UI (age vs. price with confidence bands)
3. Create "value retention indicator" — simple score showing how well a model holds value
4. Enable cross-model depreciation comparison (overlay multiple models)

**Deliverables:**
- [ ] Depreciation curves for models with sufficient pricing data
- [ ] Interactive depreciation chart with age-based view
- [ ] Value retention score/indicator per model
- [ ] Side-by-side depreciation comparison for competing models

**Risks:**
- Requires sufficient pricing data across production years — some models may have sparse data
- Depreciation varies by variant/configuration — decide granularity level

**Definition of Done:** User can view depreciation curve for any model with 10+ data points, compare depreciation between models, and see a clear value retention indicator.

**References:** FR-012, US-08, US-09

---

## Phase 5: Polish & Scale (DONE)

**Objective:** Optimize performance, improve mobile experience, and reassess architecture for continued growth.

**Completed:** 2026-03-26 (Sprint 3)

**Tasks:**
1. [x] Mobile responsive: hamburger menu, collapsible sidebar with overlay, responsive grids
2. [x] Touch-friendly: larger tap targets, responsive combobox inputs, compact timeline presets
3. [x] Performance: lazy-load prices.json (only on Vehicle Lookup visit), defer Chart.js, preconnect fonts
4. [x] SEO: meta description, theme-color meta tag
5. [x] 3 responsive breakpoints: 1100px (narrow desktop), 768px (tablet/mobile), 480px (small mobile)

**Deliverables:**
- [x] Usable mobile experience for all core features
- [x] Hamburger menu with slide-in sidebar and dark overlay
- [x] Single-column layouts on mobile for stats, pricing, comparison grids
- [x] Lazy loading for prices.json (500KB only loaded when needed)
- [x] Deferred Chart.js loading

**Notes:**
- index.html is now ~3180 lines — past the 3000-line split threshold but still manageable as single file
- Architecture decision: continue as single-file SPA. Complexity doesn't warrant framework yet (4 views, no complex state). Will reassess if more views added.

**References:** NFR-01, NFR-06

---

## Dependency Map

```
Phase 0 (DONE)
    └── Phase 1: Expand Data Sources
            └── Phase 2: Vehicle Lookup
                    ├── Phase 3: Pricing Intelligence
                    │       └── Phase 4: Depreciation Analysis
                    │               └── Phase 5: Polish & Scale
                    └── [ATV API credentials — critical path]
```

## Critical Path Items

1. **ATV API credentials** — Contact Transpordiamet as soon as Phase 1 starts. This gates Phase 2.
2. **mobile.de API account** — Apply during Phase 2. This gates Phase 3.
3. **auto24.ee data access** — Explore partnership during Phase 2. Scraping is fallback. This partially gates Phase 3.
