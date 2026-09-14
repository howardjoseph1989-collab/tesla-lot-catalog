/** Shared catalog math and filters. Browser + Node. */

export const MARKUP = 1.2;
export const CONTACT_EMAIL = "howardjoseph1989@gmail.com";

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

export function milesLabel(n) {
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} mi`;
}

export function teslaUsedSearchUrl(teslaCode) {
  return `https://www.tesla.com/inventory/used/${teslaCode}`;
}

export function teslaListingUrl(listing) {
  if (listing.sample) {
    return teslaUsedSearchUrl(listing.teslaCode || "m3");
  }
  const code = listing.teslaCode || "m3";
  const vin = listing.vin;
  if (vin) return `https://www.tesla.com/${code}/order/${encodeURIComponent(vin)}`;
  return teslaUsedSearchUrl(code);
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

export function yearBounds(listings) {
  if (!listings.length) return { min: 2018, max: new Date().getFullYear() };
  const years = listings.map((l) => l.year);
  return { min: Math.min(...years), max: Math.max(...years) };
}
