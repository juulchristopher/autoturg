# UI/UX Review — Autoturg

> **Reviewed:** 2026-03-25 by PM
> **Branch:** claude/dazzling-brahmagupta (includes Sprint 2 builder work)
> **Viewport tested:** Desktop 1440×900, Mobile 375×812

---

## What Works Well

- **Clean card-based layout** — stat pills, chart cards, and tables are well-organized
- **DM Sans / DM Mono typography** pairing is solid and readable
- **Color palette** is restrained — gold accent, muted grays, good contrast
- **Category switching** (Järelturg/Uued/Import/Kogu turg) works seamlessly
- **VIN decode** works and shows relevant market context immediately
- **Mobile layout** collapses sidebar correctly, stat pills stack in 2-column grid

---

## Critical Issues

### 1. 🔴 Vehicle Lookup — Not on live site (main branch)
The builder built it on this branch but it hasn't been merged. Users see no vehicle lookup functionality.
**Action:** Merge to main after Sprint 2 is complete.

### 2. 🔴 Vehicle Lookup report feels thin
After VIN decode, the user sees:
- Vehicle Info card (make, year, VIN, WMI) — bare bones
- 4 stat pills (transactions, market share, rank, avg/month) — make-level only
- Monthly transaction volume chart — make-level only
- Production year distribution — not visible (chart cut off / scroll broken)

**Missing for a useful "customer report":**
- No model-level data (only shows make-level stats for "BMW", not "BMW 5 SERIES")
- No price information (not yet available, but placeholder needed)
- No depreciation indicator
- No "similar cars" or configuration comparison
- No exportable report / shareable link

### 3. 🔴 Scroll broken on Vehicle Lookup page
The production year distribution chart and any content below the monthly chart is not reachable — the main content area doesn't scroll past the first fold.

---

## UX Issues

### 4. 🟡 No clear landing page / value proposition
The app opens directly into "Monthly Overview" with data tables. A new user has no idea what this is or what they should do. There's no:
- Welcome state / onboarding
- "Enter your car" prominent CTA
- Explanation of what the data means

### 5. 🟡 Navigation hierarchy is confusing
The sidebar mixes two concepts:
- **Categories** (data filter): Järelturg, Uued, Import, Kogu turg
- **Views** (pages): Monthly Overview, Model Comparison, Vehicle Lookup

Users might think switching category navigates to a new page. The relationship between category and view is unclear.

### 6. 🟡 "Sync & Upload" exposed to end users
This is a developer/admin function. Regular users don't need to see data pipeline status. It clutters the nav.

### 7. 🟡 Reg Number tab says "Coming soon" with no timeline
This feels unfinished. Either hide it or give context ("Available Q2 2026").

### 8. 🟡 Model Comparison — 5 empty slots feel intimidating
Showing 5 blank slots with 3 dropdowns each (15 dropdowns total) is overwhelming. Better to start with 1-2 and let users add more.

---

## Visual Design Issues

### 9. 🟡 Dashboard looks like an admin panel, not a consumer product
The current design (monospace labels, technical terms like "txs", uppercase everything) feels like an internal analytics tool. For car buyers, it needs:
- Warmer, more approachable tone
- Less "data analyst" language, more "car buyer" language
- Visual hierarchy that guides the eye to key insights

### 10. 🟡 ALL-CAPS monospace labels are hard to scan
Headers like `TOP 5 MAKES — MONTHLY TRANSACTION VOLUME` and `JÄRELTURG · OWNER CHANGE REGISTRATIONS PER MONTH` are visually noisy. Use sentence case with clear hierarchy.

### 11. 🟡 Chart cards all look the same
Every chart is in an identical white card with the same styling. No visual differentiation between "key insight" and "detailed data". Important numbers don't stand out.

### 12. 🟡 No data storytelling
The dashboard shows data but doesn't interpret it. A consumer product should say things like:
- "BMW is the 2nd most traded car in Estonia — easy to buy and sell"
- "This model's popularity is trending ↗ up 12% this year"
- "Most traded production year: 2018"

### 13. 🟡 Color palette is too muted for a consumer app
The gold + gray palette is elegant but doesn't create energy. Car buying is emotional — the design could use more confident accent colors and better use of whitespace.

---

## Proposed Design Direction

### Phase A: Quick Wins (Sprint 2–3)
1. **Fix scroll bug** on Vehicle Lookup page
2. **Make Vehicle Lookup the hero page** — prominent input at top, consider making it the landing page
3. **Add insight text** below stat pills ("BMW is the 2nd most popular make in Estonia")
4. **Collapse Model Comparison** to 2 default slots, "Add another" button
5. **Hide Sync & Upload** behind a settings/admin toggle
6. **Add model-level drill-down** in Vehicle Lookup (not just make-level)

### Phase B: Design Refresh (Sprint 4–5)
1. **Landing page** with hero section: "Find out everything about your next car" + large input field
2. **Tab redesign**: Replace sidebar with top navigation bar for views, keep categories as filter chips
3. **Sentence-case labels** throughout — remove all-caps monospace headers
4. **Insight cards** that tell stories ("This car holds its value well", "Popular in Tallinn")
5. **Dark mode** option (many car sites use dark themes)
6. **Vehicle report page** that feels like a proper report:
   - Hero section with car silhouette/icon
   - Market position summary
   - Price range (when available)
   - Depreciation forecast (when available)
   - "Share this report" button

### Phase C: Full Redesign (Sprint 7+)
1. Consider moving from sidebar layout to full-width with sticky top nav
2. Add illustrations / car brand logos
3. Add micro-animations for data loading
4. Progressive disclosure — show summary first, details on demand
5. Mobile-first complete overhaul

---

## Summary

The current UI is **solid as a data dashboard** but needs to evolve from "analytics admin panel" → "consumer car intelligence product". The Vehicle Lookup page is the right direction — it should become the primary experience with the market overview as supporting context.

**Top 3 priorities for the builder:**
1. Fix Vehicle Lookup scroll bug
2. Add model-level data to Vehicle Lookup report (not just make-level)
3. Add insight text that interprets the data for the user
