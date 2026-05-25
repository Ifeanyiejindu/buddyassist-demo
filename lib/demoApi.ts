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
