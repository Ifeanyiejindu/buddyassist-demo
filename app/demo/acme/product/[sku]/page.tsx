import Link from "next/link";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { AcmeCartIcon } from "@/components/acme/AcmeCartIcon";
import { AddToCartButton } from "@/components/acme/AddToCartButton";
import { fetchAcmeProduct, fetchAcmeProducts } from "@/lib/demoApi";

const SYSTEM_PROMPT = `
You are Buddy, the in-store assistant for Acme — a slow-goods home store (pottery, linens, kitchen, lighting).
Shipping: free over $75; in-stock items ship within 24h; standard 2-5 business days domestic. Returns: 60 days, free, door pickup.
You can recommend items, suggest pairings, give care advice, estimate shipping windows, and explain returns. You cannot place orders or charge cards.
When recommending, name 1-3 specific items with prices. Keep replies short and warm.
`.trim();

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const product = await fetchAcmeProduct(sku);
  return { title: product ? `${product.name} — Acme Store` : "Acme Store" };
}

export default async function AcmeProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const [product, all] = await Promise.all([fetchAcmeProduct(sku), fetchAcmeProducts()]);

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#FAF8F4", color: "#191815", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <header className="border-b border-[#E8E3D9] bg-[#FAF8F4] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-7 py-4.5 flex items-center justify-between">
          <Link href="/demo/acme" className="font-serif text-[28px] -tracking-[0.02em] no-underline text-inherit">
            acme<span className="text-[#C8553D]">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/demo/acme" className="text-[13px] text-[#8A847A] no-underline hover:text-[#191815]">
              ← Back to shop
            </Link>
            <AcmeCartIcon />
          </div>
        </div>
      </header>
      {children}
      <FloatingChat
        systemPrompt={SYSTEM_PROMPT}
        brand="Acme Assistant"
        greeting="Questions about this piece?"
        introLines={["Hi — ask me about this product, shipping, returns, or anything else."]}
        suggests={[
          { pill: "Ship", text: `When would ${product?.name || "this"} arrive in NYC?` },
          { pill: "Care", text: `How do I care for ${product?.name || "this item"}?` },
          { pill: "Match", text: `What pairs well with the ${product?.name || "this item"}?` },
        ]}
        catalog={all.map((p) => ({
          name: p.name,
          price: `$${p.price}`,
          sub: p.description,
          image: p.image,
          href: `/demo/acme/product/${p.sku}`,
        }))}
        industrySlug="acme"
      />
      <IndustrySwitcher currentSlug="acme" />
    </div>
  );

  if (!product) {
    return shell(
      <section className="max-w-[680px] mx-auto px-7 py-32 text-center">
        <h1 className="font-serif text-[40px] m-0 mb-3">Piece not found</h1>
        <p className="text-[#8A847A] mb-6">We couldn&apos;t find a product with SKU “{sku}”.</p>
        <Link
          href="/demo/acme"
          className="inline-block px-5 py-3 bg-[#191815] text-[#FAF8F4] rounded-full text-[13px] font-medium no-underline"
        >
          Browse the shop
        </Link>
      </section>,
    );
  }

  const rating = Math.round(product.rating || 0);
  const related = all.filter((p) => p.category === product.category && p.sku !== product.sku).slice(0, 4);

  return shell(
    <>
      <section className="max-w-[1280px] mx-auto px-7 pt-10 pb-16 grid md:grid-cols-2 gap-12 w-full">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-[#F1ECE0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-[11px] tracking-[0.16em] uppercase text-[#9A3F2C] font-medium">
            {product.category}
          </div>
          <h1 className="font-serif text-[clamp(34px,4vw,52px)] font-normal -tracking-[0.02em] my-3">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-semibold text-[24px]">${product.price}.00</span>
            <span className="text-[#C8553D] text-sm">
              {"★".repeat(rating)}
              <span className="text-[#D8D2C6]">{"★".repeat(5 - rating)}</span>
            </span>
            <span className="text-[12px] text-[#8A847A]">{product.rating?.toFixed(1)}</span>
          </div>
          <p className="text-[#5A554C] text-[16px] leading-[1.6] mb-6">{product.description}</p>

          <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px] border-t border-[#E8E3D9] pt-5 mb-6">
            <div>
              <dt className="text-[#8A847A] uppercase tracking-[0.08em] text-[10.5px] mb-0.5">Material</dt>
              <dd className="m-0 font-medium">{product.material || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A847A] uppercase tracking-[0.08em] text-[10.5px] mb-0.5">SKU</dt>
              <dd className="m-0 font-medium">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-[#8A847A] uppercase tracking-[0.08em] text-[10.5px] mb-0.5">Availability</dt>
              <dd className="m-0 font-medium">
                {product.stock > 0 ? `In stock — ${product.stock} available` : "Sold out"}
              </dd>
            </div>
            <div>
              <dt className="text-[#8A847A] uppercase tracking-[0.08em] text-[10.5px] mb-0.5">Shipping</dt>
              <dd className="m-0 font-medium">{product.price >= 75 ? "Free shipping" : "Flat $6.95"}</dd>
            </div>
          </dl>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-7">
              {product.tags.map((t) => (
                <span key={t} className="text-[11px] bg-[#F1ECE0] text-[#5A554C] px-2.5 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 flex-wrap mt-auto">
            <AddToCartButton
              sku={product.sku}
              name={product.name}
              price={product.price}
              image={product.image}
              outOfStock={product.stock === 0}
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent text-[#191815] border border-[#191815] rounded-full font-medium text-[13px] cursor-pointer hover:-translate-y-px transition-transform"
            >
              ♡ Save
            </button>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-7 pb-20 w-full">
          <h2 className="font-serif text-[28px] font-normal -tracking-[0.02em] border-b border-[#E8E3D9] pb-3.5 mb-6">
            More in {product.category}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <Link
                key={p.sku}
                href={`/demo/acme/product/${p.sku}`}
                className="flex flex-col gap-2 no-underline text-inherit group"
              >
                <div className="aspect-[0.85] rounded-lg overflow-hidden bg-[#F1ECE0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="font-serif text-[16px]">{p.name}</span>
                  <span className="font-semibold text-[13px]">${p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="px-7 py-10 border-t border-[#E8E3D9] text-xs text-[#8A847A] mt-auto">
        <div className="max-w-[1280px] mx-auto flex justify-between flex-wrap gap-3.5">
          <span>© 2026 Acme — Demo storefront powered by Buddy Assist.</span>
          <span>Care · Shipping · Returns · Press</span>
        </div>
      </footer>
    </>,
  );
}
