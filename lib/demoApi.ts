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
