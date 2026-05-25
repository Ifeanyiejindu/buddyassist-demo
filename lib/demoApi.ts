/**
 * demoApi — server-side fetch helpers for the BuddyAssist demo backend
 * (the same backend Buddy's playbooks call). The demo storefront reads
 * its real catalog from here, so the page, the chat cards, and the
 * product pages all show the actual seeded products and images.
 */
const DEMO_API =
  process.env.DEMO_API_BASE || "https://lionfish-app-ss6rs.ondigitalocean.app/api/v1";
const DEMO_KEY = process.env.DEMO_API_KEY || "buddyassist-demo-key";

export interface AcmeProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  tags: string[];
  material: string;
  stock: number;
  rating: number;
  inStock?: boolean;
  availability?: string;
}

async function demoGet(path: string): Promise<any> {
  const res = await fetch(`${DEMO_API}${path}`, {
    headers: { "x-api-key": DEMO_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`demo API ${res.status}`);
  return res.json();
}

/** Full Acme catalogue — real seeded products with real images. */
export async function fetchAcmeProducts(): Promise<AcmeProduct[]> {
  try {
    const json = await demoGet("/acme/products");
    return (json?.data?.products as AcmeProduct[]) ?? [];
  } catch {
    return [];
  }
}

/** One Acme product by SKU. */
export async function fetchAcmeProduct(sku: string): Promise<AcmeProduct | null> {
  try {
    const json = await demoGet(`/acme/products/${encodeURIComponent(sku)}`);
    return (json?.data as AcmeProduct) ?? null;
  } catch {
    return null;
  }
}

// ── Wayfare (travel) ──────────────────────────────────────────────────────

export interface WfDestination {
  code: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  tags: string[];
  bestSeasons: string[];
  highlights: string[];
  image?: string;
}

export interface WfPackage {
  packageId: string;
  title: string;
  destinationCode: string;
  priceFromUsd: number;
  durationDays?: number;
  seatsLeft: number;
  departures: string[];
  summary?: string;
  image?: string;
}

export interface WfStay {
  stayId: string;
  name: string;
  destinationCode: string;
  type: string;
  pricePerNightUsd: number;
  rating: number;
  roomsAvailable: number;
  image?: string;
}

/** Inspiration grid — every seeded destination. */
export async function fetchWayfareDestinations(): Promise<WfDestination[]> {
  try {
    const json = await demoGet("/wayfare/destinations");
    return (json?.data?.destinations as WfDestination[]) ?? [];
  } catch {
    return [];
  }
}

/** All curated trip packages — used for the "Trip packages" sidebar. */
export async function fetchWayfarePackages(opts?: {
  destination?: string;
  maxBudget?: number;
}): Promise<WfPackage[]> {
  const qs = new URLSearchParams();
  if (opts?.destination) qs.set("destination", opts.destination);
  if (opts?.maxBudget) qs.set("maxBudget", String(opts.maxBudget));
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/wayfare/packages${query}`);
    return (json?.data?.packages as WfPackage[]) ?? [];
  } catch {
    return [];
  }
}

/** Single destination by code — wraps the search endpoint with a code filter. */
export async function fetchWayfareDestination(
  code: string,
): Promise<WfDestination | null> {
  try {
    // Backend filters destinations by `q` (which matches name/country/summary/tags)
    // or `region`. There's no by-code GET, so we fetch all and pick — cheap (~6 rows).
    const all = await fetchWayfareDestinations();
    const match = all.find(
      (d) => d.code.toLowerCase() === code.toLowerCase(),
    );
    return match ?? null;
  } catch {
    return null;
  }
}

/** Available stays for a destination (rooms > 0), sorted by rating. */
export async function fetchWayfareStays(
  destinationCode: string,
  opts?: { maxPrice?: number },
): Promise<WfStay[]> {
  const qs = new URLSearchParams({ destination: destinationCode });
  if (opts?.maxPrice) qs.set("maxPrice", String(opts.maxPrice));
  try {
    const json = await demoGet(`/wayfare/stays?${qs}`);
    return (json?.data?.stays as WfStay[]) ?? [];
  } catch {
    return [];
  }
}

// ── Olivetta (restaurant) ─────────────────────────────────────────────────

export interface OlPairing {
  wine?: string;
  region?: string;
  why?: string;
  side?: string;
}

export interface OlDish {
  itemId: string;
  name: string;
  description: string;
  course: string; // starter | main | pizza | dessert | side
  price: number;
  allergens: string[];
  dietary: string[]; // vegetarian | vegan | gluten-free | dairy-free
  popular: boolean;
  isSpecial: boolean;
  pairings: OlPairing[];
  available: boolean;
  image?: string;
}

export interface OlAvailabilitySlot {
  time: string; // "19:00"
  seatsRemaining: number;
}

export interface OlAvailability {
  date: string;
  partySize: number;
  openSlots: OlAvailabilitySlot[];
}

/** Full menu, optionally filtered by course / dietary on the server. */
export async function fetchOlivettaMenu(opts?: {
  course?: string;
  dietary?: string;
}): Promise<OlDish[]> {
  const qs = new URLSearchParams();
  if (opts?.course) qs.set("course", opts.course);
  if (opts?.dietary) qs.set("dietary", opts.dietary);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/olivetta/menu${query}`);
    // Backend may return menu or dishes — accept both shapes.
    return (json?.data?.menu ||
      json?.data?.dishes ||
      []) as OlDish[];
  } catch {
    return [];
  }
}

/** Tonight's chef specials. */
export async function fetchOlivettaSpecials(): Promise<OlDish[]> {
  try {
    const json = await demoGet("/olivetta/specials");
    return (json?.data?.specials as OlDish[]) ?? [];
  } catch {
    return [];
  }
}

/** Single dish detail (includes its pairings). */
export async function fetchOlivettaDish(itemId: string): Promise<OlDish | null> {
  try {
    const json = await demoGet(`/olivetta/menu/${encodeURIComponent(itemId)}`);
    return (json?.data as OlDish) ?? null;
  } catch {
    return null;
  }
}

/** Available reservation slots for a date + party size. */
export async function fetchOlivettaAvailability(
  date: string,
  partySize: number,
): Promise<OlAvailability | null> {
  const qs = new URLSearchParams({ date, partySize: String(partySize) });
  try {
    const json = await demoGet(`/olivetta/availability?${qs}`);
    return (json?.data as OlAvailability) ?? null;
  } catch {
    return null;
  }
}

// ── Keystone (real estate) ────────────────────────────────────────────────

export interface KsAgent {
  agentId: string;
  name: string;
  phone?: string;
  rating?: number;
  neighborhoods?: string[];
}

export interface KsListing {
  listingId: string;
  title: string;
  propertyType: string; // condo | house | townhouse
  status: string; // active | pending | sold
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  minOffer?: number;
  neighborhood: string;
  nearTransit?: boolean;
  transitNote?: string;
  address: string;
  agentId: string;
  image?: string;
  images?: string[];
  agent?: KsAgent;
}

export interface KsComparable {
  address: string;
  soldUsd: number;
  beds: number;
}

export interface KsNeighborhood {
  name: string;
  city: string;
  summary: string;
  medianPriceUsd: number;
  walkScore: number;
  transitScore: number;
  comparables: KsComparable[];
  activeListings: number;
}

/** All listings, optionally filtered by neighborhood / price range / beds. */
export async function fetchKeystoneListings(opts?: {
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
}): Promise<KsListing[]> {
  const qs = new URLSearchParams();
  if (opts?.neighborhood) qs.set("neighborhood", opts.neighborhood);
  if (opts?.minPrice) qs.set("minPrice", String(opts.minPrice));
  if (opts?.maxPrice) qs.set("maxPrice", String(opts.maxPrice));
  if (opts?.beds) qs.set("beds", String(opts.beds));
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/keystone/listings${query}`);
    return (json?.data?.listings as KsListing[]) ?? [];
  } catch {
    return [];
  }
}

/** Single listing — includes the assigned agent (joined server-side). */
export async function fetchKeystoneListing(id: string): Promise<KsListing | null> {
  try {
    const json = await demoGet(`/keystone/listings/${encodeURIComponent(id)}`);
    return (json?.data as KsListing) ?? null;
  } catch {
    return null;
  }
}

/** Open viewing slots for a listing (next ~2 weeks of working hours). */
export async function fetchKeystoneViewingSlots(id: string): Promise<string[]> {
  try {
    const json = await demoGet(
      `/keystone/listings/${encodeURIComponent(id)}/viewing-slots`,
    );
    return (json?.data?.openSlots as string[]) ?? [];
  } catch {
    return [];
  }
}

/** Neighborhood profile with walkability + comparables. */
export async function fetchKeystoneNeighborhood(
  name: string,
): Promise<KsNeighborhood | null> {
  try {
    const json = await demoGet(
      `/keystone/neighborhoods/${encodeURIComponent(name)}`,
    );
    return (json?.data as KsNeighborhood) ?? null;
  } catch {
    return null;
  }
}
