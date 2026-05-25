import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOlivettaDish, fetchOlivettaMenu } from "@/lib/demoApi";

/**
 * Olivetta dish detail page.
 *
 * Reached from a dish card on the main menu, or anywhere Renata
 * suggests a specific item. Everything — description, allergens,
 * dietary flags, the wine pairings — comes from the live Olivetta
 * API. The "Similar dishes" strip filters by course so visitors can
 * keep exploring the same section.
 */
interface PageProps {
  params: Promise<{ itemId: string }>;
}

export default async function OlivettaDishPage({ params }: PageProps) {
  const { itemId } = await params;

  const dish = await fetchOlivettaDish(itemId);
  if (!dish) return notFound();

  // Pull the same-course dishes for the "Other <course>" strip — gives
  // the visitor a natural next click without polluting the page with
  // the full menu.
  const sameCourse = await fetchOlivettaMenu({ course: dish.course });
  const others = sameCourse
    .filter((d) => d.itemId !== dish.itemId && d.available !== false)
    .slice(0, 4);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#FAF7EE",
        color: "#1A1410",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-4 border-b border-[#E2D6BD] flex items-center gap-4 bg-[#FAF7EE]">
        <Link
          href="/demo/olivetta"
          className="text-[13px] text-[#7A6E5B] no-underline hover:text-[#1A1410] inline-flex items-center gap-1.5"
        >
          ← Olivetta
        </Link>
        <span className="text-[12px] text-[#7A6E5B]">/</span>
        <span className="text-[13px] text-[#1A1410] capitalize">{dish.course}</span>
        <span className="text-[12px] text-[#7A6E5B]">/</span>
        <span className="text-[13px] text-[#1A1410]">{dish.name}</span>
      </header>

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-10 pb-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              dish.image ||
              "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=70"
            }
            alt={dish.name}
            className="w-full aspect-[4/3] object-cover rounded-2xl"
            style={{ boxShadow: "0 18px 40px rgba(63,78,42,0.10)" }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#7A6E5B] font-medium">
            <span className="capitalize">{dish.course}</span>
            {dish.isSpecial && (
              <>
                <span>·</span>
                <span className="text-[#B5531C]">Chef special</span>
              </>
            )}
            {dish.popular && (
              <>
                <span>·</span>
                <span className="text-[#3F4E2A]">Popular</span>
              </>
            )}
          </div>
          <h1
            className="font-medium leading-none m-0"
            style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(36px,5vw,56px)" }}
          >
            {dish.name}
          </h1>
          <p className="text-[16px] leading-[1.55] text-[#3A3530] max-w-[52ch] m-0">
            {dish.description}
          </p>
          <div className="font-medium text-[20px] text-[#1A1410]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            ${dish.price}
          </div>

          {/* Diet + allergen badges */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(dish.dietary || []).map((d) => (
              <span
                key={d}
                className="text-[10.5px] tracking-[0.06em] uppercase px-2 py-1 rounded-sm font-medium"
                style={{
                  background: d === "gluten-free" ? "rgba(194,150,53,0.18)" : "rgba(63,78,42,0.12)",
                  color: "#2C3A1B",
                }}
              >
                {d}
              </span>
            ))}
            {(dish.allergens || []).map((a) => (
              <span
                key={a}
                className="text-[10.5px] tracking-[0.06em] uppercase px-2 py-1 rounded-sm font-medium"
                style={{ background: "rgba(181,83,28,0.10)", color: "#B5531C" }}
              >
                contains {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pairings */}
      {dish.pairings && dish.pairings.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-12">
          <h2
            className="font-medium m-0 mb-5 text-[26px]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Renata&apos;s pairings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dish.pairings.map((p, i) => (
              <article
                key={i}
                className="p-5 bg-white border border-[#E2D6BD] rounded-[14px] flex flex-col gap-1.5"
              >
                {p.wine && (
                  <h3
                    className="font-medium m-0 text-[18px]"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {p.wine}
                  </h3>
                )}
                {p.region && (
                  <div className="text-[12px] uppercase tracking-[0.1em] text-[#7A6E5B]">
                    {p.region}
                  </div>
                )}
                {p.why && (
                  <p className="text-[14px] leading-[1.55] text-[#3A3530] m-0 mt-1">
                    {p.why}
                  </p>
                )}
                {p.side && (
                  <div className="text-[12.5px] text-[#7A6E5B] mt-1">
                    With <b className="text-[#1A1410]">{p.side}</b>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Other dishes in the same course */}
      {others.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
          <h2
            className="font-medium m-0 mb-5 text-[22px] capitalize"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Other {dish.course}s
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {others.map((d) => (
              <Link
                key={d.itemId}
                href={`/demo/olivetta/menu/${d.itemId}`}
                className="bg-white border border-[#E2D6BD] rounded-[14px] overflow-hidden no-underline text-inherit flex flex-col hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(63,78,42,0.10)] transition-all"
              >
                {d.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={d.image} alt={d.name} className="w-full aspect-[4/3] object-cover" />
                )}
                <div className="p-3 flex flex-col gap-1">
                  <div className="font-medium text-[14px] leading-tight" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                    {d.name}
                  </div>
                  <div className="text-[12px] text-[#7A6E5B]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                    ${d.price}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
