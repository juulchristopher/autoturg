# Autoturg — Builder Instructions

## Project

Estonian used car market intelligence platform. Live at https://juulchristopher.github.io/autoturg

## Architecture

React SPA built with Vite + TypeScript + Tailwind CSS + shadcn/ui.

- **Frontend:** React 18, react-router-dom (HashRouter), react-chartjs-2
- **UI library:** shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Charts:** Chart.js 4.4 via react-chartjs-2
- **Styling:** Tailwind CSS v3 with custom theme (DM Sans + DM Mono fonts, gold accent)
- **Build:** Vite 5, TypeScript ~5.6
- **Data pipeline:** `parse.py` (Python, openpyxl) — tries avaandmed.eesti.ee API first, falls back to URL-guessing
- **Price pipeline:** `fetch_prices.py` (Python) — fetches from mobile.de, AutoScout24, auto24.ee; outputs prices.json
- **Vehicle scraper:** `scrape_vehicle.py` (Python) — mntstat.ee lookup by reg number or filters (server-side only)
- **Vehicle API client:** `fetch_vehicle.py` (Python) — ATV API client with mntstat.ee fallback, CLI + HTTP proxy server
- **Vehicle CORS proxy:** `worker/vehicle-proxy.js` (Cloudflare Worker) — proxies vehicle lookups for client-side access
- **Vehicle proxy lib:** `src/lib/vehicle-proxy.ts` — client-side proxy helper (localStorage URL, health check, reg lookup)
- **VIN decode:** Client-side in `src/lib/vin-decoder.ts`, 70+ WMI codes
- **Data:** `public/data.json` (transactions), `public/prices.json` (pricing)
- **Hosting:** GitHub Pages (build output in `dist/`)

Legacy vanilla JS version preserved in `index-legacy.html`.

Read `docs/architecture.md` for full system design.

## Source Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + layout shell (HashRouter)
├── index.css                   # Tailwind + shadcn theme + custom styles
├── types/index.ts              # All TypeScript interfaces
├── lib/
│   ├── utils.ts                # shadcn cn() utility
│   ├── colors.ts               # COLORS[], MAKE_COLORS{}, colorFor()
│   ├── vin-decoder.ts          # WMI_MAP, YEAR_CODES, decodeVIN()
│   ├── data-utils.ts           # Data aggregation, ranking, filtering
│   ├── price-utils.ts          # Price lookup, depreciation, classification
│   └── chart-config.ts         # Shared Chart.js options factory
├── context/DataContext.tsx      # Global state: db, prices, category, timeline
├── components/
│   ├── ui/                     # shadcn components (Button, Card, Tabs, Command, etc.)
│   ├── layout/                 # Sidebar, Topbar, MobileNav
│   ├── shared/                 # CategoryTabs, StatPill, InsightCard, ChartCard, VehicleCombobox, DataTable
│   └── charts/                 # TrendLineChart, MarketShareDonut, MonthlyBarChart, etc.
├── pages/
│   ├── Overview.tsx            # Stats + trend/donut/bar charts + ranked table
│   ├── Comparison.tsx          # 5-slot model picker + charts + CSV export
│   ├── VehicleLookup.tsx       # VIN decode + selector + pricing + depreciation
│   └── DataStatus.tsx          # Loaded months table
public/
├── data.json                   # Transaction data (26 months, 3 categories)
└── prices.json                 # Pricing aggregates + listings
```

## Key Conventions

- **State management:** React Context (`DataContext`) for global data; local `useState` for page-level state
- **Routing:** HashRouter with 4 routes: `/`, `/comparison`, `/vehicle`, `/status`
- **Components:** shadcn/ui for primitives; custom shared components wrap them with app-specific styling
- **Combobox:** `VehicleCombobox` component (Popover + Command pattern) for searchable make/model/variant selection
- **Charts:** All chart components in `src/components/charts/`, each registers its own Chart.js modules
- **Data loading:** `data.json` loaded eagerly on mount; `prices.json` lazy-loaded on Vehicle Lookup page
- Server-side scripts: `parse.py` (data pipeline), `fetch_prices.py` (pricing), `scrape_vehicle.py` (vehicle lookup)
- Make names are always UPPERCASE
- Model splitting: first word = model, rest = variant. Exception: Tesla multi-word models (MODEL 3, MODEL S, etc.)
- Skip summary rows: KOKKU, TOTAL, ZUSAMMEN, SUM
- Multi-category data: `{jarelturg:[], newCars:[], imports:[]}` — all share same MonthEntry schema

## Frontend Aesthetics

Avoid generic "AI slop" aesthetics. Make creative, distinctive frontends that surprise and delight.

- **Typography**: Choose beautiful, unique fonts. Avoid generic families (Inter, Roboto, Arial, system fonts). Pick distinctive choices that elevate the design.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- **Motion**: Use animations for effects and micro-interactions. Prefer CSS-only solutions for HTML; use Framer Motion in React. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (`animation-delay`) beats scattered micro-interactions.
- **Backgrounds**: Create atmosphere and depth rather than solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects matching the overall aesthetic.

Avoid these cliches:
- Overused font families (Inter, Roboto, Arial, Space Grotesk, system fonts)
- Purple gradients on white backgrounds
- Predictable layouts and cookie-cutter component patterns
- Converging on the same "safe" choices across generations

Interpret creatively. Make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics.

## Development

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

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
- Transpordiamet ATV API (abi.ria.ee/teabevarav/) — requires formal application + API key

## Agent Team

Four persistent agents, each with their own sub-instructions in `.claude/agents/`:

| Agent | Model | When to use |
|-------|-------|-------------|
| **frontend** | Sonnet 4.6 | React components, UI, styling, charts |
| **data** | Sonnet 4.6 | Python pipelines, data.json, prices.json |
| **architect** | Opus 4.6 | Architecture decisions, schema design, sprint planning |
| **qa** | Sonnet 4.6 | Build validation, code review, docs updates |

### Token efficiency rules

- **Default model:** `claude-sonnet-4-6` (configured in `.claude/settings.json`)
- **Use Opus only for:** architectural decisions with major trade-offs, complex cross-cutting refactors, dual-tier monetization design
- **Spawn parallel agents** when tasks are independent (e.g., frontend + data work in same sprint)
- **Always pass `model: "sonnet"`** in Agent tool calls unless Opus is explicitly warranted
- **Keep agent prompts focused** — don't dump full files into context; reference specific paths

### Usage limit monitoring (90% auto-stop)

When plan usage reaches **90%**, Claude must:
1. Commit and push all in-progress work
2. Save the session checkpoint: `bash /home/user/autoturg/.claude/hooks/on-stop.sh`
3. Activate the usage sentinel: `touch /tmp/autoturg-usage-stop`
4. Stop the session — the `PreToolUse` hook will block all further tool calls

**Trigger conditions** (any one is sufficient):
- The user says usage is at or above 90%
- The Claude Code status bar shows ≥ 90%
- You receive a rate-limit or quota error from the API

**Resume**: When usage resets (typically 1 hour), remove the sentinel:
`rm /tmp/autoturg-usage-stop`

The next session will auto-read `.session-checkpoint.md` via `on-session-start.sh` and continue from the sprint backlog.

### Context window + session continuity

- When a session ends (context full or manual stop), a checkpoint is auto-saved to `.session-checkpoint.md`
- The next session reads the checkpoint via `on-session-start.sh` hook and resumes from sprint backlog
- Hooks are in `.claude/hooks/` and configured in `.claude/settings.json`

### Web access (claude.ai/code)

Connect the `juulchristopher/autoturg` repo to claude.ai/code for browser-based agent sessions:
1. Go to claude.ai/code → Connect repository → `juulchristopher/autoturg`
2. Sessions start with `on-session-start.sh` which restores context and installs deps
3. All agent roles work identically in web and CLI sessions
