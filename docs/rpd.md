# Requirements & Product Definition

> What Autoturg must do, for whom, and how we'll know it works.

**Last updated:** 2026-03-24

---

## 1. User Personas

### Buyer — "Mati"
Mati wants to buy a used BMW 3 Series. He needs to know if it's popular enough to find a good deal, what configurations exist, what a fair price is, and whether it will hold value. He may have a specific listing in mind and wants to check it by VIN or registration number.

### Dealer — "Karin"
Karin runs a used car lot in Tartu. She monitors market trends monthly to decide which models to stock, what prices to set, and which segments are growing or shrinking.

### Researcher — "Andres"
Andres is a journalist covering the Estonian auto market. He needs aggregate statistics on new registrations, imports, and aftermarket activity for articles and reports.

---

## 2. User Stories

### Popularity & Market Activity
- **US-01:** As a buyer, I want to see monthly transaction volume for a make/model so I can gauge its popularity.
- **US-02:** As a buyer, I want to see market share of different makes so I know which brands dominate.
- **US-03:** As a dealer, I want to compare transaction trends across makes to identify rising and falling demand.

### Configurations
- **US-04:** As a buyer, I want to see what engine/trim variants exist for a model and how each performs in the market.
- **US-05:** As a buyer, I want to compare configurations side by side to understand trade-offs.

### Production Years
- **US-06:** As a buyer, I want to see which production years of a model are most actively traded.
- **US-07:** As a buyer, I want to understand which generations offer the best availability.

### Depreciation
- **US-08:** As a buyer, I want to see how a model's price declines with age so I can assess value retention.
- **US-09:** As a buyer, I want to compare depreciation curves of competing models.

### Pricing
- **US-10:** As a buyer, I want to see current asking prices for a model across Estonian and European platforms.
- **US-11:** As a buyer, I want to see historical price trends and know what price range is normal.
- **US-12:** As a buyer, I want to know if a specific listing is priced above or below market average.

### Vehicle Lookup
- **US-13:** As a buyer, I want to enter a VIN and get full market context for that vehicle.
- **US-14:** As a buyer, I want to enter a registration number and see the vehicle's details and market position.
- **US-15:** As a buyer, I want to choose make/model/variant from dropdowns to explore market data.

### Market Categories
- **US-16:** As a buyer, I want to see new car registration volumes to understand what's entering the market.
- **US-17:** As a buyer, I want to see import volumes to understand what's being brought into Estonia.
- **US-18:** As a researcher, I want to compare activity across all 3 categories for a given make.

---

## 3. Functional Requirements

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| FR-001 | Display monthly transaction volume by make | P0 | DONE |
| FR-002 | Compare up to 5 make/model/variant combinations | P0 | DONE |
| FR-003 | Show production year distribution for selected models | P0 | DONE |
| FR-004 | Ingest new-car registration data from Transpordiamet infoleht | P1 | DONE |
| FR-005 | Ingest import registration data from Transpordiamet infoleht | P1 | Blocked — infoleht has no import sheet |
| FR-006 | Integrate Estonian Open Data Portal API for infoleht data | P2 | Planned |
| FR-007 | Integrate mobile.de API for European market pricing | P3 | Planned |
| FR-008 | Integrate AutoScout24 API for European market pricing | P3 | Planned |
| FR-009 | Collect auto24.ee listing data for Estonian local pricing | P3 | Planned |
| FR-010 | VIN decode and vehicle lookup | P2 | Planned |
| FR-011 | Registration number lookup via AVP/mntstat.ee | P2 | Planned |
| FR-012 | Generate depreciation curves from historical pricing data | P4 | Planned |
| FR-013 | Price range visualization (box plots or similar) | P3 | Planned |
| FR-014 | Make/model/variant selector input | P0 | DONE |
| FR-015 | VIN input field with decode | P2 | Planned |
| FR-016 | Registration number input field | P2 | Planned |

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time | < 2s on broadband, < 5s on 3G |
| NFR-02 | Data freshness | Updated by 21st of each month (Transpordiamet data) |
| NFR-03 | Availability | GitHub Pages SLA (~99.9%) |
| NFR-04 | Privacy | No user tracking, no cookies, no analytics |
| NFR-05 | Accessibility | WCAG 2.1 AA for core navigation and data views |
| NFR-06 | Browser support | Modern evergreen browsers (Chrome, Firefox, Safari, Edge) |

---

## 5. Data Sources

| Source | URL | Auth | Data Provided | Status |
|--------|-----|------|---------------|--------|
| Transpordiamet infoleht | transpordiamet.ee | Public download | Monthly registrations (new, import, jarelturg) by make/model/year | Active (jarelturg only) |
| Transpordiamet AVP | transpordiamet.ee (X-tee) | Formal application + €15/mo | Vehicle registry, VIN lookup, reg lookup (XML) | Need to apply |
| Estonian Open Data Portal | andmed.eesti.ee | API key (free) | Infoleht datasets, vehicle statistics | Ready to integrate |
| mntstat.ee | mntstat.ee | None (public web) | 829K vehicle records, reg search, specs | Web scraping |
| Statistikaamet API | andmed.stat.ee | None (public) | TS322: first registrations by month | Ready to integrate |
| mobile.de | services.mobile.de | HTTP Basic | Vehicle listings with prices (German/EU market) | Need API account |
| AutoScout24 | listing-creation.api.autoscout24.com | OAuth | Vehicle listings with prices (EU market) | Need API account |
| auto24.ee | auto24.ee | None (no API) | Estonian vehicle listings with prices | Scraping or partnership |
| autoportaal.ee | autoportaal.ee | None (no API) | Estonian vehicle listings with prices | Scraping or partnership |

---

## 6. Acceptance Criteria

### FR-001: Monthly transaction volume by make
- **Given** data is loaded for 1+ months
- **When** user views the Overview page
- **Then** a line chart shows top 5 makes over time, a donut shows market share, and a table lists all makes sorted by volume

### FR-004: New-car registration data
- **Given** parse.py runs on a monthly infoleht file
- **When** the file contains a new-car registrations sheet
- **Then** the data is extracted and stored in data.json under a `newCars` category with the same row schema

### FR-010: VIN decode
- **Given** user enters a 17-character VIN
- **When** VIN is submitted
- **Then** the system decodes make, model, year, and configuration and displays market context (transaction volume, pricing, depreciation) for that vehicle

### FR-012: Depreciation curves
- **Given** pricing data exists for a model across multiple production years
- **When** user views the depreciation view for that model
- **Then** a chart shows median price by vehicle age with sample size indicators

---

## 7. Open Questions & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AVP access requires formal application + €15/mo | Blocks FR-011 | Apply to transpordiamet@transpordiamet.ee; use mntstat.ee scraping as fallback |
| Infoleht has no dedicated import sheet | FR-005 blocked | Import data may need different source or manual identification of import-related sheets |
| auto24.ee / autoportaal.ee have no public API | Blocks FR-009 Estonian pricing | Explore partnership; scraping may violate ToS |
| mobile.de API requires separate account approval | Delays FR-007 | Apply early; AutoScout24 as backup |
| CORS restrictions on client-side API calls | Blocks direct browser-to-API calls | Use serverless proxy (Cloudflare Workers) or server-side pipeline |
| Data volume growth as pricing data is added | data.json becomes too large for static hosting | Migrate to SQLite or cloud database (see [Architecture](architecture.md)) |
