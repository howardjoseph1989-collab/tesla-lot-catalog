import {
  CONTACT_EMAIL,
  MODELS,
  TESLA_PREOWNED_CA,
  TESLA_USED_CA,
  applyFilters,
  firmPrice,
  milesLabel,
  money,
  sortListings,
  teslaInventoryApiUrl,
  teslaListingUrl,
  teslaOfficialInventoryUrl,
  usd
} from "./catalog.js";
import { SEEDED } from "./seeded-inventory.js";

const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("result-count");
const statusEl = document.getElementById("data-status");
const formEl = document.getElementById("filters");
const portalsEl = document.getElementById("model-portals");
const inquiryEl = document.getElementById("inquiry");
const calcEl = document.getElementById("calc");
const calcOut = document.getElementById("calc-out");
const primaryCta = document.getElementById("primary-tesla-cta");

let listings = [];
let live = false;
let region = "CA";

function readFilters() {
  const data = new FormData(formEl);
  return {
    region: data.get("region") || "CA",
    model: data.get("model") || "",
    yearMin: data.get("yearMin"),
    yearMax: data.get("yearMax"),
    milesMax: data.get("milesMax"),
    priceMax: data.get("priceMax"),
    location: data.get("location")
  };
}

function modelMeta(id) {
  return MODELS.find((m) => m.id === id);
}

function officialUrl(filters = readFilters()) {
  const meta = modelMeta(filters.model);
  if (filters.region === "CA" && !meta) {
    return TESLA_USED_CA;
  }
  return teslaOfficialInventoryUrl({
    region: filters.region,
    teslaCode: meta?.teslaCode || "m3",
    zip: filters.location || ""
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function card(item) {
  const ours = item.ourPrice ?? firmPrice(item.teslaListPrice);
  const url = teslaListingUrl(item, region);
  const options = (item.options || []).slice(0, 6);
  const sample = item.sample ? `<span class="badge sample">SAMPLE</span>` : "";
  const cond = item.condition === "CPO"
    ? `<span class="badge">CPO</span>`
    : `<span class="badge">Used</span>`;

  return `<article class="card" data-vin="${escapeHtml(item.vin)}">
    <div class="model">${escapeHtml(item.year)} ${escapeHtml(item.modelName)}</div>
    <div>${escapeHtml(item.trim || "")}</div>
    <div class="badges">${sample}${cond}</div>
    <div>${escapeHtml(milesLabel(item.miles))} · ${escapeHtml(item.location || "")}</div>
    <div class="prices">
      <div class="tesla-price">Tesla list ${escapeHtml(money(item.teslaListPrice, region))}</div>
      <div class="our-price">
        <span>${escapeHtml(money(ours, region))}</span>
        <span class="markup">+20% firm</span>
      </div>
    </div>
    <ul>${options.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
    <a href="${escapeHtml(url)}" rel="noopener noreferrer" target="_blank">Original Tesla listing</a>
  </article>`;
}

function renderPortals() {
  const filters = readFilters();
  region = filters.region;
  primaryCta.href = filters.region === "CA" ? TESLA_PREOWNED_CA : "https://www.tesla.com/inventory/used/m3";
  portalsEl.innerHTML = MODELS.map((model) => {
    const href = teslaOfficialInventoryUrl({
      region: filters.region,
      teslaCode: model.teslaCode,
      zip: filters.location || ""
    });
    return `<a class="portal" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">
      <strong>${escapeHtml(model.label)}</strong>
      <span>Official Tesla used / CPO inventory</span>
      <span>Our price = Tesla list × 1.20</span>
    </a>`;
  }).join("");
}

function renderLive() {
  const filters = readFilters();
  const next = sortListings(applyFilters(listings, filters), "price-asc");
  countEl.textContent = `${next.length} official Tesla used vehicles · our price = Tesla list × 1.20`;
  resultsEl.innerHTML = next.map(card).join("");
  emptyEl.hidden = next.length > 0;
  emptyEl.textContent = "No live Tesla rows match those filters. Open Tesla official inventory instead.";
  portalsEl.hidden = next.length > 0;
}

function renderFeedthrough() {
  listings = [];
  live = false;
  resultsEl.innerHTML = "";
  emptyEl.hidden = true;
  portalsEl.hidden = false;
  countEl.textContent = "Live Tesla inventory API blocked here (Akamai HTTP 403). Browse official Tesla used cars, then we sell at list × 1.20.";
  statusEl.dataset.kind = "blocked";
  statusEl.innerHTML =
    "Tesla official used inventory is blocked from this host (Akamai <strong>HTTP 403</strong> on <code>/inventory/api/v4/inventory-results</code> and <code>/en_ca/used</code>). This site feeds you through to Tesla’s public pre-owned / used pages. We do not invent cars or VINs.";
  renderPortals();
}

function render() {
  renderPortals();
  if (live && listings.length) renderLive();
}

function optionSummary(item) {
  const named = [];
  const data = item.OptionCodeData || [];
  if (Array.isArray(data)) {
    for (const opt of data) {
      const name = opt?.name || opt?.long_name;
      if (name) named.push(String(name));
    }
  }
  return [...new Set(named)].slice(0, 6);
}

function normalizeTeslaItem(item) {
  const vin = String(item.VIN || item.vin || "").trim();
  const teslaCode = String(item.Model || item.model || "").toLowerCase();
  const meta = MODELS.find((m) => m.teslaCode === teslaCode);
  const teslaListPrice = Number(item.Price ?? item.PurchasePrice ?? item.InventoryPrice);
  if (!vin || vin.startsWith("SMPL") || !meta || !Number.isFinite(teslaListPrice) || teslaListPrice <= 0) {
    return null;
  }
  const city = item.City || "";
  const state = item.StateProvince || item.State || "";
  return {
    id: vin,
    sample: false,
    vin,
    model: meta.id,
    modelName: meta.label,
    teslaCode: meta.teslaCode,
    year: Number(item.Year || item.year),
    trim: item.TrimName || item.trim || "Used",
    miles: Math.round(Number(item.Odometer || 0)),
    teslaListPrice,
    city,
    state,
    location: [city, state].filter(Boolean).join(", "),
    options: optionSummary(item),
    condition: /cpo|certified/i.test(String(item.CPORefurbishmentStatus || "")) ? "CPO" : "Used"
  };
}

async function tryLiveApi(market) {
  const collected = [];
  for (const model of MODELS) {
    const url = teslaInventoryApiUrl({ teslaCode: model.teslaCode, market, count: 24 });
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });
    if (!res.ok) throw new Error(`Tesla inventory API HTTP ${res.status}`);
    const json = await res.json();
    const rows = json.results || json.exact || [];
    collected.push(...rows.map(normalizeTeslaItem).filter(Boolean));
  }
  if (!collected.length) throw new Error("Tesla inventory API returned no used vehicles");
  return collected;
}

async function loadSeeded() {
  for (const path of ["./inventory.json", "./data/inventory.json"]) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      const payload = await res.json();
      if (Array.isArray(payload.listings) && payload.listings.length) return payload;
    } catch {
      /* try next path */
    }
  }
  return null;
}

async function load() {
  const filters = readFilters();
  const market = filters.region === "US" ? "US" : "CA";
  try {
    listings = await tryLiveApi(market);
    live = true;
    statusEl.dataset.kind = "live";
    statusEl.textContent = `Live Tesla official used inventory (${market}). Our asking price is Tesla list × 1.20 (firm).`;
    renderLive();
    return;
  } catch {
    /* datacenters and browsers are commonly 403 / CORS-blocked by Akamai */
  }

  const seeded = (await loadSeeded()) || SEEDED;
  if (seeded) {
    listings = seeded.listings.map((row) => ({
      ...row,
      ourPrice: row.ourPrice ?? firmPrice(row.teslaListPrice)
    }));
    live = true;
    const sample = seeded.source === "sample" || listings.some((row) => row.sample);
    statusEl.dataset.kind = sample ? "blocked" : "live";
    statusEl.textContent = sample
      ? "Tesla live inventory API blocked (Akamai HTTP 403). Showing SAMPLE used/CPO listings. Every card is badged SAMPLE. Our firm price = Tesla list × 1.20."
      : "Tesla official used inventory snapshot. Our asking price is Tesla list × 1.20 (firm).";
    renderLive();
    return;
  }

  renderFeedthrough();
}

formEl.addEventListener("change", () => {
  if (listings.length) render();
  else renderPortals();
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  window.open(officialUrl(), "_blank", "noopener,noreferrer");
});

calcEl.addEventListener("input", () => {
  const list = Number(new FormData(calcEl).get("list"));
  if (!Number.isFinite(list) || list <= 0) {
    calcOut.textContent = "Our firm price: Tesla list × 1.20";
    return;
  }
  calcOut.textContent = `Our firm price: ${usd(firmPrice(list))}  (Tesla list ${usd(list)} × 1.20)`;
});

inquiryEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(inquiryEl);
  const list = Number(data.get("list"));
  const ours = Number.isFinite(list) && list > 0 ? usd(firmPrice(list)) : "(add Tesla list)";
  const subject = encodeURIComponent("Lot Catalog inquiry");
  const body = encodeURIComponent(
    `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nTesla listing / VIN: ${data.get("vin") || "(none)"}\nTesla list: ${data.get("list") || "(none)"}\nOur firm price (list × 1.20): ${ours}\n\n${data.get("message")}`
  );
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

load();
