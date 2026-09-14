import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  MARKUP,
  applyFilters,
  firmPrice,
  sortListings,
  teslaListingUrl
} from "../catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "data", "inventory.json"), "utf8")
);

test("markup is exactly +20%", () => {
  assert.equal(MARKUP, 1.2);
  assert.equal(firmPrice(10000), 12000);
  assert.equal(firmPrice(32990), 39588);
  assert.equal(firmPrice(19990), 23988);
});

test("seeded catalog is marked SAMPLE and uses SMPL VINs", () => {
  assert.equal(inventory.source, "sample");
  assert.ok(inventory.listings.length >= 20);
  for (const row of inventory.listings) {
    assert.equal(row.sample, true);
    assert.match(row.vin, /^SMPL/);
    assert.ok(row.teslaListPrice > 0);
    assert.ok(["3", "Y", "S", "X", "Cybertruck"].includes(row.model));
  }
});

test("filters: model, year, miles, price, location", () => {
  const { listings } = inventory;
  assert.ok(applyFilters(listings, { model: "Y" }).every((r) => r.model === "Y"));
  assert.ok(applyFilters(listings, { yearMin: 2024 }).every((r) => r.year >= 2024));
  assert.ok(applyFilters(listings, { yearMax: 2021 }).every((r) => r.year <= 2021));
  assert.ok(applyFilters(listings, { milesMax: 10000 }).every((r) => r.miles <= 10000));
  assert.ok(
    applyFilters(listings, { priceMax: 30000 }).every(
      (r) => firmPrice(r.teslaListPrice) <= 30000
    )
  );
  const tx = applyFilters(listings, { location: "TX" });
  assert.ok(tx.length >= 1);
  assert.ok(tx.every((r) => /TX/i.test(r.location)));
  assert.ok(applyFilters(listings, { model: "Cybertruck" }).length >= 1);
});

test("sample Tesla links go to used inventory search, not fake VIN pages", () => {
  const sample = inventory.listings[0];
  const url = teslaListingUrl(sample);
  assert.match(url, /^https:\/\/www\.tesla\.com\/inventory\/used\//);
});

test("sort by our firm price ascending", () => {
  const sorted = sortListings(inventory.listings, "price-asc");
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(
      firmPrice(sorted[i].teslaListPrice) >= firmPrice(sorted[i - 1].teslaListPrice)
    );
  }
});

test("every listing has card fields", () => {
  for (const row of inventory.listings) {
    assert.ok(row.modelName);
    assert.ok(row.year);
    assert.ok(Number.isFinite(row.miles));
    assert.ok(Number.isFinite(row.teslaListPrice));
    assert.ok(Array.isArray(row.options) && row.options.length);
    assert.ok(row.location);
  }
});
