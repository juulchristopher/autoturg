# Autoturg — Builder Instructions

## Project

Estonian used car market intelligence platform. Live at https://juulchristopher.github.io/autoturg

## Architecture

Single-file SPA (`index.html`, ~2100 lines) with inline CSS + JS. No build step.
- **Charts:** Chart.js 4.4.1 (CDN)
- **Excel parsing:** SheetJS 0.18.5 (CDN, client-side)
- **Data pipeline:** `parse.py` (Python, openpyxl) — tries avaandmed.eesti.ee API first, falls back to URL-guessing
- **Vehicle scraper:** `scrape_vehicle.py` (Python) — mntstat.ee lookup by reg number or filters (server-side only)
- **VIN decode:** Client-side JS in index.html, 70+ WMI codes
- **Storage:** localStorage (`jarelturDB_v3`), data loaded from `data.json` (3 categories: jarelturg, newCars, imports)
- **Hosting:** GitHub Pages

Read `docs/architecture.md` for full system design.

## Key Conventions

- All frontend code lives in `index.html` (inline `<style>` and `<script>` blocks)
- Server-side scripts: `parse.py` (data pipeline), `scrape_vehicle.py` (vehicle lookup)
- CSS uses design tokens via CSS custom properties (`:root` vars)
- JavaScript is vanilla — no modules, no build step, no framework
- Make names are always UPPERCASE
- Model splitting: first word = model, rest = variant. Exception: Tesla multi-word models (MODEL 3, MODEL S, etc.)
- Skip summary rows: KOKKU, TOTAL, ZUSAMMEN, SUM
- Multi-category data: `{jarelturg:[], newCars:[], imports:[]}` — all share same MonthEntry schema
- Searchable combobox UI: `createCombobox()` factory function used in both Comparison and Vehicle Lookup pages

## Documentation

Living docs in `docs/` — **update these when you make changes:**
- `docs/overview.md` — Project overview
- `docs/rpd.md` — Requirements & product definition (FR statuses, user stories)
- `docs/architecture.md` — System architecture and ADRs
- `docs/data-schema.md` — Data models and storage
- `docs/buildplan.md` — Phased roadmap with Gantt chart

## Current Sprint

See `docs/sprint-backlog.md` for active tasks. Pick the next unstarted task, implement it, update the sprint backlog status, and commit.

## Commit Style

Short imperative messages. Examples from history:
- "Add files via upload"
- "Add searchable 3-field comparison filter"
- "Complete data coverage: all 26 months from Jan 2024 to Feb 2026"

## Data Sources

- Transpordiamet monthly infoleht .xlsx files (sheets: Järelturg, Esmased/Uued, Import)
- Download pattern: `https://www.transpordiamet.ee/sites/default/files/documents/YYYY-MM/INFOLEHT-MMYYYY.xlsx`
- avaandmed.eesti.ee Open Data API (API key via `OPENDATA_API_KEY` env var)
- mntstat.ee public vehicle database (829K+ vehicles, scraped server-side)
