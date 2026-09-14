import {
  CONTACT_EMAIL,
  applyFilters,
  firmPrice,
  milesLabel,
  sortListings,
  teslaListingUrl,
  uniqueLocations,
  usd
} from "./catalog.js";

const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("result-count");
const statusEl = document.getElementById("data-status");
const formEl = document.getElementById("filters");
const locationsEl = document.getElementById("locations");
const inquiryEl = document.getElementById("inquiry");

let listings = [];

function readFilters() {
  const data = new FormData(formEl);
  return {
    model: data.get("model") || "",
    yearMin: data.get("yearMin"),
    yearMax: data.get("yearMax"),
    milesMax: data.get("milesMax"),
    priceMax: data.get("priceMax"),
    location: data.get("location"),
    sort: data.get("sort") || "price-asc"
  };
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
  const ours = firmPrice(item.teslaListPrice);
  const url = teslaListingUrl(item);
  const options = (item.options || []).slice(0, 6);
  const sample = item.sample
    ? `<span class="badge sample">SAMPLE</span>`
    : "";
  const cond = item.condition === "CPO"
    ? `<span class="badge cpo">CPO</span>`
    : `<span class="badge used">Used</span>`;
  const teslaLinkLabel = item.sample
    ? "Tesla used inventory (search — SAMPLE, not this VIN)"
    : "Original Tesla listing";

  return `<article class="card" data-model="${escapeHtml(item.model)}" data-vin="${escapeHtml(item.vin)}">
    <div class="card-top">
      <div>
        <div class="model">${escapeHtml(item.year)} ${escapeHtml(item.modelName)}</div>
        <div class="trim">${escapeHtml(item.trim || "")}</div>
      </div>
      <div class="badges">${sample}${cond}</div>
    </div>
    <div class="meta">
      <div><span>Miles</span>${escapeHtml(milesLabel(item.miles))}</div>
      <div><span>Location</span>${escapeHtml(item.location)}</div>
    </div>
    <div class="prices">
      <div class="tesla-price">Tesla list ${escapeHtml(usd(item.teslaListPrice))}</div>
      <div class="our-price">
        <span>${escapeHtml(usd(ours))}</span>
        <span class="markup">+20% firm</span>
      </div>
    </div>
    <ul class="options">${options.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
    <a class="listing" href="${escapeHtml(url)}" rel="noopener noreferrer" target="_blank">${teslaLinkLabel}</a>
  </article>`;
}

function render() {
  const filters = readFilters();
  const next = sortListings(applyFilters(listings, filters), filters.sort);
  countEl.textContent = `${next.length} vehicle${next.length === 1 ? "" : "s"} · our price = Tesla list × 1.20`;
  resultsEl.innerHTML = next.map(card).join("");
  emptyEl.hidden = next.length > 0;
}

function fillLocations() {
  locationsEl.innerHTML = uniqueLocations(listings)
    .map((loc) => `<option value="${loc}"></option>`)
    .join("");
}

function showStatus(payload) {
  if (payload.source === "sample") {
    statusEl.dataset.kind = "sample";
    statusEl.textContent =
      "SAMPLE catalog. Tesla public used inventory is blocked from this host (HTTP 403). Every card is synthetic and badged SAMPLE. Run npm run fetch to retry Tesla’s public API.";
    return;
  }
  statusEl.dataset.kind = "live";
  statusEl.textContent = `Live Tesla used / CPO list prices fetched ${payload.fetchedAt || ""}. Our asking price is Tesla list × 1.20 (firm).`;
}

async function load() {
  const res = await fetch("./data/inventory.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load inventory (${res.status})`);
  const payload = await res.json();
  listings = payload.listings || [];
  showStatus(payload);
  fillLocations();
  render();
}

formEl.addEventListener("input", render);
formEl.addEventListener("change", render);
formEl.addEventListener("reset", () => {
  requestAnimationFrame(render);
});

inquiryEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(inquiryEl);
  const subject = encodeURIComponent("Lot Catalog inquiry");
  const body = encodeURIComponent(
    `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nVIN: ${data.get("vin") || "(none)"}\n\n${data.get("message")}\n\nI understand prices are firm at Tesla used/CPO list × 1.20.`
  );
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

load().catch((err) => {
  statusEl.dataset.kind = "sample";
  statusEl.textContent = err.message;
  countEl.textContent = "Inventory failed to load.";
});
