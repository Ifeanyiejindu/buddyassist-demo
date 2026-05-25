import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchKeystoneListing,
  fetchKeystoneNeighborhood,
  fetchKeystoneViewingSlots,
} from "@/lib/demoApi";

/**
 * Keystone listing detail page.
 *
 * Reached from a card on the storefront, or anywhere the AI cites a
 * listing. Everything — specs, agent, viewing slots, neighborhood
 * walkability + comparables — comes from the live Keystone API.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtPrice(n: number): string {
  if (!n) return "Price on request";
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`
    : `$${(n / 1_000).toFixed(0)}K`;
}

function fmtSlot(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default async function KeystoneListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchKeystoneListing(id);
  if (!listing) return notFound();

  const [slots, neighborhood] = await Promise.all([
    fetchKeystoneViewingSlots(id),
    fetchKeystoneNeighborhood(listing.neighborhood),
  ]);

  // Group slots into the first 2 days for the "Next available" strip.
  const grouped: Record<string, { time: string; iso: string }[]> = {};
  for (const iso of slots) {
    const { day, time } = fmtSlot(iso);
    grouped[day] = grouped[day] || [];
    if (grouped[day].length < 4) grouped[day].push({ time, iso });
  }
  const dayGroups = Object.entries(grouped).slice(0, 2);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F8F6F0",
        color: "#1A1A1A",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-4 border-b border-[#E1DCCF] bg-[#F8F6F0] flex items-center gap-4">
        <Link
          href="/demo/keystone"
          className="text-[13px] text-[#5E6B78] no-underline hover:text-[#1A1A1A] inline-flex items-center gap-1.5"
        >
          ← Keystone
        </Link>
        <span className="text-[12px] text-[#5E6B78]">/</span>
        <span className="text-[13px] text-[#1A1A1A]">{listing.neighborhood}</span>
        <span className="text-[12px] text-[#5E6B78]">/</span>
        <span className="text-[13px] text-[#1A1A1A]">{listing.address}</span>
      </header>

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-10 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              listing.image ||
              "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=70"
            }
            alt={listing.address}
            className="w-full aspect-[16/10] object-cover rounded-2xl"
            style={{ boxShadow: "0 18px 40px rgba(31,77,62,0.10)" }}
          />
          <div className="mt-6">
            <h1
              className="font-semibold leading-none m-0 -tracking-[0.02em]"
              style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "clamp(28px,3.8vw,40px)" }}
            >
              {listing.title}
            </h1>
            <p className="text-[15px] text-[#3A3A3A] mt-2">
              {listing.address} · <b className="text-[#1F4D3E]">{listing.neighborhood}</b>
            </p>
            <div className="flex gap-4 mt-4 text-[14px]">
              <span><b>{listing.beds}</b> beds</span>
              <span>·</span>
              <span><b>{listing.baths}</b> baths</span>
              <span>·</span>
              <span><b>{listing.sqft.toLocaleString()}</b> sqft</span>
              <span>·</span>
              <span className="capitalize">{listing.propertyType}</span>
            </div>
            {listing.transitNote && (
              <div className="mt-4 px-3 py-2 italic text-[13px] rounded" style={{ background: "rgba(31,77,62,0.06)", borderLeft: "2px solid #1F4D3E", color: "#143329" }}>
                {listing.transitNote}
              </div>
            )}
          </div>
        </div>

        {/* Sticky-feel sidebar: price + agent + viewing slots */}
        <aside className="flex flex-col gap-5">
          <div className="bg-white border border-[#E1DCCF] rounded-[14px] p-5">
            <div className="font-semibold text-[28px] -tracking-[0.01em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              {fmtPrice(listing.price)}
            </div>
            {listing.minOffer && (
              <div className="text-[12px] text-[#5E6B78] mt-1">
                Min offer accepted: <b className="text-[#1A1A1A]">{fmtPrice(listing.minOffer)}</b>
              </div>
            )}
            {listing.agent && (
              <div className="mt-4 pt-4 border-t border-[#E1DCCF] flex flex-col gap-1">
                <div className="text-[11px] uppercase tracking-[0.1em] text-[#5E6B78]">Listing agent</div>
                <div className="font-medium text-[15px]">{listing.agent.name}</div>
                <div className="text-[12px] text-[#5E6B78]">
                  ★ {listing.agent.rating?.toFixed(1) || "—"} · {listing.agent.phone}
                </div>
              </div>
            )}
          </div>

          {/* Next viewings */}
          <div className="bg-white border border-[#E1DCCF] rounded-[14px] p-5">
            <h3 className="font-medium m-0 text-[15px] mb-3">Book a viewing</h3>
            {dayGroups.length === 0 ? (
              <div className="text-[13px] text-[#5E6B78]">
                Ask Buddy or the agent to schedule a private viewing.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dayGroups.map(([day, times]) => (
                  <div key={day}>
                    <div className="text-[11.5px] uppercase tracking-[0.1em] text-[#5E6B78] mb-1.5">
                      {day}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {times.map((t) => (
                        <span
                          key={t.iso}
                          className="px-2.5 py-1 rounded text-[12.5px] border border-[#1F4D3E]/30 text-[#1F4D3E] bg-[#1F4D3E]/5 cursor-default"
                          style={{ fontFamily: "var(--font-mono), monospace" }}
                        >
                          {t.time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* Neighborhood block */}
      {neighborhood && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
          <h2
            className="font-medium m-0 mb-5 text-[22px]"
            style={{ fontFamily: "var(--font-geist), sans-serif" }}
          >
            About {neighborhood.name}, {neighborhood.city}
          </h2>
          <p className="text-[15px] text-[#3A3A3A] max-w-[60ch] m-0">
            {neighborhood.summary}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { l: "Median price", v: fmtPrice(neighborhood.medianPriceUsd) },
              { l: "Walk score", v: `${neighborhood.walkScore} / 100` },
              { l: "Transit score", v: `${neighborhood.transitScore} / 100` },
              { l: "Active listings", v: String(neighborhood.activeListings) },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-white border border-[#E1DCCF] rounded-[12px] p-3.5"
              >
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5E6B78]">{s.l}</div>
                <div className="font-semibold text-[18px] mt-1" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          {/* Comparables */}
          {neighborhood.comparables?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium m-0 text-[15px] mb-3">Recently sold nearby</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {neighborhood.comparables.map((c, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 bg-white border border-[#E1DCCF] rounded-[12px] flex items-center justify-between"
                  >
                    <div className="text-[13.5px]">
                      <div className="font-medium">{c.address}</div>
                      <div className="text-[11.5px] text-[#5E6B78]">{c.beds} bed</div>
                    </div>
                    <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                      {fmtPrice(c.soldUsd)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
