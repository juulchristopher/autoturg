# Autoturg — Project Overview

> Comprehensive used car market intelligence for Estonia

**Live:** https://juulchristopher.github.io/autoturg
**Repo:** github.com/juulchristopher/autoturg
**Last updated:** 2026-03-26

---

## Mission

Autoturg helps Estonian used car buyers make informed purchase decisions by consolidating market data from government registries and car marketplaces into a single interactive dashboard.

## Problem Statement

Buying a used car in Estonia means navigating fragmented data across multiple sources. Autoturg answers the questions every buyer has:

1. **Is this car popular?** Popular models are easier to find good deals on and easier to resell later.
2. **What configurations exist?** Understanding engine/trim variants and their market activity helps narrow the search.
3. **Which production years are most active?** Knowing which generations are heavily traded signals availability and demand.
4. **Will it lose value fast?** Depreciation curves help buyers avoid models that lose value disproportionately.
5. **What's a fair price?** Historical price data and current listings reveal whether a deal is good, average, or overpriced.
6. **What about my specific car?** VIN or registration number lookup gives context for an exact vehicle.

## Market Categories

Autoturg covers the full spectrum of the Estonian car market:

| Category | Description | Data Source |
|----------|-------------|-------------|
| **New cars** | First-time registrations of new vehicles | Transpordiamet infoleht |
| **Imports** | Used vehicles imported and registered in Estonia | Transpordiamet infoleht |
| **Aftermarket (järelturg)** | Owner-change transactions of locally registered vehicles | Transpordiamet infoleht |

Pricing data is supplemented from marketplace platforms: mobile.de, AutoScout24, auto24.ee, and autoportaal.ee.

## Current Capabilities (v2)

What's built and live today:

- **Monthly Overview Dashboard** — Top 5 makes trend line, market share donut, total transaction bar chart, sortable make table
- **Model Comparison** — Compare up to 5 make/model/configuration combinations with searchable 3-field combobox (Maker → Model → Configuration)
- **3 Market Categories** — Järelturg (aftermarket), Uued sõidukid (new cars), and Kogu turg (combined cross-category view with stacked bar charts)
- **Vehicle Lookup** — VIN decode (client-side, 70+ WMI codes), registration number tab (UI ready, pending live data), and make/model selector
- **mntstat.ee Integration** — Server-side vehicle scraper for 829K+ Estonian vehicles by registration number or filters
- **OpenData API Integration** — `parse.py` tries avaandmed.eesti.ee API first, falls back to URL-guessing
- **Sync & Upload** — Manual .xlsx upload and auto-fetch from Transpordiamet on the 20th of each month
- **26 months × 2 categories** — January 2024 through February 2026 (järelturg + new cars)
- **Pricing Intelligence** — Market pricing section with median/P25/P75 box plot, "check a price" fair-deal indicator, per-source comparison, price-by-year depreciation chart (sample data, pending live API access)
- **Zero dependencies** — Single `index.html` file (~3100 lines), CDN-hosted Chart.js and SheetJS, GitHub Pages hosting

## Vision (v3+)

The platform will expand to include:

- Pricing intelligence from Estonian and European car marketplaces (mobile.de, AutoScout24, auto24.ee)
- Depreciation analysis with age-based value curves
- Per-vehicle market context report combining transaction history, pricing, and depreciation
- Import data from alternative source (infoleht has no import sheet)
- Live registration number lookup via ATV API (pending formal application)

## Target Users

| User | Use Case |
|------|----------|
| **Car buyer** | Evaluate a specific model before purchase — popularity, fair price, depreciation outlook |
| **Dealer** | Analyze market trends for inventory and pricing decisions |
| **Enthusiast** | Track specific models and market shifts over time |

## Technology

Single-page application with no build step. See [Architecture](architecture.md) for full details.

- **Frontend:** Vanilla JS + CSS (~2100 lines in single index.html), Chart.js for visualizations
- **Data pipeline:** Python (`parse.py`) for server-side Excel parsing with OpenData API integration
- **Vehicle scraper:** Python (`scrape_vehicle.py`) for mntstat.ee lookups
- **VIN decode:** Client-side JS with 70+ WMI codes
- **Storage:** JSON file (`data.json`) committed to repo, localStorage for client persistence
- **Hosting:** GitHub Pages with GitHub Actions for monthly data updates

## Documentation Index

| Document | Description |
|----------|-------------|
| [Requirements & Product Definition](rpd.md) | User stories, functional requirements, acceptance criteria |
| [Architecture](architecture.md) | System components, data flow, API integrations, ADRs |
| [Data Schema](data-schema.md) | Data models, storage format, normalization rules |
| [Build Plan](buildplan.md) | Phased roadmap with Gantt chart |
