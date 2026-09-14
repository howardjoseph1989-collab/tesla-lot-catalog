#!/usr/bin/env node
/**
 * Fetch Tesla public used / CPO inventory and write data/inventory.json.
 *
 * Tesla frequently returns 403 to datacenter IPs and blocks CORS in browsers.
 * Run locally: `npm run fetch`
 *
 * On failure this script leaves the existing (SAMPLE) catalog in place unless
 * --replace-on-fail is passed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS, teslaUsedSearchUrl } from "../catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "inventory.json");

const MODEL_FROM_CODE = Object.fromEntries(MODELS.map((m) => [m.teslaCode, m]));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function buildQuery(teslaCode, offset = 0) {
  const payload = {
    query: {
      model: teslaCode,
      condition: "used",
      arrangeby: "Price",
      order: "asc",
      market: "US",
      language: "en",
      super_region: "north america"
    },
    count: 24,
    offset,
    outsideOffset: 0,
    outsideSearch: true
  };
  return `https://www.tesla.com/inventory/api/v4/inventory-results?${new URLSearchParams({
    query: JSON.stringify(payload)
  })}`;
}

function optionSummary(item) {
  const named = [];
  const data = item.OptionCodeData || item.optionCodeData || [];
  if (Array.isArray(data)) {
    for (const opt of data) {
      const name = opt?.name || opt?.long_name || opt?.description;
      if (name && typeof name === "string") named.push(name);
    }
  }
  const extras = [item.PAINT, item.INTERIOR, item.WHEELS, item.AUTOPILOT]
    .flat()
    .filter(Boolean)
    .map(String);
  const merged = [...named, ...extras];
  const uniq = [...new Set(merged)].filter((s) => s.length < 80);
  return uniq.slice(0, 6);
}

function isCpo(item) {
  const status = String(item.CPORefurbishmentStatus || item.cpoRefurbishmentStatus || "");
  if (/cpo|certified/i.test(status)) return true;
  if (item.IsCPO === true || item.isCpo === true) return true;
  const title = String(item.TitleStatus || item.TitleType || "");
  return /cpo|certified/i.test(title);
}

function normalize(item) {
  const vin = String(item.VIN || item.vin || "").trim();
  const teslaCode = String(item.Model || item.model || "").toLowerCase();
  const meta = MODEL_FROM_CODE[teslaCode];
  if (!vin || vin.length < 8 || !meta) return null;

  const teslaListPrice = Number(
    item.Price ?? item.PurchasePrice ?? item.InventoryPrice ?? item.TotalPrice
  );
  if (!Number.isFinite(teslaListPrice) || teslaListPrice <= 0) return null;

  const city = item.City || item.city || "";
  const state = item.StateProvince || item.State || item.state || "";
  const location = [city, state].filter(Boolean).join(", ") || item.MetroName || "United States";

  return {
    id: vin,
    sample: false,
    vin,
    model: meta.id,
    modelName: meta.label,
    teslaCode: meta.teslaCode,
    year: Number(item.Year || item.year),
    trim: item.TrimName || item.trim || item.TRIM || "Used",
    miles: Math.round(Number(item.Odometer || item.odometer || 0)),
    teslaListPrice,
    city,
    state,
    location,
    options: optionSummary(item),
    condition: isCpo(item) ? "CPO" : "Used",
    teslaUrl: `https://www.tesla.com/${meta.teslaCode}/order/${encodeURIComponent(vin)}`
  };
}

async function fetchModel(teslaCode) {
  const url = buildQuery(teslaCode, 0);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      Referer: teslaUsedSearchUrl(teslaCode),
      Origin: "https://www.tesla.com"
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${teslaCode} HTTP ${res.status} ${body.slice(0, 180)}`);
  }
  const json = await res.json();
  const rows = json.results || json.exact || [];
  return rows.map(normalize).filter(Boolean);
}

async function main() {
  const listings = [];
  const errors = [];

  for (const model of MODELS) {
    try {
      const rows = await fetchModel(model.teslaCode);
      listings.push(...rows);
      console.log(`Fetched ${rows.length} used ${model.label} listings`);
    } catch (err) {
      errors.push(`${model.label}: ${err.message}`);
      console.error(`Failed ${model.label}: ${err.message}`);
    }
  }

  const unique = [];
  const seen = new Set();
  for (const row of listings) {
    if (seen.has(row.vin)) continue;
    seen.add(row.vin);
    unique.push(row);
  }

  if (!unique.length) {
    console.error(
      "Tesla public inventory blocked or empty.\n" +
        errors.join("\n") +
        "\nKeeping existing data/inventory.json (SAMPLE fallback)."
    );
    process.exit(0);
  }

  const payload = {
    source: "tesla-public",
    fetchedAt: new Date().toISOString(),
    markup: 1.2,
    note: "Live Tesla used / CPO list prices. Our asking price is Tesla list × 1.20 (firm).",
    listings: unique
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${unique.length} listings to ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
