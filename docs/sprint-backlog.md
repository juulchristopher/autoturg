# Sprint 1: Expand Data Sources

> **Goal:** Extend Autoturg from järelturg-only to all 3 market categories (new cars, imports, aftermarket).
> **Sprint dates:** 2026-03-24 — 2026-04-07
> **References:** Phase 1 in `buildplan.md`, FR-004, FR-005

---

## Tasks

### Task 1.1: Extend Excel parsing to detect new-car and import sheets
**Status:** NOT STARTED
**Priority:** P0 — blocks all other tasks
**Files:** `index.html` (functions: `extractJarelturg`, `tryParseJarelturgSheet`)

**What to do:**
1. Rename `extractJarelturg()` to a more general `extractSheet()` that accepts a sheet category parameter
2. Add sheet detection for **new-car registrations** — look for sheets containing: "esmane", "esmased", "uued", "uus", "new", "first registration"
3. Add sheet detection for **imports** — look for sheets containing: "import", "sisseveo", "sissetoo"
4. The parsing logic (`tryParseJarelturgSheet`) should work for all 3 categories since the column structure (mark, mudel, aasta, arv) is the same across sheets
5. Verify by testing with real infoleht files that all 3 sheets are found correctly

**Acceptance criteria:**
- Given an infoleht .xlsx with 3 sheets, the parser extracts rows from each category separately
- Each category returns its own array of `{ make, model, variant, fullModel, prodYear, count }` rows

---

### Task 1.2: Update data schema to support 3 categories
**Status:** NOT STARTED
**Priority:** P0 — blocks UI tasks
**Files:** `index.html` (functions: `loadDB`, `saveDB`, `handleFiles`, `parseFile`)

**What to do:**
1. Change the `db` object structure from `{ months: [] }` to:
   ```js
   {
     jarelturg: [],   // array of MonthEntry
     newCars: [],     // array of MonthEntry
     imports: []      // array of MonthEntry
   }
   ```
2. Update `loadDB()` to handle migration from old `{ months: [] }` format — move existing data to `jarelturg` key
3. Update `saveDB()` for the new structure
4. Update localStorage key to `jarelturDB_v4` (bump version since schema changed)
5. Update `handleFiles()` and `parseFile()` to store rows in the correct category array
6. Update the upsert logic (currently `db.months.filter(...)`) to work per-category

**Acceptance criteria:**
- Old localStorage data (`jarelturDB_v3`) is automatically migrated to new format on load
- New uploads store data in the correct category based on which sheet was parsed
- All 3 categories persist independently in localStorage

---

### Task 1.3: Add category navigation to the UI
**Status:** NOT STARTED
**Priority:** P1 — depends on Task 1.2
**Files:** `index.html` (HTML sidebar section + `showPage()` function)

**What to do:**
1. Add a category selector to the sidebar or topbar. Options:
   - **Recommended:** Add a dropdown or tab bar in the topbar area that switches between "Järelturg", "Uued sõidukid" (New cars), "Import"
   - The existing page navigation (Overview, Comparison, Sync) stays the same
   - The category selector acts as a global filter — whichever category is selected, the Overview and Comparison pages show data for that category
2. Store the active category in a variable (e.g., `let activeCategory = 'jarelturg'`)
3. Update `renderOverview()` and `renderComparisonPage()` to read from `db[activeCategory]` instead of `db.months`

**Acceptance criteria:**
- User can switch between 3 categories via UI
- Overview page updates charts/tables to show selected category's data
- Comparison page filters to selected category
- Active category is visually indicated in the UI

---

### Task 1.4: Combined cross-category overview
**Status:** NOT STARTED
**Priority:** P2 — depends on Tasks 1.2 and 1.3
**Files:** `index.html` (new section in overview page)

**What to do:**
1. Add a 4th category option: "Kogu turg" (Full market) that shows a combined view
2. When "Kogu turg" is selected on the Overview page, show:
   - A stacked bar chart: monthly totals per category (järelturg, new, import) stacked
   - Summary stats: total transactions across all categories, category breakdown percentages
   - A comparison table: top 10 makes ranked by total activity across all categories
3. This does NOT apply to the Comparison page (keep that single-category)

**Acceptance criteria:**
- "Kogu turg" option appears in category selector
- Stacked bar chart shows all 3 categories per month
- Summary stats show cross-category totals
- Top makes table combines data from all categories

---

### Task 1.5: Update documentation
**Status:** NOT STARTED
**Priority:** P1 — do after Tasks 1.1-1.4 are complete
**Files:** `docs/rpd.md`, `docs/data-schema.md`, `docs/buildplan.md`, `docs/architecture.md`

**What to do:**
1. In `docs/rpd.md`: Update FR-004 and FR-005 status from "Planned" to "DONE"
2. In `docs/data-schema.md`: Update "Current Data Model" section to reflect the new 3-category schema. Move old schema to a "Legacy" note.
3. In `docs/buildplan.md`: Check off Phase 1 deliverables, mark Sprint 1 as complete
4. In `docs/architecture.md`: Update the "Current Architecture" section if any structural changes were made

**Acceptance criteria:**
- All docs accurately reflect the new codebase state
- No stale status fields or outdated schema descriptions

---

## How to Work

1. Pick the next NOT STARTED task (in order)
2. Read the referenced files to understand current code
3. Implement the changes
4. Update this file: change status to DONE
5. Commit with a descriptive message
6. Move to the next task
