# Tesla Lot Catalog

**Live demo (HTTPS):** https://cdn.jsdelivr.net/gh/howardjoseph1989-collab/tesla-lot-catalog@main/index.html

Independent reseller catalog of Tesla used / Certified Pre-Owned vehicles. **Not Tesla, Inc.**

## Pricing

Our asking price is **firm**: Tesla used/CPO list × **1.20** (`ourPrice` on every listing).

## Mode

Tesla’s official used inventory API (`/inventory/api/v4/inventory-results`) and used-inventory HTML return **Akamai HTTP 403** from GitHub-hosted / datacenter IPs. This demo therefore ships **seeded SAMPLE used/CPO cards** (VIN prefix `SMPL`, SAMPLE badge) with firm +20% pricing, plus CTAs into Tesla’s official pre-owned / used pages.

GitHub Pages (`https://howardjoseph1989-collab.github.io/tesla-lot-catalog/`) is configured in Actions but this token cannot enable Pages in repo settings (`Create Pages site failed: Resource not accessible by integration`). The jsDelivr URL above serves `index.html` and `inventory.json` from `main`.

## Local

```bash
npm test
python3 -m http.server 4173
```

Contact: [howardjoseph1989@gmail.com](mailto:howardjoseph1989@gmail.com)
