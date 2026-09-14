# Tesla Lot Catalog

**Live demo:** https://howardjoseph1989-collab.github.io/tesla-lot-catalog/

Independent reseller catalog of Tesla used / Certified Pre-Owned inventory. **Not Tesla, Inc.**

## Pricing

Our asking price is **firm**: Tesla used/CPO list × **1.20** (+20% middleman markup). Shown on every listing.

## What this site is

A storefront that lists Tesla used / CPO vehicles with:

- Model, year, miles, Tesla list price, our firm price (+20%)
- Options summary and a link to the original Tesla used listing (or Tesla used search for SAMPLE rows)
- Filters: model (3 / Y / S / X / Cybertruck), year, miles, our price, location
- Mobile-friendly high-contrast UI
- Contact: [howardjoseph1989@gmail.com](mailto:howardjoseph1989@gmail.com)

Banner on every page: *Independent reseller catalog — not Tesla, Inc. Prices firm (Tesla used/CPO list × 1.20).*

## Data

Tesla’s public used inventory API (`/inventory/api/v4/inventory-results`) is preferred. Datacenter IPs commonly receive **HTTP 403**. This repo includes:

1. `scripts/fetch-inventory.mjs` — fetch US used inventory for 3 / Y / S / X / Cybertruck
2. `data/inventory.json` — seeded **SAMPLE** listings (VINs start with `SMPL`, every card is badged SAMPLE)

Never treat SAMPLE VINs as real Tesla stock.

```bash
npm test
npm run fetch    # retries Tesla public inventory; keeps SAMPLE file if blocked
python3 -m http.server 4173
```

After a successful fetch, `data/inventory.json` is rewritten with `source: "tesla-public"` and real listing URLs.

## GitHub Pages

This repo deploys with GitHub Actions (`.github/workflows/pages.yml`). If `github.io` is not live yet, enable **Settings → Pages → GitHub Actions**, or use the jsDelivr / raw.githack mirror printed after merge.

Tesla names describe the vehicles. Lot Catalog is not affiliated with Tesla, Inc.
