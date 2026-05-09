import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { HeroWords } from "@/components/home/HeroWords";
import { HeroOrb } from "@/components/home/HeroOrb";
import { StickyNarrative } from "@/components/home/StickyNarrative";
import { Reveal } from "@/components/home/Reveal";
import { INDUSTRIES } from "@/lib/industries";

const TICKER_ITEMS = [
  "Answers, not dashboards",
  "Cited every time",
  "Plug into your data",
  "Pick your surface",
  "One agent, every team",
  "Helpful before clever",
];

const SURFACES = [
  { nm: "Floating bubble", tag: "E-commerce · Real estate" },
  { nm: "Side panel", tag: "Support · Banking" },
  { nm: "Full-screen", tag: "Booking · Education" },
  { nm: "Top-bar slide", tag: "Marketing" },
  { nm: "Voice / call", tag: "Healthcare" },
  { nm: "Inline / contextual", tag: "Restaurant" },
];

export default function Home() {
  return (
    <>
      <TopNav variant="home" />
      <main id="top" className="flex-1">
        {/* HERO */}
        <section className="relative max-w-[1280px] mx-auto px-7 pt-[140px] pb-20 min-h-[92vh] flex flex-col justify-center">
          <div className="font-mono text-[11px] text-mute tracking-[0.14em] uppercase mb-7 inline-flex items-center gap-2.5">
            <span className="live-dot" />
            <span>Live demo · Vol. 01 · 2026</span>
          </div>

          <HeroWords />

          <p
            className="mt-8 max-w-[54ch] text-[19px] text-mute leading-[1.5] opacity-0"
            style={{ animation: "ba-rise 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.9s forwards" }}
          >
            Buddy Assist is an agent platform that turns spreadsheets, docs, and product telemetry into a buddy you can ask. No dashboards. No queries. Just answers.
          </p>

          <div
            className="mt-9 flex gap-3 flex-wrap opacity-0"
            style={{ animation: "ba-rise 0.8s cubic-bezier(0.2,0.8,0.2,1) 1.05s forwards" }}
          >
            <a href="#industries" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green text-ink no-underline font-grotesk text-[13px] font-medium transition-transform hover:-translate-y-px">
              <span className="w-1.5 h-1.5 rounded-full bg-ink" style={{ boxShadow: "0 0 0 3px rgba(0,0,0,0.18)" }} />
              See it in 9 industries
            </a>
            <a href="#how" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-transparent text-ink border border-line no-underline font-grotesk text-[13px] font-medium transition-transform hover:-translate-y-px">
              How it works ↓
            </a>
          </div>

          <div
            className="mt-auto pt-12 flex justify-between flex-wrap gap-5 border-t border-line opacity-0"
            style={{ animation: "ba-rise 0.8s ease 1.4s forwards" }}
          >
            {[
              { v: "9", l: "Industries shipped" },
              { v: "6", l: "Chat surfaces" },
              { v: "∞", l: "Data sources" },
              { v: "1", l: "Buddy" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col gap-1">
                <span className="font-grotesk text-[32px] font-medium -tracking-[0.02em] leading-none">
                  {s.v}
                </span>
                <span className="text-[11px] tracking-[0.12em] uppercase text-mute">{s.l}</span>
              </div>
            ))}
          </div>

          <HeroOrb />
        </section>

        {/* TICKER */}
        <section className="border-y border-line bg-bg-soft overflow-hidden py-[18px]">
          <div className="flex gap-16 items-center whitespace-nowrap animate-marquee font-grotesk font-medium text-[18px] -tracking-[0.01em]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((s, i) => (
              <span key={i} className="inline-flex items-center gap-3.5 text-ink">
                {s}
                <span className="text-green text-[10px]">✦</span>
              </span>
            ))}
          </div>
        </section>

        {/* STICKY NARRATIVE */}
        <StickyNarrative />

        {/* SURFACES */}
        <section className="px-7 py-[120px] max-w-[1280px] mx-auto" id="surfaces">
          <Reveal>
            <div className="font-mono text-[11px] text-green-deep tracking-[0.14em] uppercase">§ 03 / Surfaces</div>
            <h2 className="font-grotesk font-medium leading-none -tracking-[0.03em] m-0 mt-3.5 mb-5 text-[clamp(40px,5.6vw,72px)] max-w-[18ch]">
              Six ways Buddy <em className="not-italic text-green-deep">shows up</em>.
            </h2>
            <p className="text-[18px] text-mute max-w-[54ch] leading-[1.5] m-0">
              Same brain — pick the surface that fits your product. Each demo below uses one, so you can feel the differences.
            </p>
          </Reveal>

          <Reveal className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {SURFACES.map((s, i) => (
              <div
                key={s.nm}
                className="aspect-[0.78] border border-line bg-card p-[18px] flex flex-col gap-3.5 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="flex-1 bg-bg-soft rounded-sm relative overflow-hidden">
                  {i === 0 && (
                    <div
                      className="absolute right-2 bottom-2 w-[38px] h-[38px] rounded-full bg-green grid place-items-center text-ink font-grotesk font-bold"
                      style={{ boxShadow: "0 6px 16px rgba(47,196,99,0.4)" }}
                    >
                      B
                    </div>
                  )}
                  {i === 1 && (
                    <div className="absolute inset-0 flex">
                      <div className="flex-[2] bg-white" />
                      <div className="flex-1 bg-ink" />
                    </div>
                  )}
                  {i === 2 && (
                    <div className="absolute inset-0 bg-ink">
                      <div className="absolute left-3.5 right-3.5 bottom-3.5 h-6 bg-white rounded-[14px]" />
                    </div>
                  )}
                  {i === 3 && (
                    <div className="absolute inset-x-0 top-0 h-[30%] bg-ink rounded-b-md" />
                  )}
                  {i === 4 && (
                    <div className="absolute inset-0 grid place-items-center bg-green-tint">
                      <div className="w-[50px] h-[50px] rounded-full bg-green text-ink font-grotesk font-bold grid place-items-center text-lg">·</div>
                    </div>
                  )}
                  {i === 5 && (
                    <div className="absolute inset-0 p-2 flex flex-col gap-1">
                      <div className="h-[5px] bg-ink rounded-sm w-3/5" />
                      <div className="h-[5px] bg-mute-2 rounded-sm w-4/5" />
                      <div className="h-[18px] bg-green-tint rounded border-l-2 border-green mt-1.5" />
                      <div className="h-[5px] bg-mute-2 rounded-sm w-7/12" />
                    </div>
                  )}
                </div>
                <div className="font-grotesk text-[13px] font-medium -tracking-[0.005em]">{s.nm}</div>
                <div className="font-mono text-[9.5px] text-mute tracking-[0.08em] uppercase">{s.tag}</div>
              </div>
            ))}
          </Reveal>
        </section>

        {/* INDUSTRIES */}
        <section className="px-7 py-[120px] max-w-[1280px] mx-auto" id="industries">
          <Reveal>
            <div className="font-mono text-[11px] text-green-deep tracking-[0.14em] uppercase">§ 04 / See it in action</div>
            <h2 className="font-grotesk font-medium leading-none -tracking-[0.03em] m-0 mt-3.5 mb-5 text-[clamp(40px,5.6vw,72px)] max-w-[18ch]">
              Nine demos. <em className="not-italic text-green-deep">One Buddy.</em>
            </h2>
            <p className="text-[18px] text-mute max-w-[54ch] leading-[1.5] m-0">
              Each link below is a real, branded site for a fictional company — wired live to Claude. Try a few. The same agent feels native to every one.
            </p>
          </Reveal>

          <Reveal className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {INDUSTRIES.map((ind, i) => (
              <Link
                key={ind.id}
                href={`/demo/${ind.slug}`}
                className="border border-line bg-card flex flex-col text-inherit no-underline relative overflow-hidden transition-all hover:-translate-y-[3px] hover:border-[#d4d4d2] hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.20)] group"
              >
                <div
                  className="industry-cover aspect-[1.6] p-[22px] flex flex-col justify-between relative overflow-hidden"
                  style={ind.coverStyle}
                >
                  <div className="flex justify-between items-center font-mono text-[9.5px] tracking-[0.12em] uppercase opacity-70">
                    <span>{ind.chrome[0]}</span>
                    <span>{ind.chrome[1]}</span>
                  </div>
                  <div className="industry-mark text-[34px] leading-none transition-transform group-hover:-translate-y-0.5">
                    {ind.coverName}
                    <span className="block font-mono font-normal text-[9.5px] tracking-[0.14em] uppercase opacity-60 mt-2.5 leading-[1.4]">
                      {ind.coverSub}
                    </span>
                  </div>
                  <div className="absolute -right-2.5 -bottom-2.5 w-[90px] h-[90px] opacity-35">
                    {ind.glyph}
                  </div>
                </div>
                <div className="px-6 pt-[22px] pb-6 flex flex-col gap-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-mute tracking-[0.08em]">
                      {String(i + 1).padStart(2, "0")} / 09
                    </span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                  <h3 className="font-grotesk text-[22px] font-medium -tracking-[0.02em] m-0 leading-[1.05]">{ind.name}</h3>
                  <p className="text-[13px] text-mute m-0 leading-[1.45]">{ind.tagline}</p>
                  <div className="mt-auto font-mono text-[10px] text-green-deep tracking-[0.1em] uppercase pt-3.5 border-t border-line">
                    {ind.surface}
                  </div>
                </div>
              </Link>
            ))}
          </Reveal>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#0A0A0A] text-white py-[120px] px-7 mt-[120px]">
          <div
            className="absolute -right-[10%] -top-[30%] w-[60vw] max-w-[760px] aspect-square pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(47,196,99,0.30), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
          <div className="max-w-[1280px] mx-auto relative">
            <div className="font-mono text-[11px] text-green tracking-[0.14em] uppercase">§ 05 / Try it</div>
            <h2 className="font-grotesk font-medium -tracking-[0.035em] leading-[0.95] m-0 mt-5 mb-5 max-w-[14ch] text-[clamp(48px,7vw,108px)]">
              Pick a demo. <em className="not-italic text-green">Ask anything.</em>
            </h2>
            <p className="text-white/65 text-[18px] max-w-[48ch] m-0 mb-9">
              Every site below is wired to a live model. The chat is real. The brand is fake. The point is what Buddy can do across surfaces — and how at-home it feels in any of them.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/demo/acme" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green text-ink no-underline font-grotesk text-[13px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" style={{ boxShadow: "0 0 0 3px rgba(0,0,0,0.18)" }} />
                Start with Acme Store
              </Link>
              <a href="#industries" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-transparent text-white border border-white/30 no-underline font-grotesk text-[13px] font-medium">
                Or pick another →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
