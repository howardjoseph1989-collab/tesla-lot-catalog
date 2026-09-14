import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { MARKUP, firmPrice } from "../catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "inventory.json"), "utf8"));
const nested = JSON.parse(fs.readFileSync(path.join(root, "data", "inventory.json"), "utf8"));
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

test("root inventory.json exists and matches data/", () => {
  assert.equal(inventory.listings.length, nested.listings.length);
  assert.ok(inventory.listings.length >= 20);
});

test("ourPrice is Tesla list × 1.20 on every listing", () => {
  assert.equal(MARKUP, 1.2);
  for (const row of inventory.listings) {
    assert.equal(row.ourPrice, firmPrice(row.teslaListPrice));
    assert.equal(row.sample, true);
    assert.match(row.vin, /^SMPL/);
  }
  assert.equal(firmPrice(32990), 39588);
});

test("app loads inventory.json and renders cards", () => {
  assert.match(app, /\.\/inventory\.json/);
  assert.match(app, /loadSeeded/);
  assert.match(app, /renderLive/);
});
