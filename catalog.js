/** Shared catalog math, Tesla official URLs, and filters. Browser + Node. */

export const MARKUP = 1.2;
export const CONTACT_EMAIL = "howardjoseph1989@gmail.com";

export const TESLA_PREOWNED_CA = "https://www.tesla.com/en_ca/pre-owned";
export const TESLA_USED_CA = "https://www.tesla.com/en_ca/used";

export const MODELS = [
  { id: "3", label: "Model 3", teslaCode: "m3" },
  { id: "Y", label: "Model Y", teslaCode: "my" },
  { id: "S", label: "Model S", teslaCode: "ms" },
  { id: "X", label: "Model X", teslaCode: "mx" },
  { id: "Cybertruck", label: "Cybertruck", teslaCode: "ct" }
];

export function firmPrice(teslaListPrice) {
  const n = Number(teslaListPrice);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid Tesla list price");
  }
  return Math.round(n * MARKUP);
}

export function usd(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

export function cad(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(n);
}

export function money(n, region = "CA") {
  return region === "US" ? usd(n) : cad(n);
}

export function milesLabel(n) {
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} mi`;
}

export function teslaUsedSearchUrl(teslaCode, region = "CA") {
  const code = teslaCode || "m3";
  if (region === "US") return `https://www.tesla.com/inventory/used/${code}`;
  return `https://www.tesla.com/en_ca/inventory/used/${code}`;
}

export function teslaOfficialInventoryUrl({ region = "CA", teslaCode = "", zip = "" } = {}) {
  if (!teslaCode) {
    return region === "US" ? "https://www.tesla.com/inventory/used/m3" : TESLA_USED_CA;
  }
  const url = new URL(teslaUsedSearchUrl(teslaCode, region));
  url.searchParams.set("arrangeby", "plh");
  if (zip) url.searchParams.set("zip", zip);
  return url.toString();
}

export function teslaListingUrl(listing, region = "CA") {
  if (listing.sample) {
    return teslaUsedSearchUrl(listing.teslaCode || "m3", region);
  }
  const code = listing.teslaCode || "m3";
  const vin = listing.vin;
  if (vin) {
    const path = region === "CA" ? `/en_ca/${code}/order/` : `/${code}/order/`;
    return `https://www.tesla.com${path}${encodeURIComponent(vin)}`;
  }
  return teslaUsedSearchUrl(code, region);
}

export function applyFilters(listings, filters = {}) {
  const model = filters.model || "";
  const yearMin = filters.yearMin === "" || filters.yearMin == null ? null : Number(filters.yearMin);
  const yearMax = filters.yearMax === "" || filters.yearMax == null ? null : Number(filters.yearMax);
  const milesMax = filters.milesMax === "" || filters.milesMax == null ? null : Number(filters.milesMax);
  const priceMax = filters.priceMax === "" || filters.priceMax == null ? null : Number(filters.priceMax);
  const location = (filters.location || "").trim().toLowerCase();

  return listings.filter((item) => {
    if (model && item.model !== model) return false;
    if (yearMin != null && Number.isFinite(yearMin) && item.year < yearMin) return false;
    if (yearMax != null && Number.isFinite(yearMax) && item.year > yearMax) return false;
    if (milesMax != null && Number.isFinite(milesMax) && item.miles > milesMax) return false;
    const ours = firmPrice(item.teslaListPrice);
    if (priceMax != null && Number.isFinite(priceMax) && ours > priceMax) return false;
    if (location) {
      const hay = `${item.location || ""} ${item.city || ""} ${item.state || ""}`.toLowerCase();
      if (!hay.includes(location)) return false;
    }
    return true;
  });
}

export function sortListings(listings, sort = "price-asc") {
  const copy = listings.slice();
  copy.sort((a, b) => {
    switch (sort) {
      case "price-desc":
        return firmPrice(b.teslaListPrice) - firmPrice(a.teslaListPrice);
      case "miles-asc":
        return a.miles - b.miles;
      case "miles-desc":
        return b.miles - a.miles;
      case "year-desc":
        return b.year - a.year;
      case "year-asc":
        return a.year - b.year;
      case "price-asc":
      default:
        return firmPrice(a.teslaListPrice) - firmPrice(b.teslaListPrice);
    }
  });
  return copy;
}

export function uniqueLocations(listings) {
  return [...new Set(listings.map((l) => l.location).filter(Boolean))].sort();
}

export function isLivePayload(payload) {
  if (!payload || payload.source === "sample") return false;
  const rows = payload.listings || [];
  return rows.length > 0 && rows.every((row) => row.sample !== true);
}

export function teslaInventoryApiUrl({ teslaCode = "m3", market = "CA", count = 24 } = {}) {
  const payload = {
    query: {
      model: teslaCode,
      condition: "used",
      arrangeby: "Price",
      order: "asc",
      market,
      language: "en",
      super_region: "north america"
    },
    count,
    offset: 0,
    outsideOffset: 0,
    outsideSearch: true
  };
  return `https://www.tesla.com/inventory/api/v4/inventory-results?${new URLSearchParams({
    query: JSON.stringify(payload)
  })}`;
}
