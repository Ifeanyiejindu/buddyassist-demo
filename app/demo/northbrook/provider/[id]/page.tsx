import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchNorthbrookAvailability,
  fetchNorthbrookProviders,
} from "@/lib/demoApi";

/**
 * Northbrook provider profile page.
 *
 * Reached from a care-team card on the storefront. Shows the provider's
 * bio + accepting status, plus the next available slots for today
 * pulled from the live availability endpoint. Helps visitors see real
 * scheduling depth without committing to a booking.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowIso(): string {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtSlot(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function NorthbrookProviderPage({ params }: PageProps) {
  const { id } = await params;
  const providers = await fetchNorthbrookProviders();
  const provider = providers.find((p) => p.providerId === id);
  if (!provider) return notFound();

  const [todaySlots, tomorrowSlots] = await Promise.all([
    fetchNorthbrookAvailability(id, todayIso()),
    fetchNorthbrookAvailability(id, tomorrowIso()),
  ]);

  const sameSpecialty = providers
    .filter((p) => p.specialty === provider.specialty && p.providerId !== provider.providerId)
    .slice(0, 3);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F5F8FA",
        color: "#0E2A3F",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="px-6 sm:px-10 py-4 border-b border-[#E3E7EA] bg-white flex items-center gap-4">
        <Link
          href="/demo/northbrook"
          className="text-[13px] text-[#5F7282] no-underline hover:text-[#0E2A3F] inline-flex items-center gap-1.5"
        >
          ← Northbrook
        </Link>
        <span className="text-[12px] text-[#5F7282]">/</span>
        <span className="text-[13px]">{provider.specialty}</span>
        <span className="text-[12px] text-[#5F7282]">/</span>
        <span className="text-[13px]">{provider.name}</span>
      </header>

      {/* Hero */}
      <section className="max-w-[1000px] mx-auto px-6 sm:px-10 pt-12 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="text-[11.5px] uppercase tracking-[0.12em] text-[#2F6D8C] mb-3">
            {provider.specialty}
          </div>
          <h1
            className="font-medium m-0 leading-tight"
            style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(36px,4.5vw,52px)" }}
          >
            {provider.name}
          </h1>
          <p className="text-[16px] leading-[1.55] text-[#3A4C5C] max-w-[60ch] mt-4 m-0">
            {provider.bio}
          </p>
          <div className="mt-5 text-[13px]">
            <span
              className="inline-block px-3 py-1.5 rounded-full"
              style={{
                background: provider.acceptingNewPatients ? "rgba(47,196,99,0.12)" : "rgba(229,92,92,0.12)",
                color: provider.acceptingNewPatients ? "#1E9E4B" : "#C2453D",
              }}
            >
              {provider.acceptingNewPatients ? "Accepting new patients" : "Established patients only"}
            </span>
          </div>
        </div>

        {/* Booking aside */}
        <aside className="bg-white border border-[#E3E7EA] rounded-[14px] p-5 flex flex-col gap-3">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5F7282]">
            Next availability
          </div>

          <div>
            <div className="text-[11.5px] text-[#5F7282] mb-1.5">Today</div>
            {todaySlots.length === 0 ? (
              <div className="text-[12.5px] text-[#5F7282] italic">No same-day slots left.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {todaySlots.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-md bg-[#EAF2F6] text-[#2F6D8C] text-[12px] font-medium"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                  >
                    {fmtSlot(s)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11.5px] text-[#5F7282] mb-1.5 mt-2">Tomorrow</div>
            {tomorrowSlots.length === 0 ? (
              <div className="text-[12.5px] text-[#5F7282] italic">No openings.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tomorrowSlots.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-md bg-[#EAF2F6] text-[#2F6D8C] text-[12px] font-medium"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                  >
                    {fmtSlot(s)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/demo/northbrook"
            className="mt-2 px-3.5 py-2.5 rounded-lg text-white text-[13px] font-medium text-center no-underline"
            style={{ background: "#0E2A3F" }}
          >
            Book with Buddy
          </Link>
        </aside>
      </section>

      {/* Same-specialty rail */}
      {sameSpecialty.length > 0 && (
        <section className="max-w-[1000px] mx-auto px-6 sm:px-10 pb-16">
          <h2 className="m-0 mb-4 font-medium text-[20px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Other {provider.specialty} providers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sameSpecialty.map((p) => (
              <Link
                key={p.providerId}
                href={`/demo/northbrook/provider/${p.providerId}`}
                className="bg-white border border-[#E3E7EA] rounded-[12px] p-4 no-underline text-inherit hover:-translate-y-0.5 transition-transform flex flex-col gap-1"
              >
                <div className="font-medium text-[14.5px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                  {p.name}
                </div>
                <div className="text-[11.5px] text-[#5F7282]">
                  {p.acceptingNewPatients ? "Accepting" : "Established only"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
