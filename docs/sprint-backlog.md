# Sprint 1: Expand Data Sources

> **Goal:** Extend Autoturg from järelturg-only to all 3 market categories (new cars, imports, aftermarket).
> **Sprint dates:** 2026-03-24 — 2026-04-07
> **References:** Phase 1 in `buildplan.md`, FR-004, FR-005

---

## Tasks

### Task 1.1: Extend Excel parsing to detect new-car and import sheets
**Status:** DONE
**Priority:** P0
**Files:** `parse.py`

**Changes made:**
- Refactored `find_jarelturg_sheet()` into generic `find_sheet_by_category(wb, category)` with keyword sets per category
- Added `SHEET_KEYWORDS` dict for `jarelturg`, `newCars`, and `imports` categories
- Extracted `open_workbook()` helper for xls/xlsx handling
- `fetch_month()` now parses all 3 categories from the same workbook
- Note: Import sheets not found in Transpordiamet infoleht files — imports category stays empty pending alternative data source

---

### Task 1.2: Update data schema to support 3 categories
**Status:** DONE
**Priority:** P0
**Files:** `parse.py`, `index.html`, `data.json`

**Changes made:**
- data.json structure changed from `{ months: [] }` to `{ jarelturg: [], newCars: [], imports: [] }`
- `load_data()` auto-migrates old `{ months: [] }` format to new multi-category format
- `save_data()` sorts all 3 category arrays
- Frontend `fetchData()` handles both old and new formats with migration
- `activeMonths()` function replaces direct `db.months` references, reads from `db[activeCategory]`
- `filteredMonths()` now uses `activeMonths()` as base
- All 26 months re-fetched and data.json updated with 26 jarelturg + 26 newCars months

---

### Task 1.3: Add category navigation to the UI
**Status:** DONE
**Priority:** P1
**Files:** `index.html`

**Changes made:**
- Added Category section to sidebar with 4 buttons: Järelturg, Uued sõidukid, Import, Kogu turg
- `switchCategory(cat)` function updates `activeCategory`, resets timeline and comparison slots, re-renders
- Page titles and descriptions dynamically update per category via `pageTitlesForCategory()`
- `CATEGORY_LABELS` and `CATEGORY_DESC` constants for display labels
- Sidebar status shows active category name and month count
- Sync page shows data for active category

---

### Task 1.4: Combined cross-category overview
**Status:** DONE
**Priority:** P2
**Files:** `index.html`

**Changes made:**
- "Kogu turg" category merges all 3 categories by month, concatenating rows
- `activeMonths()` in koguTurg mode creates merged month objects with `_categories` metadata
- Overview total chart renders as stacked bar chart in koguTurg mode (järelturg=gold, newCars=blue, imports=green)
- Stats and tables work with combined data

---

### Task 1.5: Update documentation
**Status:** DONE
**Priority:** P1
**Files:** `docs/sprint-backlog.md`

**Changes made:**
- Sprint backlog updated with all task statuses set to DONE
- Documented actual implementation details for each task

---

## Notes

- Import data: Transpordiamet infoleht xlsx files don't contain a dedicated import sheet. The 3 sheet categories found are: `Sõidu-uus` (new cars), `Järelturg` (used), and various statistical breakdown sheets. Import data will need a different source.
- New cars data comes from the `Sõidu-uus` sheet, detected by the `newCars` keyword set matching "uus"/"uued" in sheet names.
