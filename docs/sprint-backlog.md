# Sprint Backlog

---

## Sprint 5: Payments Foundation
> **Goal:** Users can subscribe and pay per report. Lemon Squeezy integration. No gating yet — payments exist, entitlements stored.
> **Sprint dates:** 2026-03-28 — 2026-04-07
> **References:** ADR-008, ADR-009

### Task 5.1: Lemon Squeezy client + types
**Status:** TODO
**Priority:** P0
**Files:** `src/lib/lemonsqueezy.ts`, `src/types/index.ts`

**Scope:**
- Lemon Squeezy JS SDK or direct API calls for checkout
- `createSubscriptionCheckout(email)` — opens LS checkout overlay for subscription product
- `createReportCheckout(email, make, model)` — opens LS checkout overlay for one-off report
- Product/variant IDs via `VITE_LS_SUBSCRIPTION_VARIANT_ID` and `VITE_LS_REPORT_VARIANT_ID` env vars
- Store ID via `VITE_LS_STORE_ID`

---

### Task 5.2: PricingCard component + Pricing page
**Status:** TODO
**Priority:** P0
**Files:** `src/components/shared/PricingCard.tsx`, `src/pages/Pricing.tsx`

**Scope:**
- `PricingCard` — free tier, subscriber tier, pay-per-report cards with feature lists
- `Pricing.tsx` page at `/pricing` route
- Subscriber card calls `createSubscriptionCheckout`
- Shows current tier (from `useAuth()`) with appropriate CTA
- Mobile-responsive 3-column layout

---

### Task 5.3: Supabase Edge Function: payment-webhook
**Status:** TODO
**Priority:** P0
**Files:** `supabase/functions/payment-webhook/index.ts`

**Scope:**
- Receives Lemon Squeezy webhook (order_created, subscription_created, subscription_updated)
- Verifies HMAC signature with `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `subscription_created` → upsert `subscriptions` row with status=active, expiry
- `subscription_cancelled` / `subscription_expired` → update status
- `order_created` for report → insert `report_purchases` row
- Return 200 on success, 400 on bad signature

---

### Task 5.4: Pricing page link in nav + docs update
**Status:** TODO
**Priority:** P1
**Files:** `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileNav.tsx`, `docs/sprint-backlog.md`

**Scope:**
- Add "Pricing" nav item (CreditCard icon) to sidebar + mobile nav
- Update sprint backlog, rpd.md FR statuses

---

## Sprint 4: Auth Foundation (DONE)
> **Goal:** Users can create accounts and sign in. No content gating yet — all existing features remain free.
> **Completed:** 2026-03-28
> **References:** ADR-006, ADR-007

### Task 4.1: Supabase project setup
**Status:** DONE
**Priority:** P0
**Files:** `src/lib/supabase.ts`, `supabase/migrations/001_create_tables.sql`, `.env.example`

**Scope:**
- Create Supabase project (EU region: `eu-central-1`)
- Enable email/password + Google OAuth
- Create tables: `subscriptions`, `report_purchases` with RLS policies (see ADR-006)
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` and GitHub Actions secrets
- `src/lib/supabase.ts` — Supabase client initialization

---

### Task 4.2: AuthContext + useAuth hook
**Status:** DONE
**Priority:** P0
**Files:** `src/context/AuthContext.tsx`, `src/App.tsx`

**Scope:**
- `AuthContext` — wraps app, holds `{ user, session, tier, signIn, signOut, loading }`
- `useAuth()` hook exported from context
- Calls `supabase.auth.getSession()` on mount, subscribes to auth state changes
- Fetches subscription status from `subscriptions` table after login, exposes `tier: 'free' | 'subscriber'`
- Wrap `<App>` with `<AuthProvider>` in `main.tsx`

---

### Task 4.3: Login/signup UI
**Status:** DONE
**Priority:** P0
**Files:** `src/components/shared/LoginDialog.tsx`, `src/components/shared/UserMenu.tsx`

**Scope:**
- `LoginDialog` — modal with email/password (sign in / sign up tabs) + Google OAuth button
- `UserMenu` — avatar + email dropdown in sidebar: sign-out, My Account, Pro badge if subscribed
- Sidebar: show "Sign in" button (guest) or `UserMenu` (authenticated)
- MobileNav: same sign-in / user menu logic

---

### Task 4.4: Privacy policy page
**Status:** DONE
**Priority:** P1
**Files:** `src/pages/Privacy.tsx`, `src/App.tsx`

**Scope:**
- Static `/privacy` route with GDPR-compliant privacy policy content
- Data collected: email only, stored in Supabase EU region (Frankfurt)
- Link from login/signup form footer
- Small text link at bottom of sidebar nav

---

## Sprint 3: Pricing Intelligence & Data Completeness

> **Goal:** Real Estonian pricing data, import category data, polished end-to-end flows.
> **Sprint dates:** 2026-03-27 — 2026-04-10
> **References:** FR-007, FR-008, FR-009, FR-012, FR-013

---

### Task 3.1: auto24.ee listing scraper
**Status:** BLOCKED
**Priority:** P0
**Files:** `fetch_prices.py`

**Scope:**
- Implement `fetch_auto24()` adapter that scrapes auto24.ee search results
- Parse make, model, year, price (EUR), km, fuel, transmission from listing cards
- Normalize make/model names to match data.json canonical names
- Integrate into `fetch_prices.py` pipeline (replaces stub)
- Test with `python fetch_prices.py --sample` and verify auto24 listings appear in prices.json

---

### Task 3.2: Statistikaamet TS322 import data
**Status:** DONE
**Priority:** P0
**Files:** `parse.py`, `public/data.json`

**Scope:**
- Call `andmed.stat.ee/api/v1/json` endpoint for table TS322 (first registrations by month/make)
- Map TS322 rows → `imports[]` category in data.json schema
- No credentials needed (public API)
- Add `try_statistikaamet()` function to parse.py, call it when imports sheet not found
- Regenerate data.json with populated imports category

---

### Task 3.3: End-to-end VIN flow verification
**Status:** DONE
**Priority:** P1
**Files:** `src/pages/VehicleLookup.tsx`, `src/lib/vin-decoder.ts`

**Scope:**
- Test VIN decode tab with a real VIN (e.g. `WBAFR9C56BC762715` BMW)
- Verify: VIN → decoded specs → market report → pricing section → depreciation chart all render
- Fix any missing data connections, empty states, or rendering bugs found
- Ensure make from VIN correctly populates the market report

---

### Task 3.4: Overview page enhancements
**Status:** DONE
**Priority:** P1
**Files:** `src/pages/Overview.tsx`

**Scope:**
- Add data freshness badge showing latest data month (e.g. "Data through Feb 2026")
- Add "Top Models" section showing top 5 models within the selected make filter
- Improve empty state when no data loaded

---

### Task 3.5: Update all documentation
**Status:** DONE
**Priority:** P1
**Files:** `docs/rpd.md`, `docs/architecture.md`, `docs/buildplan.md`, `CLAUDE.md`

**Scope:**
- Update FR statuses in rpd.md to reflect React version reality
- Update architecture.md: document React component structure, Cloudflare Worker, vehicle-proxy.ts
- Update buildplan.md: mark Phase 3/4/5 tasks as done in React, add Phase 6 scaffold
- Update CLAUDE.md: correct file references, remove vanilla SPA remnants

---

## Sprint 2: API Integration & Vehicle Lookup (DONE)

> **Completed:** 2026-03-25 — 2026-03-26
> **References:** FR-006, FR-010, FR-011, FR-015, FR-016

### Task 2.1: Integrate andmed.eesti.ee OpenData API ✓
- Added `try_opendata_api()` to parse.py with fallback to URL-guessing
- API key via `OPENDATA_API_KEY` env var

### Task 2.2: VIN decode logic (client-side) ✓
- `src/lib/vin-decoder.ts` with 70+ WMI codes, YEAR_CODES, `decodeVIN()`

### Task 2.3: Vehicle lookup via mntstat.ee ✓
- `scrape_vehicle.py` server-side scraper
- `fetch_vehicle.py` ATV API client + HTTP proxy mode
- `worker/vehicle-proxy.js` Cloudflare Worker (deployed at `autoturg-vehicle-proxy.juulchristopher.workers.dev`)
- `src/lib/vehicle-proxy.ts` client-side proxy helper

### Task 2.4: Vehicle detail panel UI ✓
- `src/pages/VehicleLookup.tsx` with VIN / Reg Number / Make+Model tabs
- `src/components/shared/VehicleSpecsCard.tsx`
- `src/components/charts/PriceBoxPlot.tsx`, `DepreciationChart.tsx`, `SourceComparisonChart.tsx`
- Reg Number tab live via Cloudflare Worker (no config needed for end users)

### Task 2.5: Update documentation ✓
- Sprint backlog, buildplan, architecture, rpd updated for Sprint 2 completion

---

## Data Source Reference

**auto24.ee:**
- Listings: `https://www.auto24.ee/kasutatud/nimekiri.php?bn=2&a=100&ae=2&af=500&otsi=Lisa+filter`
- Filter params: `m1[]=MAKE`, `aastad1=YEAR_FROM`, `aastad2=YEAR_TO`, `hind1=PRICE_MIN`
- No API, HTML scraping

**Statistikaamet TS322:**
- API: `https://andmed.stat.ee/api/v1/et/stat/TS322`
- POST with JSON query: `{ "query": [{"code": "Aasta", "selection": {...}}], "response": {"format": "json"} }`
- No auth needed, public API

**avaandmed.eesti.ee API:**
- Base URL: `https://avaandmed.eesti.ee/api/v1/`
- Auth: API key via `?apiKey=KEY`

**mntstat.ee:**
- Search: `GET /search.php?reg_nr=XXX`
- 829K+ vehicles, public web scraping
