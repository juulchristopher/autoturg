# Autoturg Business Plan

> **DRAFT — 2026-03-30. Pending owner review. Merge this PR to approve.**
> Maintained by the PM agent. Updated when strategic context changes.

---

## Problem

Estonian car buyers have no reliable tool to understand whether a price is fair,
how fast a model depreciates, or when the best time to buy is.
Transpordiamet publishes raw transaction data monthly — but it's an Excel file
that requires expertise to interpret.

## Solution

Autoturg turns that raw data into actionable market intelligence:
- Free: make-level trends anyone can use
- Pro: model-level pricing, depreciation curves, market timing signals
- Reports: one-off deep dives for high-consideration purchases

## Market

- ~50,000 used car transactions per year in Estonia
- Target users: private buyers, dealers, fleet managers, enthusiasts
- Addressable market: ~15,000 active car shoppers at any time

## Revenue model

| Product | Price | Target |
|---------|-------|--------|
| Pro subscription | €9/month | Recurring revenue base |
| Market report | €4.90 one-off | Low-friction entry point |

**Year 1 targets:**
- 200 subscribers × €9/mo = €1,800/mo recurring
- 500 reports/year × €4.90 = €2,450 one-off

## Competitive advantage

- Only tool with full Transpordiamet transaction data (26 months)
- VIN decode + market price in one flow
- Designed for mobile, not spreadsheets
- No ads, no tracking beyond auth

## Go-to-market

1. SEO: target "auto24 hind", "muu hind", model-specific searches
2. Auto forums and Facebook groups (organic)
3. Referral: free month for every paid referral
4. Partnership: auto24.ee, mobile.de Estonia listing integration

## Risks

| Risk | Mitigation |
|------|-----------|
| Transpordiamet changes data format | Parse.py is resilient; open data API fallback |
| Low conversion free → paid | Sharper gating, clearer upgrade prompts |
| Competitor copies the idea | Speed + data depth + brand loyalty |
| Stripe activation delayed | End-to-end checkout untestable until account live; revenue start pushed |
| Agent team runs autonomously without review | Owner reviews and merges PM PRs; dev PRs gated by CI |

## Current operational note (2026-03-30)

The full monetisation stack is code-complete: auth (Supabase), content gating (blur overlay), and payments (Stripe checkout + webhook). The remaining gate is Stripe account activation. Until live, no real revenue can be collected. This should be the owner's top operational priority this week.
