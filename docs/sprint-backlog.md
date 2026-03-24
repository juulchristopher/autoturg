# Sprint 2: API Integration & Vehicle Lookup

> **Goal:** Replace URL-guessing with proper API data fetching. Add vehicle lookup by VIN and registration number.
> **Sprint dates:** 2026-03-25 — 2026-04-08
> **References:** Phase 2 in `buildplan.md`, FR-006, FR-010, FR-011, FR-015, FR-016

---

## Tasks

### Task 2.1: Integrate andmed.eesti.ee OpenData API
**Status:** NOT STARTED
**Priority:** P0 — replaces fragile URL-guessing in parse.py
**Files:** `parse.py`

**What to do:**
1. Use the andmed.eesti.ee OpenData API to find and download infoleht datasets programmatically
2. API endpoints (based on the v1 API pattern):
   - Search: `GET /api/v1/datasets/search?q=infoleht`
   - Get dataset: `GET /api/v1/datasets/{datasetId}`
   - Download: `GET /api/v1/datasets/{datasetId}/download?format=xlsx`
   - Note: The portal transitioned from `avaandmed.eesti.ee` to `andmed.eesti.ee` — try both base URLs
3. The dataset is called **"Infoleht (esmaste ja uute sõidukite statistika)"** — search for it by name
4. If the API requires an API key, document the registration process in the code comments
5. Replace the `candidate_urls()` function in parse.py with an API-driven approach:
   - First try the API to get the download URL for the latest infoleht
   - Fall back to the current URL-guessing logic if API fails
6. Also check `https://andmed.stat.ee` for Statistikaamet API — table TS322 has first-registration data by month. The API uses POST requests with JSON query format (docs: `andmed.stat.ee/abi/api-juhend.pdf`)

**Acceptance criteria:**
- parse.py can discover and download infoleht files via the Open Data API
- Fallback to URL-guessing still works if API is unavailable
- Data output is identical to current (same schema, same parsing)

---

### Task 2.2: VIN decode logic (client-side)
**Status:** NOT STARTED
**Priority:** P1 — independent of API work
**Files:** `index.html`

**What to do:**
1. Implement client-side VIN decoding in JavaScript. A VIN is 17 characters with a standard structure:
   - Characters 1-3: **WMI** (World Manufacturer Identifier) → maps to make
   - Characters 4-8: **VDS** (Vehicle Descriptor Section) → model attributes
   - Character 9: Check digit
   - Character 10: **Model year** (A=2010, B=2011, ... J=2018, K=2019, L=2020, M=2021, N=2022, P=2023, R=2024, S=2025, T=2026)
   - Characters 11-17: Production sequence
2. Build a `WMI_MAP` lookup object mapping common WMI codes to makes. Cover at least the top 20 makes in Estonian market:
   - WBA/WBS=BMW, WDD/WDC=MERCEDES-BENZ, WVW/WV2=VOLKSWAGEN, WAU=AUDI, TMB=SKODA, SB1=TOYOTA, VF1/VF3=RENAULT, W0L=OPEL, etc.
   - Source: look up common WMI codes online
3. Create a `decodeVIN(vin)` function that returns: `{ make, modelYear, wmi, isValid }`
4. Validate VIN: exactly 17 chars, no I/O/Q, check digit validation (optional but nice)

**Acceptance criteria:**
- `decodeVIN("WBAXXXXXXXXXXXXXXX")` returns `{ make: "BMW", modelYear: 2018, ... }`
- Invalid VINs return `{ isValid: false }` with error message
- Top 20 Estonian-market makes are covered in WMI_MAP

---

### Task 2.3: Vehicle lookup via mntstat.ee scraping
**Status:** NOT STARTED
**Priority:** P1 — depends on nothing, can run in parallel with 2.1 and 2.2
**Files:** new file `scrape_vehicle.py`

**What to do:**
1. mntstat.ee (Maanteeameti statistika) has a public web interface with 829K+ vehicle records searchable by registration number
2. Build a Python script that:
   - Takes a registration number as input
   - Queries mntstat.ee (investigate the site's search form — it likely submits to a backend endpoint)
   - Parses the response HTML to extract vehicle details
   - Returns structured JSON: `{ regNumber, make, model, year, fuelType, powerKw, engineCc, bodyType, color, transmission }`
3. Use `urllib` or `requests` for HTTP, and a simple HTML parser (BeautifulSoup or regex) for extraction
4. Handle errors gracefully: vehicle not found, site unreachable, rate limiting
5. Add a `--json` flag for machine-readable output
6. This is a **server-side script** — it will be called by a future serverless proxy, not from the browser directly

**Acceptance criteria:**
- `python scrape_vehicle.py 123ABC` returns JSON with vehicle details
- Known registration numbers return correct make/model/year
- Vehicle-not-found returns a clean error, not a crash

---

### Task 2.4: Vehicle detail panel UI
**Status:** NOT STARTED
**Priority:** P2 — depends on Task 2.2 (VIN decode) being done
**Files:** `index.html`

**What to do:**
1. Add a new page to the SPA: **"Vehicle Lookup"** (id: `page-vehicle`)
2. Add a nav button in the sidebar under the existing pages section
3. The page should have:
   - **Input section** at the top with 3 tabs/modes:
     - "VIN" — text input for 17-char VIN, calls `decodeVIN()` on submit
     - "Reg number" — text input for Estonian plate number (disabled for now, shows "Coming soon — pending data access")
     - "Make/Model" — reuse the existing make/model/variant dropdown pattern
   - **Vehicle info card** showing decoded/looked-up data:
     - Make, model, year, fuel type, power, body type (whatever is available)
   - **Market context section** showing data from existing db:
     - Monthly transaction volume for this make/model (line chart, reuse existing chart logic)
     - Production year distribution (bar chart)
     - Market share of this make (stat pill)
     - Popularity rank among all makes
4. For VIN mode: decode the VIN client-side, then show market data for the decoded make
5. For Make/Model mode: show market data immediately from existing db
6. For Reg number mode: placeholder UI only (will be connected to scraper in future sprint)

**Acceptance criteria:**
- New "Vehicle Lookup" page accessible from sidebar
- VIN input decodes and shows market context for that make
- Make/Model input shows market context from existing data
- Reg number tab shows "Coming soon" state
- Charts render correctly using existing Chart.js patterns

---

### Task 2.5: Update documentation
**Status:** NOT STARTED
**Priority:** P1 — do after Tasks 2.1-2.4 are complete
**Files:** `docs/rpd.md`, `docs/data-schema.md`, `docs/buildplan.md`, `docs/architecture.md`

**What to do:**
1. In `docs/rpd.md`: Update FR-006, FR-010, FR-015 status to DONE. Update FR-011 to "In progress" if mntstat scraper works.
2. In `docs/data-schema.md`: Add VehicleLookup response schema if scraper returns structured data.
3. In `docs/buildplan.md`: Check off Phase 2 deliverables.
4. In `docs/architecture.md`: Document the new API integration in parse.py and the mntstat scraper.

**Acceptance criteria:**
- All docs accurately reflect the new codebase state
- API endpoints documented in architecture.md

---

## How to Work

1. Pick the next NOT STARTED task (in order, but 2.1/2.2/2.3 can be done in parallel)
2. Read the referenced files to understand current code
3. Implement the changes
4. Update this file: change status to DONE with notes on what was implemented
5. Commit with a descriptive message
6. Move to the next task

## Data Source Reference

**andmed.eesti.ee API:**
- Swagger docs: https://andmed.eesti.ee/api/dataset-docs/
- Dataset: "Infoleht (esmaste ja uute sõidukite statistika)"
- URL: https://andmed.eesti.ee/datasets/infoleht-(esmaste-ja-uute-soidukite-statistika)
- API pattern: `GET /api/v1/datasets/search?q=infoleht&apiKey=YOUR_KEY`

**Statistikaamet API (andmed.stat.ee):**
- Table TS322: First registrations by month
- API docs: https://andmed.stat.ee/abi/api-juhend.pdf
- Config/limits: https://andmed.stat.ee/api/v1/et?config

**mntstat.ee:**
- Public vehicle database: https://www.mntstat.ee/
- 829K+ vehicle records
- Searchable by brand, model, year, fuel type, registration number
- Web interface only — no REST API

**Transpordiamet infoleht files:**
- Download pattern: `https://www.transpordiamet.ee/sites/default/files/documents/{YYYY-MM}/INFOLEHT-{MMYYYY}.xlsx`
- File listing: https://www.transpordiamet.ee/soidukitega-tehtud-toimingute-statistika
- Naming is inconsistent across years (sometimes includes description suffixes)
