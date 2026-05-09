"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const COPY = [
  {
    tag: "§ 01 / The problem",
    h: "Most data is",
    em: "dormant",
    p: "Spreadsheets, PDFs, warehouse tables, support tickets, internal docs. Sitting on shelves. Asked once a quarter. Buried under tabs no one opens.",
  },
  {
    tag: "§ 02 / The wiring",
    h: "Buddy connects",
    em: "everything",
    p: "One agent. Read access to your sources — sheets, warehouses, docs, CRMs, product telemetry, knowledge bases. We don't move your data. We learn it.",
  },
  {
    tag: "§ 03 / The conversation",
    h: "Then your team",
    em: "asks",
    p: "Plain English. Real specifics. Every reply cites the exact source so trust is earned, not assumed. The shelf becomes a colleague.",
  },
  {
    tag: "§ 04 / The surface",
    h: "Wherever your",
    em: "users live",
    p: "Drop Buddy into a checkout, a clinic portal, a booking flow, a marketing dashboard, a phone call. Same brain, different skin. Native to every product.",
  },
];

const FILE_LABELS = [
  "Q3-revenue.csv","cohorts.sql","tickets.json","prd.md","sessions.log",
  "invoice-2024.pdf","kpi-deck.key","run.ipynb","handbook.md","feedback.db",
  "retention.csv","ads.json","tour.mov","forecast.xlsx","emails.eml",
  "schema.dbml","crm-export.csv","release.md","onboarding.fig","payments.parquet",
];

export function StickyNarrative() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    function tick() {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-r.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      setIdx(Math.min(3, Math.floor(p * 4)));
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="how"
      className="relative max-w-[1280px] mx-auto px-7 min-h-[240vh] md:min-h-[240vh]"
    >
      <div className="sticky top-[88px] h-[calc(100vh-88px)] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center">
        {/* Copy column */}
        <div className="relative">
          {COPY.map((c, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-[550ms] ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="font-mono text-[11px] text-green-deep tracking-[0.14em] uppercase mb-[18px]">
                {c.tag}
              </div>
              <h3 className="font-grotesk font-medium text-[clamp(36px,4.4vw,56px)] leading-none -tracking-[0.025em] m-0 mb-4">
                {c.h} <em className="not-italic text-green-deep">{c.em}</em>.
              </h3>
              <p className="text-[17px] text-mute max-w-[42ch] leading-[1.55] m-0">
                {c.p}
              </p>
            </div>
          ))}
        </div>

        {/* Visual column */}
        <div className="relative h-[540px] max-h-[72vh] border border-line bg-bg-soft rounded-md overflow-hidden">
          {/* Stage 1 — dormant data tiles */}
          <div
            className={`absolute inset-0 transition-opacity duration-[550ms] p-9 grid grid-cols-5 grid-rows-4 gap-2 ${
              idx === 0 ? "opacity-100" : "opacity-0"
            }`}
          >
            {FILE_LABELS.map((l) => (
              <div
                key={l}
                className="bg-card border border-line rounded p-2 font-mono text-[8px] text-mute overflow-hidden leading-[1.4]"
              >
                <div className="h-[5px] bg-ink mb-1.5" />
                {l}
              </div>
            ))}
          </div>

          {/* Stage 2 — connected with rings */}
          <div
            className={`absolute inset-0 transition-opacity duration-[550ms] ${
              idx === 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute w-[80%] aspect-square border border-dashed border-green rounded-full opacity-50"
              style={{
                top: "50%",
                right: "50%",
                transform: "translate(50%,-50%)",
                animation: "ba-spin 38s linear infinite reverse",
              }}
            />
            <div
              className="absolute w-[60%] aspect-square border border-dashed border-green rounded-full"
              style={{
                top: "50%",
                right: "50%",
                transform: "translate(50%,-50%)",
                animation: "ba-spin 26s linear infinite",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-green rounded-full grid place-items-center"
              style={{ boxShadow: "0 0 0 12px rgba(47,196,99,0.18)" }}
            >
              <Image src="/assets/ba-icon-white.png" alt="" width={40} height={40} className="w-1/2" />
            </div>
            {[
              { k: "crm.contacts", style: { top: "14%", left: "10%" } },
              { k: "orders.csv", style: { top: "22%", right: "8%" } },
              { k: "support.kb", style: { bottom: "18%", left: "14%" } },
              { k: "warehouse.sql", style: { bottom: "14%", right: "14%" } },
              { k: "docs/policies", style: { top: "50%", left: "6%" } },
              { k: "events.stream", style: { top: "48%", right: "6%" } },
            ].map((n) => (
              <div
                key={n.k}
                className="absolute px-2.5 py-1.5 bg-card border border-line font-mono text-[10px] rounded-full text-ink flex items-center gap-1.5"
                style={n.style}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                {n.k}
              </div>
            ))}
          </div>

          {/* Stage 3 — chat reply */}
          <div
            className={`absolute inset-0 transition-opacity duration-[550ms] p-8 flex flex-col justify-end gap-3 ${
              idx === 2 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="max-w-[80%] self-end bg-ink text-on-ink px-4 py-3.5 rounded-2xl rounded-br text-sm leading-[1.5]">
              Why did Q3 churn spike on the Pro plan?
            </div>
            <div className="max-w-[80%] self-start bg-card border border-line text-ink px-4 py-3.5 rounded-2xl rounded-bl text-sm leading-[1.5]">
              Pro churn rose from <b>3.1% → 5.4%</b> in Q3, almost entirely from accounts that hit a usage cap and didn&apos;t auto-upgrade. The new cap-modal shipped Aug 14 — churn lifts the next day.
              <div className="mt-2 pt-2 border-t border-line font-mono text-[9.5px] text-mute flex gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 bg-green-tint text-green-deep rounded-sm">billing.events</span>
                <span className="px-1.5 py-0.5 bg-green-tint text-green-deep rounded-sm">cohort_q3.sql</span>
                <span className="px-1.5 py-0.5 bg-green-tint text-green-deep rounded-sm">release-notes.md</span>
              </div>
            </div>
            <div className="self-start bg-card border border-line px-3.5 py-3 rounded-2xl rounded-bl flex gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: ".15s" }} />
              <span className="typing-dot" style={{ animationDelay: ".3s" }} />
            </div>
          </div>

          {/* Stage 4 — many surfaces */}
          <div
            className={`absolute inset-0 transition-opacity duration-[550ms] p-8 grid grid-cols-3 grid-rows-2 gap-3 ${
              idx === 3 ? "opacity-100" : "opacity-0"
            }`}
          >
            {[
              { lbl: "Web · floating", cls: "bg-card text-ink" },
              { lbl: "App · panel", cls: "bg-green text-ink" },
              { lbl: "Voice · call", cls: "bg-ink text-white" },
              { lbl: "Inline · contextual", cls: "bg-ink text-white" },
              { lbl: "Top-bar · slide", cls: "bg-card text-ink" },
              { lbl: "Full-screen", cls: "bg-green text-ink" },
            ].map((m, i) => (
              <div
                key={i}
                className={`border border-line rounded p-2.5 flex flex-col gap-1.5 overflow-hidden relative ${m.cls}`}
              >
                <span className="font-mono text-[9px] tracking-[0.08em] uppercase opacity-80">{m.lbl}</span>
                <div className="flex-1 rounded-sm bg-bg-soft/30" />
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border border-line transition-all duration-300"
                style={{
                  background: idx === i ? "var(--green)" : "var(--line)",
                  transform: idx === i ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
