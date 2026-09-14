# Tesla Lot Catalog

**Live demo (HTTPS):** https://tesla-lot-catalog.surge.sh/

Independent reseller catalog of Tesla used / Certified Pre-Owned vehicles. **Not Tesla, Inc.**

## Pricing

Our asking price is **firm**: Tesla used/CPO list × **1.20** (`ourPrice` on every card).

## Mode

Tesla’s official used inventory API (`/inventory/api/v4/inventory-results`) returns **Akamai HTTP 403** from this host. The live site therefore shows **seeded SAMPLE used/CPO cards** (VIN prefix `SMPL`, SAMPLE badge) with firm +20% pricing, plus links to Tesla official pre-owned / used inventory.

GitHub Pages (`https://howardjoseph1989-collab.github.io/tesla-lot-catalog/`) cannot be enabled with this integration token (`Create Pages site failed: Resource not accessible by integration`). The Surge URL above is the public HTTPS catalog.

## Local

```bash
npm test
python3 -m http.server 4173
```

Contact: [howardjoseph1989@gmail.com](mailto:howardjoseph1989@gmail.com)
