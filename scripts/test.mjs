import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  MARKUP,
  TESLA_PREOWNED_CA,
  TESLA_USED_CA,
  applyFilters,
  firmPrice,
  isLivePayload,
  teslaOfficialInventoryUrl,
  teslaUsedSearchUrl
} from "../catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "data", "inventory.json"), "utf8")
);

test("markup is exactly +20%", () => {
  assert.equal(MARKUP, 1.2);
  assert.equal(firmPrice(10000), 12000);
  assert.equal(firmPrice(42990), 51588);
});

test("primary CTAs point at Tesla official pre-owned / used inventory", () => {
  assert.match(html, new RegExp(TESLA_PREOWNED_CA.replaceAll("/", "\\/")));
  assert.match(html, new RegExp(TESLA_USED_CA.replaceAll("/", "\\/")));
  assert.match(html, /Independent reseller — not Tesla/);
  assert.match(html, /1\.20/);
});

test("app does not treat SAMPLE json as live inventory", () => {
  assert.equal(isLivePayload(inventory), false);
  assert.match(app, /tryLiveApi/);
  assert.match(app, /renderFeedthrough/);
  assert.doesNotMatch(app, /source === "sample"/);
});

test("official Tesla URLs stay on tesla.com", () => {
  assert.equal(
    teslaOfficialInventoryUrl({ region: "CA", teslaCode: "my" }),
    "https://www.tesla.com/en_ca/inventory/used/my?arrangeby=plh"
  );
  assert.equal(teslaUsedSearchUrl("m3", "US"), "https://www.tesla.com/inventory/used/m3");
});

test("filter helpers still work on arbitrary listing objects", () => {
  const rows = [
    { model: "Y", year: 2024, miles: 1000, teslaListPrice: 40000, location: "Toronto, ON" },
    { model: "3", year: 2021, miles: 50000, teslaListPrice: 25000, location: "Austin, TX" }
  ];
  assert.equal(applyFilters(rows, { model: "Y" }).length, 1);
  assert.equal(applyFilters(rows, { priceMax: 30000 }).length, 1);
});
