# Autoturg Roadmap

> **DRAFT — 2026-03-30. Pending owner review. Merge this PR to approve.**
> Maintained by the PM agent. Updated daily based on commits and issues.

---

## Vision

Autoturg is the go-to market intelligence platform for Estonian car buyers and sellers.
Free for casual browsing. Pro subscription for serious buyers. Pay-per-report for one-off deep dives.

---

## Current phase: Monetisation foundations

### Done ✅
- React SPA with Vite + TypeScript + Tailwind + shadcn/ui
- Market overview, model comparison, vehicle lookup (VIN + reg)
- 26 months of transaction data (Jan 2024 – Feb 2026)
- Supabase auth (email/password + Google OAuth)
- Content gating (pricing + depreciation behind Pro paywall)
- Stripe payments integration (checkout + webhook Edge Function)
- Pricing page with Free / Pro / Report tiers

### In progress 🔄
- Stripe account setup + Edge Function deployment (Supabase env vars wired into CI)
- GitHub Actions autonomous agent team (orchestrator, dev, PM, resume watcher — synced to main)
- Data freshness tooltip on Overview stats (open issue, not started)

### Up next 📋
- Sprint 7: Interactive market reports + PDF export
- Sprint 8: Hard server-side gating (Supabase Edge Function for gated data)
- Growth: SEO, landing page, referral programme

---

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Auth live (users can sign up) | Sprint 4 | ✅ Done |
| Payments live (Stripe checkout works) | Sprint 5/6 | 🔄 Pending Stripe account activation |
| Content gating enforced | Sprint 6 | ✅ Done |
| First paying subscriber | Q2 2026 | ⏳ |
| 100 subscribers | Q3 2026 | ⏳ |
| Break-even | Q4 2026 | ⏳ |
