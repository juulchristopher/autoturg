# Build Plan

> Phased delivery roadmap with milestones and dependencies.

**Last updated:** 2026-03-25

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

    section Phase 2: API Integration & Data Pipeline
    andmed.eesti.ee API integration     :p2a, 2026-03-26, 7d
    Statistikaamet API (TS322)          :p2b, after p2a, 5d
    Replace URL-guessing with API fetch :p2c, after p2a, 3d
    VIN decode logic (client-side)      :p2d, after p2a, 5d
    mntstat.ee vehicle scraper          :p2e, after p2d, 7d
    Vehicle detail panel UI             :p2f, after p2d, 7d
    Input UI: VIN / reg / selector      :p2g, after p2f, 5d
    Apply for AVP access                :crit, p2h, 2026-03-26, 21d
    Milestone: API + lookup live        :milestone, p2m, after p2g, 0d

    section Phase 3: Pricing Intelligence
    mobile.de API integration           :p3a, after p2m, 14d
    AutoScout24 API integration         :p3b, after p3a, 10d
    auto24.ee data collection           :crit, p3c, after p2m, 21d
    Price normalization pipeline        :p3d, after p3b, 7d
    Price range visualizations          :p3e, after p3d, 7d
    Milestone: pricing live             :milestone, p3m, after p3e, 0d

    section Phase 4: Depreciation Analysis
    Depreciation curve computation      :p4a, after p3m, 7d
    Depreciation charts UI              :p4b, after p4a, 7d
    Value retention indicator           :p4c, after p4b, 5d
    Cross-model depreciation comparison :p4d, after p4c, 5d
    Milestone: depreciation live        :milestone, p4m, after p4d, 0d

    section Phase 5: Polish & Scale
    Performance optimization            :p5a, after p4m, 14d
    Mobile responsive improvements      :p5b, after p5a, 7d
    Architecture reassessment           :milestone, p5m, after p5b, 0d
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

## Phase 2: API Integration & Data Pipeline

**Objective:** Replace URL-guessing with proper API access, add vehicle lookup via VIN/registration number.

**Prerequisites:** Phase 1 complete.

**Tasks:**
1. Integrate andmed.eesti.ee OpenData API for programmatic infoleht access
2. Integrate Statistikaamet API (andmed.stat.ee) for TS322 first-registration data
3. Replace URL candidate guessing in parse.py with API-driven data fetching
4. Build client-side VIN decode (WMI → make, VDS → model/year)
5. Build mntstat.ee scraper for vehicle details by registration number
6. Create vehicle detail panel in UI showing specs + market context
7. Build input UI: make/model selector, VIN field, registration number field
8. Apply for AVP access from Transpordiamet (critical path, long lead time)

**Deliverables:**
- [ ] parse.py fetches infoleht data via andmed.eesti.ee API instead of URL guessing
- [ ] Statistikaamet TS322 data integrated for first-registration statistics
- [ ] VIN input decodes make, model, year client-side
- [ ] mntstat.ee scraper returns vehicle specs by registration number
- [ ] Vehicle detail panel shows specs + transaction history + market position
- [ ] Input method switcher (dropdown, VIN, reg number)

**Risks:**
- andmed.eesti.ee API may require registration for API key
- mntstat.ee scraping may break if site layout changes — need resilient selectors
- AVP application takes weeks — scraping is the interim fallback
- Rate limits on mntstat.ee unknown

**Definition of Done:** Data pipeline uses APIs instead of URL guessing. User can enter a VIN or registration number and see vehicle details plus market context.

**References:** FR-006, FR-010, FR-011, FR-015, FR-016, US-13, US-14, US-15

---

## Phase 3: Pricing Intelligence

**Objective:** Show current asking prices and price distributions from Estonian and European marketplaces.

**Prerequisites:** Phase 2 complete. API accounts for mobile.de and AutoScout24 obtained.

**Tasks:**
1. Integrate mobile.de Search API (HTTP Basic auth)
2. Integrate AutoScout24 Listing API (OAuth)
3. Build auto24.ee data collection (scraping or partnership — explore both)
4. Build price normalization pipeline (currency, make/model matching across sources)
5. Create price range visualizations (box plots or violin plots)
6. Show current asking prices in vehicle detail panel

**Deliverables:**
- [ ] Pricing data from 2+ sources ingested and stored in prices.json
- [ ] Price normalization across sources (EUR, canonical make/model names)
- [ ] Price range visualization for any make/model/year
- [ ] Current listings shown alongside market statistics
- [ ] Weekly pricing updates via GitHub Actions

**Risks:**
- mobile.de API account approval timeline unknown
- auto24.ee has no API — scraping may violate ToS, partnership may take time
- Price data volume could grow quickly — monitor storage size

**Definition of Done:** User can see price ranges for a model, compare asking prices across platforms, and understand where a specific price falls relative to the market.

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

## Phase 5: Polish & Scale

**Objective:** Optimize performance, improve mobile experience, and reassess architecture for continued growth.

**Prerequisites:** Phases 1-4 complete.

**Tasks:**
1. Performance audit: lazy loading, code splitting (if multi-file), pagination for large datasets
2. Mobile responsive improvements: collapsible sidebar, touch-friendly charts, responsive grids
3. Architecture reassessment: evaluate whether to introduce a component framework, backend, or database

**Deliverables:**
- [ ] Page load under 2s on broadband for all views
- [ ] Usable mobile experience for all core features
- [ ] Architecture decision documented: continue as-is or evolve stack

**Definition of Done:** Lighthouse performance score > 80. Core flows work on mobile. Architecture decision made and documented in ADR.

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
