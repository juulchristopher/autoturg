# Build Plan

> Phased delivery roadmap with milestones and dependencies.

**Last updated:** 2026-03-24

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

    section Phase 1: Expand Data Sources
    Parse new-car registration sheet    :p1a, 2026-04-01, 7d
    Parse import registration sheet     :p1b, after p1a, 7d
    Update data.json schema             :p1c, after p1a, 3d
    UI: category tabs & navigation      :p1d, after p1c, 7d
    Combined cross-category overview    :p1e, after p1d, 3d
    Milestone: 3 categories live        :milestone, p1m, after p1e, 0d

    section Phase 2: Vehicle Lookup
    Open Data Portal API integration    :p2a, after p1m, 10d
    Contact Transpordiamet for ATV creds:crit, p2b, after p1m, 14d
    VIN decode logic                    :p2c, after p2a, 5d
    Registration number lookup          :p2d, after p2b, 7d
    Vehicle detail panel UI             :p2e, after p2c, 7d
    Input UI: VIN / reg / selector      :p2f, after p2e, 5d
    Milestone: vehicle lookup live      :milestone, p2m, after p2f, 0d

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

## Phase 1: Expand Data Sources

**Objective:** Cover all 3 market categories — new cars, imports, and järelturg.

**Prerequisites:** Phase 0 complete.

**Tasks:**
1. Extend `parse.py` to extract new-car registration sheets from infoleht files
2. Extend `parse.py` to extract import registration sheets
3. Update `data.json` schema from flat `months[]` to `{ jarelturg[], newCars[], imports[] }`
4. Add category tabs/navigation to the frontend
5. Build combined overview dashboard showing all 3 categories

**Deliverables:**
- [ ] parse.py handles 3 sheet types from infoleht files
- [ ] data.json contains all 3 categories
- [ ] UI shows separate views per category + combined overview
- [ ] GitHub Actions pipeline updated to process all sheets

**Risks:**
- Infoleht sheet naming may vary across months — need robust sheet detection
- Data volume triples — monitor data.json file size

**Definition of Done:** All 3 categories display correct data for all 26+ historical months. Combined overview shows cross-category comparisons.

**References:** FR-004, FR-005, US-16, US-17, US-18

---

## Phase 2: Vehicle Lookup

**Objective:** Enable users to look up a specific vehicle by VIN or registration number and see market context.

**Prerequisites:** Phase 1 complete. ATV API credentials obtained (critical path).

**Tasks:**
1. Integrate Estonian Open Data Portal API (free, no auth needed)
2. Apply for and obtain ATV API credentials from Transpordiamet
3. Build VIN decode logic (extract make, model, year from VIN)
4. Build registration number lookup via ATV API
5. Create vehicle detail panel in UI showing specs + market context
6. Build input UI: make/model selector, VIN field, registration number field

**Deliverables:**
- [ ] VIN input decodes and returns vehicle details
- [ ] Registration number input returns vehicle details
- [ ] Vehicle detail panel shows specs + transaction history + market position
- [ ] Input method switcher (dropdown, VIN, reg number)

**Risks:**
- ATV API credential application may take weeks — start early
- API may have rate limits that constrain lookup frequency
- Fallback: use Open Data Portal if ATV API unavailable

**Definition of Done:** User can enter a VIN or registration number and see vehicle details plus market context (transaction volume for that make/model, pricing if available).

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
