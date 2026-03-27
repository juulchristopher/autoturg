# Sprint 2: React Foundation → Shippable Product

> **Goal:** Merge the ATV API branch, fix data gaps, add normalization, and polish the UI so the React app is ready for real users.
> **Sprint dates:** 2026-03-27 — 2026-04-10
> **Stack:** React + Vite + TypeScript + shadcn/ui + Tailwind
> **Model:** claude-sonnet-4-6 (all tasks)

---

## Current State (as of 2026-03-27)

- `main` = React app, live on GitHub Pages ✅
- `atv-integration-react` = 2 commits ahead of main, adds VehicleSpecsCard + Python proxy + better worker structure
- GitHub Actions already builds with `npm run build` → `dist/` ✅
- ATV API + Cloudflare Worker already on main ✅
- Import data = 0 months ❌
- prices.json = empty/stub ❌
- BMW model names = engine codes (116D not "1 Series") ❌

---

## Task Order

1. **Task 2.1** — Merge atv-integration-react → main
2. **Task 2.2** — Fix Import data parsing (0 → real data)
3. **Task 2.3** — Data normalization (BMW series names)
4. **Task 2.4** — Timeline preset buttons
5. **Task 2.5** — UI polish pass

---

## Task 2.1: Merge atv-integration-react → main

**Status:** NOT STARTED
**Priority:** P0 — unblocks everything
**Files:** `src/components/shared/VehicleSpecsCard.tsx`, `src/pages/VehicleLookup.tsx`, `worker/`, `fetch_vehicle.py`

### What this branch adds (verified via diff)

| File | What it adds |
|------|-------------|
| `src/components/shared/VehicleSpecsCard.tsx` | Displays ATV API vehicle data (make, model, year, fuel, odometer, colour, etc.) in a clean card |
| `src/pages/VehicleLookup.tsx` | Proxy health test UI, status indicators (checking/ok/error), settings panel for proxy URL |
| `worker/vehicle-proxy.js` | Cloudflare Worker in proper `worker/` directory (main has it misplaced at `src/lib/`) |
| `worker/wrangler.toml` | Wrangler config for Cloudflare deployment |
| `fetch_vehicle.py` | Python local proxy alternative (for development/testing without Cloudflare) |
| `src/lib/vehicle-proxy.ts` | Enhanced with `testProxyHealth()` and `setProxyUrl()` functions |
| `src/types/index.ts` | Adds `VehicleSpecs` type |

### Steps

1. From the `atv-integration-react` worktree (`/Users/christopherjuul/Desktop/autoturg/.claude/worktrees/hungry-spence`):
   ```bash
   git push -u origin atv-integration-react
   gh pr create --title "Add VehicleSpecsCard + Python proxy + worker directory structure" \
     --body "Adds VehicleSpecsCard component, proper worker/ directory, Python local proxy for dev, and enhanced proxy health testing UI." \
     --base main
   ```
2. Tag the PR for PM review
3. Do NOT squash — keep the 2 commits clean

### Acceptance criteria
- PR created and ready for merge
- `VehicleSpecsCard` renders real ATV API data (make, model, year, fuel type, odometer)
- `worker/` directory contains `vehicle-proxy.js` and `wrangler.toml`
- `src/lib/vehicle-proxy.js` (old misplaced location) removed if duplicated

---

## Task 2.2: Fix Import data parsing

**Status:** NOT STARTED
**Priority:** P0 — 0 months of import data is a critical gap
**Files:** `parse.py`

### The problem

`db.imports.length === 0` — the Import sheet is either not being parsed or its data structure differs from Järelturg/Uued.

### How to debug

```bash
cd /Users/christopherjuul/Desktop/autoturg
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('path/to/INFOLEHT-022026.xlsx')
print('Sheets:', wb.sheetnames)
ws = wb['Import']  # or whatever it's called
for row in ws.iter_rows(min_row=1, max_row=5, values_only=True):
    print(row)
"
```

### What to look for
- The Import sheet might be called `Import`, `Imporditud`, or `Impordi` — check exact name
- Row/column structure may differ from Järelturg (which has Make, Model, Variant, Count columns)
- Import may have additional columns (origin country, vehicle type)
- Skip rows where Make is in: `['KOKKU', 'TOTAL', 'ZUSAMMEN', 'SUM']` (per CLAUDE.md convention)

### Fix

Update `parse.py` to correctly identify and parse the Import sheet. Store in the same schema as järelturg:
```python
{ "year": 2024, "month": 1, "label": "Jan 2024", "rows": [
  { "make": "TOYOTA", "model": "COROLLA", "variant": "", "fullModel": "COROLLA", "prodYear": 2019, "count": 12 }
]}
```

### Acceptance criteria
- `data.json` includes at least 10 months of import data (all months where the XLSX has Import sheet data)
- Import data is visible in the app when "Import" category is selected
- `db.imports.length >= 10` in browser console

---

## Task 2.3: Data normalization — Model grouping

**Status:** NOT STARTED
**Priority:** P1 — critical for Vehicle Lookup usability
**Files:** `parse.py`, `data.json`

### The problem

Source data uses **engine codes** as model names. BMW alone has 242 "models":
- `116D`, `118D`, `120D` → should all be grouped as `1 SERIES`
- `318I`, `320D`, `330D` → `3 SERIES`
- `520D`, `530D`, `550E` → `5 SERIES`

A user searching for "BMW 3 Series" finds nothing. A user searching for `320D` finds only `320D` not related models.

### Implementation

Add a `normalize_model(make, raw_model)` function to `parse.py` that maps engine codes to series names. Store **both** the raw and normalized value:

```python
def normalize_model(make: str, raw_model: str) -> str:
    """Map raw engine-code model names to human-readable series/model names."""
    make = make.upper()
    raw = raw_model.upper().strip()

    if make == 'BMW':
        return BMW_SERIES_MAP.get(raw, raw)
    elif make == 'MERCEDES-BENZ':
        return MERCEDES_MAP.get(raw, raw)
    # etc.
    return raw  # fallback: keep original

BMW_SERIES_MAP = {
    # 1 Series (F20/F21/E87)
    '114D': '1 SERIES', '114I': '1 SERIES',
    '116D': '1 SERIES', '116ED': '1 SERIES', '116I': '1 SERIES',
    '118D': '1 SERIES', '118I': '1 SERIES',
    '120D': '1 SERIES', '120I': '1 SERIES',
    '123D': '1 SERIES', '125D': '1 SERIES', '125I': '1 SERIES',
    '128I': '1 SERIES', '130I': '1 SERIES', '135I': '1 SERIES',
    # 2 Series
    '214D': '2 SERIES', '216D': '2 SERIES', '218D': '2 SERIES',
    '218I': '2 SERIES', '220D': '2 SERIES', '220I': '2 SERIES',
    '225D': '2 SERIES', '225XE': '2 SERIES', '228I': '2 SERIES',
    '230I': '2 SERIES', '235I': '2 SERIES', '240I': '2 SERIES',
    # 3 Series
    '316D': '3 SERIES', '316I': '3 SERIES',
    '318D': '3 SERIES', '318I': '3 SERIES',
    '320D': '3 SERIES', '320I': '3 SERIES', '320XD': '3 SERIES',
    '323I': '3 SERIES', '325D': '3 SERIES', '325I': '3 SERIES',
    '328D': '3 SERIES', '328I': '3 SERIES',
    '330D': '3 SERIES', '330E': '3 SERIES', '330I': '3 SERIES',
    '335D': '3 SERIES', '335I': '3 SERIES', '340I': '3 SERIES',
    # 4 Series
    '418D': '4 SERIES', '418I': '4 SERIES',
    '420D': '4 SERIES', '420I': '4 SERIES',
    '425D': '4 SERIES', '428I': '4 SERIES',
    '430D': '4 SERIES', '430I': '4 SERIES',
    '435D': '4 SERIES', '435I': '4 SERIES', '440I': '4 SERIES',
    # 5 Series
    '518D': '5 SERIES', '518I': '5 SERIES',
    '520D': '5 SERIES', '520I': '5 SERIES',
    '523I': '5 SERIES', '525D': '5 SERIES', '525I': '5 SERIES',
    '528I': '5 SERIES', '530D': '5 SERIES', '530E': '5 SERIES',
    '530I': '5 SERIES', '535D': '5 SERIES', '535I': '5 SERIES',
    '540D': '5 SERIES', '540I': '5 SERIES',
    '545I': '5 SERIES', '550E': '5 SERIES', '550I': '5 SERIES',
    # 6 Series
    '620D': '6 SERIES', '625D': '6 SERIES', '630D': '6 SERIES',
    '630I': '6 SERIES', '633CSI': '6 SERIES', '635CSI': '6 SERIES',
    '640D': '6 SERIES', '640I': '6 SERIES', '645CI': '6 SERIES',
    '650I': '6 SERIES',
    # 7 Series
    '725TDS': '7 SERIES', '728I': '7 SERIES', '730D': '7 SERIES',
    '730I': '7 SERIES', '735I': '7 SERIES', '740D': '7 SERIES',
    '740E': '7 SERIES', '740I': '7 SERIES', '745E': '7 SERIES',
    '745I': '7 SERIES', '750E': '7 SERIES', '750I': '7 SERIES',
    '760I': '7 SERIES',
    # 8 Series
    '840D': '8 SERIES', '840I': '8 SERIES', '850CSI': '8 SERIES',
    '850I': '8 SERIES', 'M850I': '8 SERIES',
    # X Series (SUVs — keep as-is, they're already good)
    # M Series
    'M2': 'M2', 'M3': 'M3', 'M4': 'M4', 'M5': 'M5',
    'M6': 'M6', 'M8': 'M8',
    # Z Series
    'Z3': 'Z3', 'Z4': 'Z4', 'Z8': 'Z8',
    # i Series (electric)
    'I3': 'I3', 'I4': 'I4', 'I5': 'I5', 'I7': 'I7', 'IX': 'IX',
}

MERCEDES_MAP = {
    # C-Class
    'C 180': 'C-CLASS', 'C 200': 'C-CLASS', 'C 220': 'C-CLASS',
    'C 250': 'C-CLASS', 'C 300': 'C-CLASS', 'C 320': 'C-CLASS',
    'C 350': 'C-CLASS', 'C 400': 'C-CLASS', 'C 63': 'C-CLASS',
    # E-Class
    'E 200': 'E-CLASS', 'E 220': 'E-CLASS', 'E 250': 'E-CLASS',
    'E 280': 'E-CLASS', 'E 300': 'E-CLASS', 'E 320': 'E-CLASS',
    'E 350': 'E-CLASS', 'E 400': 'E-CLASS', 'E 450': 'E-CLASS',
    'E 500': 'E-CLASS', 'E 63': 'E-CLASS',
    # S-Class
    'S 300': 'S-CLASS', 'S 320': 'S-CLASS', 'S 350': 'S-CLASS',
    'S 400': 'S-CLASS', 'S 450': 'S-CLASS', 'S 500': 'S-CLASS',
    'S 580': 'S-CLASS', 'S 63': 'S-CLASS', 'S 65': 'S-CLASS',
    # A-Class
    'A 160': 'A-CLASS', 'A 170': 'A-CLASS', 'A 180': 'A-CLASS',
    'A 200': 'A-CLASS', 'A 220': 'A-CLASS', 'A 250': 'A-CLASS',
    'A 35': 'A-CLASS', 'A 45': 'A-CLASS',
    # B-Class
    'B 150': 'B-CLASS', 'B 160': 'B-CLASS', 'B 180': 'B-CLASS',
    'B 200': 'B-CLASS', 'B 220': 'B-CLASS', 'B 250': 'B-CLASS',
    # GLC, GLE, GLA, GLB — keep as-is, already readable
}
```

### Data schema change

Each row gets a new field `seriesName` (falls back to `model` if no mapping):

```json
{
  "make": "BMW",
  "model": "320D",
  "seriesName": "3 SERIES",
  "variant": "",
  "fullModel": "320D",
  "prodYear": 2018,
  "count": 12
}
```

### Frontend update needed

In `data-utils.ts`, update `uniqueModels()`, `modelOptionsWithCounts()`, and `rankModelsForMake()` to **group by `seriesName`** and sum counts, but keep `model` available for drill-down.

```typescript
// Group rows by seriesName (fall back to model)
export function modelOptionsWithCounts(months: MonthEntry[], make: string): [string, number][] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make) continue;
      const key = r.seriesName || r.model;  // USE seriesName
      map.set(key, (map.get(key) ?? 0) + r.count);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
```

### Acceptance criteria
- BMW dropdown shows "1 SERIES", "3 SERIES", "5 SERIES" etc. instead of "116D", "320D"
- Selecting "3 SERIES" shows ALL 3-series transactions (320D + 318I + 330D etc. combined)
- `seriesName` field present in all rows in `data.json`
- Makes that don't need normalization (VW, Toyota) unaffected
- After selecting a series, the variant dropdown shows the actual engine codes (320D, 318I, etc.)

---

## Task 2.4: Timeline preset buttons

**Status:** NOT STARTED
**Priority:** P1 — quick usability win
**Files:** `src/context/DataContext.tsx`, `src/components/layout/Topbar.tsx` (or wherever timeline is)

### What to build

Add 4 preset buttons next to the existing timeline controls:
- **Last month** — previous calendar month
- **This year** — Jan of current year → latest available month
- **Last year** — Jan–Dec of previous year
- **All** (already exists) — full data range

### Implementation

First, find where the timeline dropdowns live. Search for `timelineFrom` or `setTimeline` in the codebase.

Add a `setPreset(preset: 'lastMonth' | 'thisYear' | 'lastYear' | 'all')` function:

```typescript
function setPreset(preset: string) {
  const now = new Date();
  let from: TimelinePoint, to: TimelinePoint;

  if (preset === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    from = to = { year: d.getFullYear(), month: d.getMonth() + 1 };
  } else if (preset === 'thisYear') {
    from = { year: now.getFullYear(), month: 1 };
    to = { year: now.getFullYear(), month: now.getMonth() + 1 };
  } else if (preset === 'lastYear') {
    from = { year: now.getFullYear() - 1, month: 1 };
    to = { year: now.getFullYear() - 1, month: 12 };
  } else {
    setTimeline(null, null); // "All"
    return;
  }

  // Clamp to available data range
  setTimeline(
    clampToAvailableMonths(from, allMonths),
    clampToAvailableMonths(to, allMonths)
  );
}
```

### UI pattern

Use small pill buttons styled like the existing category tabs. Active preset highlighted.

```tsx
<div className="flex gap-1 items-center">
  {['Last month', 'This year', 'Last year', 'All'].map(label => (
    <button
      key={label}
      onClick={() => setPreset(label.toLowerCase().replace(' ', ''))}
      className={cn(
        "px-3 py-1 text-xs rounded-md font-medium transition-colors",
        activePreset === label
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  ))}
</div>
```

### Acceptance criteria
- 4 preset buttons visible alongside timeline
- Each correctly filters to the right date range
- "All" button resets to full data
- Active preset is visually highlighted
- Works correctly when preset range exceeds available data (clamps gracefully)

---

## Task 2.5: UI polish pass

**Status:** NOT STARTED
**Priority:** P2 — do after 2.1–2.4 are done
**Files:** Various `src/` files

### Review checklist

Run the app and check each of these:

**A. Vehicle Lookup page**
- [ ] Reg Number tab is default (should already be from recent commit)
- [ ] `VehicleSpecsCard` shows real fields: make, model, year, fuel type, odometer, colour, first registration date
- [ ] Popularity stats show: make rank (#N of all makes), model rank overall, model rank within make, total transactions
- [ ] Configuration comparison chart appears when a variant is selected — horizontal bar, selected variant highlighted
- [ ] Insight text is generated and reads naturally in English
- [ ] Production year chart visible and correct
- [ ] Cross-category chart shows järelturg vs new vs import for the selected model

**B. Overview page**
- [ ] Category tabs (Järelturg / Uued sõidukid / Import / Kogu turg) are in-page, not sidebar
- [ ] Switching category updates all charts and stats
- [ ] At least one insight text/sentence below the stat pills
- [ ] All chart titles in sentence case (not ALL CAPS MONOSPACE)

**C. Comparison page**
- [ ] Starts with 2 slots visible, "Add model +" adds up to 3 more
- [ ] Category switcher present

**D. General**
- [ ] No horizontal scroll on any page at 1440px width
- [ ] Mobile nav works (burger menu)
- [ ] Loading states show skeletons, not blank/broken UI
- [ ] Sync & Upload not in primary nav — moved to small gear icon at sidebar bottom

### For each issue found:
Fix it in the same PR. Keep fixes focused and small.

### Acceptance criteria
- All checklist items pass
- No console errors on any page
- No visible layout breaks at 1440px and 375px (mobile)

---

## How Builder Should Work

1. Pick the next NOT STARTED task in order above
2. Read the relevant files fully before starting
3. Implement → verify in browser → fix any issues
4. Update task status to DONE with brief notes
5. Commit: `git commit -m "Sprint 2.X: [what was done]"`
6. Push and create PR against `main`
7. Move to next task

**Key file locations:**
```
src/
  pages/          — full page components
  components/
    layout/       — Sidebar, Topbar, MobileNav
    shared/       — StatPill, InsightCard, ChartCard, VehicleSpecsCard
    charts/       — all chart components
    ui/           — shadcn primitives (Button, Card, Badge, etc.)
  lib/
    data-utils.ts — all data aggregation functions
    price-utils.ts — pricing, depreciation
    vehicle-proxy.ts — ATV API proxy client
    vin-decoder.ts — VIN decode logic
  context/
    DataContext.tsx — global state (db, category, timeline, prices)
  types/
    index.ts      — TypeScript types
parse.py          — data pipeline (monthly XLSX → data.json)
worker/           — Cloudflare Worker proxy
```

**Dev server:**
```bash
cd /Users/christopherjuul/Desktop/autoturg
npm run dev
# Opens at http://localhost:5173/autoturg/
```

---

## Definition of Done (Sprint 2)

- [ ] Task 2.1: PR created, atv-integration-react ready for merge
- [ ] Task 2.2: `db.imports.length >= 10` in browser console
- [ ] Task 2.3: BMW shows series names, not engine codes
- [ ] Task 2.4: Timeline presets working
- [ ] Task 2.5: All polish checklist items pass
- [ ] All committed, pushed, PRs created against main
- [ ] Docs updated (rpd.md, architecture.md, buildplan.md)
