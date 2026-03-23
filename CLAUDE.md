# Autoturg — Builder Instructions

## Project

Estonian used car market intelligence platform. Live at https://juulchristopher.github.io/autoturg

## Architecture

Single-file SPA (`index.html`, ~1590 lines) with inline CSS + JS. No build step.
- **Charts:** Chart.js 4.4.1 (CDN)
- **Excel parsing:** SheetJS 0.18.5 (CDN, client-side)
- **Storage:** localStorage (`jarelturDB_v3`), data loaded from JSON
- **Hosting:** GitHub Pages

Read `docs/architecture.md` for full system design.

## Key Conventions

- All code lives in `index.html` (inline `<style>` and `<script>` blocks)
- CSS uses design tokens via CSS custom properties (`:root` vars)
- JavaScript is vanilla — no modules, no build step, no framework
- Make names are always UPPERCASE
- Model splitting: first word = model, rest = variant. Exception: Tesla multi-word models (MODEL 3, MODEL S, etc.)
- Skip summary rows: KOKKU, TOTAL, ZUSAMMEN, SUM

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
