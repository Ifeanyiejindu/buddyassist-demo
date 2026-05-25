import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchWayfareDestination,
  fetchWayfarePackages,
  fetchWayfareStays,
} from "@/lib/demoApi";

/**
 * Wayfare destination detail page.
 *
 * Reached from the storefront's sidebar package list, or anywhere the AI
 * suggests a destination. Everything on this page — name, summary,
 * highlights, best seasons, the packages that go there, the available
 * stays — is fetched from the live Wayfare API. No hardcoded copy.
 */
interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function WayfareDestinationPage({ params }: PageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const [destination, packages, stays] = await Promise.all([
    fetchWayfareDestination(upperCode),
    fetchWayfarePackages({ destination: upperCode }),
    fetchWayfareStays(upperCode),
  ]);

  if (!destination) return notFound();

  const cheapest = [...packages].sort((a, b) => a.priceFromUsd - b.priceFromUsd)[0];

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F8F5F0",
        color: "#1A1A1A",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-4 border-b border-[#E5DFD3] flex items-center gap-4 bg-[#F8F5F0]">
        <Link
          href="/demo/wayfare"
          className="text-[13px] text-[#7A736A] no-underline hover:text-[#1A1A1A] inline-flex items-center gap-1.5"
        >
          ← Wayfare
        </Link>
        <span className="text-[12px] text-[#7A736A]">/</span>
        <span className="text-[13px] text-[#1A1A1A]">{destination.name}</span>
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-10 pt-10 pb-12 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2 text-[11.5px] tracking-[0.14em] uppercase text-[#7A736A] mb-3">
          <span>{destination.region}</span>
          <span>·</span>
          <span>{destination.country}</span>
        </div>
        <h1
          className="font-semibold leading-none -tracking-[0.025em] m-0"
          style={{ fontFamily: "var(--font-bricolage), sans-serif", fontSize: "clamp(40px,6vw,72px)" }}
        >
          {destination.name}
        </h1>
        <p className="text-[17px] text-[#3A3A3A] max-w-[60ch] leading-[1.55] mt-5">
          {destination.summary}
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {(destination.tags || []).map((t) => (
            <span
              key={t}
              className="px-3 py-1.5 rounded-full text-[12px] text-[#5A4F3E] bg-[#EBDFCC] capitalize"
            >
              {t}
            </span>
          ))}
        </div>

        {(destination.bestSeasons || []).length > 0 && (
          <div className="mt-5 text-[13px] text-[#7A736A]">
            <b className="text-[#1A1A1A] mr-2">Best in</b>
            {destination.bestSeasons.join(" · ")}
          </div>
        )}
      </section>

      {/* Highlights */}
      {(destination.highlights || []).length > 0 && (
        <section className="px-6 sm:px-10 pb-12 max-w-[1100px] mx-auto">
          <h2
            className="font-semibold m-0 mb-5 text-[24px] -tracking-[0.01em]"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            What to do
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
            {destination.highlights.map((h, i) => (
              <li
                key={i}
                className="px-5 py-4 bg-white border border-[#E5DFD3] rounded-[14px] text-[14.5px] leading-[1.45]"
              >
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Packages */}
      <section className="px-6 sm:px-10 pb-12 max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-semibold m-0 text-[24px] -tracking-[0.01em]"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            Curated packages
          </h2>
          {cheapest && (
            <span className="text-[13px] text-[#7A736A]">
              From <b className="text-[#1A1A1A]">${cheapest.priceFromUsd}</b>
            </span>
          )}
        </div>
        {packages.length === 0 ? (
          <div className="px-5 py-8 text-center text-[14px] text-[#7A736A] bg-white border border-[#E5DFD3] rounded-[14px]">
            No curated packages here yet — ask Buddy to design a custom trip.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((p) => (
              <article
                key={p.packageId}
                className="p-5 bg-white border border-[#E5DFD3] rounded-[14px] flex flex-col gap-2 hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-shadow"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="font-semibold m-0 text-[17px] -tracking-[0.005em]"
                    style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
                  >
                    {p.title}
                  </h3>
                  <span className="font-semibold text-[15px] text-[#C95A3D] flex-shrink-0">
                    ${p.priceFromUsd}
                  </span>
                </div>
                <div className="text-[12.5px] text-[#7A736A]">
                  {p.seatsLeft === 0 ? (
                    <span className="text-[#C95A3D]">Sold out for now</span>
                  ) : p.seatsLeft <= 3 ? (
                    <span>Only {p.seatsLeft} seats left</span>
                  ) : (
                    <span>{p.seatsLeft} seats available</span>
                  )}
                  {p.departures?.length > 0 && (
                    <>
                      <span className="mx-1.5">·</span>
                      Next: {p.departures[0]}
                    </>
                  )}
                </div>
                {p.departures?.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {p.departures.slice(0, 4).map((d) => (
                      <span
                        key={d}
                        className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#F8F5F0] text-[#5A4F3E] border border-[#E5DFD3]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Stays */}
      {stays.length > 0 && (
        <section className="px-6 sm:px-10 pb-16 max-w-[1100px] mx-auto">
          <h2
            className="font-semibold m-0 mb-5 text-[24px] -tracking-[0.01em]"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            Where to stay
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stays.map((s) => (
              <article
                key={s.stayId}
                className="bg-white border border-[#E5DFD3] rounded-[14px] overflow-hidden flex flex-col"
              >
                {s.image && (
                  <div
                    className="aspect-[16/10] bg-[#EBDFCC]"
                    style={{
                      backgroundImage: `url('${s.image}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
                <div className="p-4 flex flex-col gap-1.5">
                  <h3
                    className="font-semibold m-0 text-[15px] -tracking-[0.005em]"
                    style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
                  >
                    {s.name}
                  </h3>
                  <div className="text-[12px] text-[#7A736A] flex items-center gap-1.5">
                    <span className="capitalize">{s.type}</span>
                    <span>·</span>
                    <span>★ {s.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{s.roomsAvailable} rooms</span>
                  </div>
                  <div className="text-[15px] font-semibold mt-1">
                    ${s.pricePerNightUsd}
                    <span className="text-[12px] text-[#7A736A] font-normal"> / night</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
