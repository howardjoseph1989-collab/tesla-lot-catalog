# Tesla Lot Catalog

**Live demo (HTTPS):** https://howardjoseph1989-collab.github.io/tesla-lot-catalog/

**Mode shipped: feed-through to Tesla official used / pre-owned inventory.**

Tesla’s official used inventory API and used-inventory HTML (`/inventory/api/v4/inventory-results`, `/en_ca/used`, `/inventory/used/{model}`) return **Akamai HTTP 403 Access Denied** from this host (Chrome, curl, and Chrome TLS impersonation). The Canada pre-owned marketing page `https://www.tesla.com/en_ca/pre-owned` loads, but it is not a car list. Tesla also sends `X-Frame-Options: SAMEORIGIN`, so official inventory cannot be embedded.

This site therefore:

1. Tries live Tesla used inventory first (browser + `scripts/fetch-inventory.mjs`). If that succeeds, cards show **official Tesla cars** with **our firm price = Tesla list × 1.20**.
2. Does **not** present SAMPLE / invented VINs as stock.
3. Falls back to a Tesla-style browse (model / year / miles / price / location) whose primary CTA **opens Tesla official used / pre-owned pages** (`en_ca/pre-owned`, `en_ca/used`, and per-model used inventory). Buyers then email us the Tesla listing; we sell at list × 1.20.

Independent reseller — not Tesla, Inc.

Contact: [howardjoseph1989@gmail.com](mailto:howardjoseph1989@gmail.com)

## Local

```bash
npm test
npm run fetch    # retries Tesla public used inventory; keeps feed-through if 403
python3 -m http.server 4173
```
