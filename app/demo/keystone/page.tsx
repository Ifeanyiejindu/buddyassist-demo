"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat, mdInline } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";

const SYSTEM_PROMPT = `
You are the Keystone Realty AI concierge for a Brooklyn home buyer. You help users translate a fuzzy lifestyle ("good school + home office + walkable + under $1.5M") into specific listings, school zones, neighborhood character, and rough mortgage math.
You see these candidate listings: 427 Sackett St #2 Carroll Gardens $1.395M 3BR/2BA 1420sqft (P.S. 58 zone, 7min to F train), 88 Garfield Pl #4B Park Slope $1.450M 2BR+den/2BA 1180sqft (P.S. 321 zone, 4min to Prospect Park), 1612 Caton Ave Kensington $1.280M 3BR/1.5BA 1560sqft (P.S. 230 zone, more sqft per $ but less walkable), 14 Verandah Pl Cobble Hill $1.620M 2BR/2BA, 240 14th St Park Slope South $1.510M 3BR/2BA, 119 Bergen St Boerum Hill $1.340M 2BR/1BA.
Reference Brooklyn neighborhoods accurately. Mention school zones (P.S. 321 is the gold standard), train lines, walk times, vibe (Carroll Gardens = quieter, brownstone, Italian; Park Slope = family, park; Kensington = value play; Cobble Hill = boutique). For mortgage math, assume 6.4% 30-yr unless told otherwise; show monthly P&I clearly.
Do NOT pretend to schedule tours or pull credit. Say "your agent at Keystone can confirm" for those.
Keep answers tight (2-4 short paragraphs). Don't bullet — write conversationally.
`.trim();

const PINS = [
  { top: "36%", left: "22%", price: "$1.45M" },
  { top: "42%", left: "48%", price: "$1.39M", active: true },
  { top: "28%", left: "64%", price: "$1.62M" },
  { top: "55%", left: "38%", price: "$1.28M" },
  { top: "62%", left: "72%", price: "$1.51M" },
  { top: "48%", left: "28%", price: "$1.34M" },
  { top: "32%", left: "56%", price: "$1.78M" },
  { top: "65%", left: "54%", price: "$1.18M" },
];

const AREA_LABELS = [
  { l: "Park Slope", top: "24%", left: "16%" },
  { l: "Carroll Gardens", top: "50%", left: "60%" },
  { l: "Kensington", top: "70%", left: "30%" },
  { l: "Cobble Hill", top: "30%", left: "70%" },
];

const LISTINGS = [
  {
    img: "https://live.staticflickr.com/3902/14996764996_39a7914b96_b.jpg",
    price: "$1,395,000",
    addr: "427 Sackett St, #2 · Carroll Gardens",
    specs: ["3 bed", "2 bath", "1,420 sqft"],
    badge: "Buddy match · 96%",
    why: "Quiet block, P.S. 58 zone (8/10), enclosed back room — works as office. 7-min walk to F train.",
    match: true,
  },
  {
    img: "https://live.staticflickr.com/1267/1196848877_939c62ea72.jpg",
    price: "$1,450,000",
    addr: "88 Garfield Pl, #4B · Park Slope",
    specs: ["2 bed + den", "2 bath", "1,180 sqft"],
    badge: "Buddy match · 92%",
    why: "Den converts cleanly to home office. P.S. 321 zone (10/10). 4-min walk to 7th Ave park.",
    match: true,
  },
  {
    img: "https://live.staticflickr.com/7214/7157240902_18625f13f1_b.jpg",
    price: "$1,280,000",
    addr: "1612 Caton Ave · Kensington",
    specs: ["3 bed", "1.5 bath", "1,560 sqft"],
    badge: "Buddy match · 88%",
    why: "Most sqft per dollar in your range. P.S. 230 zone (8/10). Quieter, less walkable — 9-min to F.",
    match: true,
  },
  {
    img: "https://live.staticflickr.com/3524/3183447589_ba268f46f4_b.jpg",
    price: "$1,620,000",
    addr: "14 Verandah Pl, #2 · Cobble Hill",
    specs: ["2 bed", "2 bath", "1,090 sqft"],
  },
  {
    img: "https://live.staticflickr.com/4008/4574794418_1b31a4b643_b.jpg",
    price: "$1,510,000",
    addr: "240 14th St, #3R · Park Slope South",
    specs: ["3 bed", "2 bath", "1,310 sqft"],
  },
  {
    img: "https://live.staticflickr.com/7326/9841377053_dc62190279_b.jpg",
    price: "$1,340,000",
    addr: "119 Bergen St · Boerum Hill",
    specs: ["2 bed", "1 bath", "1,040 sqft"],
  },
];

const QUICKS = [
  { l: "Family · school zone · $1.5M", q: "Two-income family with a 5 year old. Need P.S. 321 or 58, home office, walkable. Budget $1.5M." },
  { l: "Couple · vibe-led · $1.6M", q: "Couple, no kids, both work hybrid. Want the best food/coffee neighborhood for under $1.6M, 2 bed." },
  { l: "Compare these two", q: "Why is the Sackett St one priced lower than the Garfield Pl one? They look comparable." },
  { l: "Mortgage math", q: "What would my monthly payment be on the Sackett St place with 25% down at 6.4%?" },
];

const MAP_BG =
  'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%23E5DFD2"/><g stroke="%23C8C0AB" stroke-width="0.8" fill="none"><path d="M0,200 C150,180 250,260 400,220 S600,260 700,200"/><path d="M0,360 C100,340 200,400 350,380 S550,420 700,400"/><path d="M150,0 C170,150 110,250 200,400 S130,600 200,700"/><path d="M380,0 C420,200 360,300 440,500 S400,700 460,800"/></g></svg>\')';

export default function KeystonePage() {
  const [open, setOpen] = useState(false);
  const [hideQuicks, setHideQuicks] = useState(false);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bbodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("keystone") }));

  useEffect(() => {
    if (bbodyRef.current) bbodyRef.current.scrollTop = bbodyRef.current.scrollHeight;
  }, [messages, typing]);

  function openBubble() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setHideQuicks(true);
    setMessages((m) => [...m, { role: "user", text: v }]);
    setInput("");
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(v, {
      onToken: (full) => {
        setTyping(false);
        setMessages((m) => {
          if (botIdx === -1) {
            const next = [...m, { role: "bot" as const, text: full }];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...m];
          next[botIdx] = { ...next[botIdx], text: full };
          return next;
        });
      },
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ["--ink" as string]: "#0F1A24",
        ["--paper" as string]: "#fff",
        ["--bg" as string]: "#F5F2EC",
        ["--line" as string]: "#E1DCCF",
        ["--mute" as string]: "#5E6B78",
        ["--accent" as string]: "#1F4D3E",
        ["--accent-d" as string]: "#143329",
        ["--gold" as string]: "#B7975B",
        background: "#fff",
        color: "#0F1A24",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4.5 border-b border-[#E1DCCF] bg-white sticky top-0 z-10">
        <div className="font-semibold text-[18px] tracking-[0.06em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
          <b style={{ color: "#1F4D3E" }}>K</b>EYSTONE
        </div>
        <ul className="hidden md:flex gap-7 text-[13px] list-none m-0 p-0">
          <li>Buy</li>
          <li>Rent</li>
          <li>Sell</li>
          <li>Mortgage</li>
          <li>Agents</li>
        </ul>
        <div className="flex items-center gap-3.5">
          <span className="text-[13px] text-[#5E6B78]">Saved (3)</span>
          <button type="button" className="bg-[#0F1A24] text-white border-0 px-3.5 py-2 rounded text-[12.5px] cursor-pointer">
            Sign in
          </button>
        </div>
      </nav>

      {/* Search bar */}
      <div className="px-6 md:px-10 py-4.5 border-b border-[#E1DCCF] flex gap-2.5 items-center flex-wrap" style={{ background: "#F5F2EC" }}>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 border border-[#E1DCCF] rounded text-[13px] text-[#5E6B78]">
          📍 <b className="text-[#0F1A24] font-medium">Brooklyn, NY</b>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 border border-[#E1DCCF] rounded text-[13px] text-[#5E6B78]">
          $ <b className="text-[#0F1A24] font-medium">$1.2M – $1.8M</b>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 border border-[#E1DCCF] rounded text-[13px] text-[#5E6B78]">
          🛏 <b className="text-[#0F1A24] font-medium">2-3 bed</b>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 border border-[#E1DCCF] rounded text-[13px] text-[#5E6B78]">
          + More
        </div>
        <div
          className="flex-1 min-w-[280px] flex items-center gap-2.5 bg-white border border-[#E1DCCF] rounded px-3.5 py-2.5"
          style={{ borderLeft: "3px solid #1F4D3E" }}
        >
          <div className="w-[18px] h-[18px] rounded-md grid place-items-center" style={{ background: "#1F4D3E" }}>
            <Image src="/assets/ba-icon-white.png" alt="" width={11} height={11} />
          </div>
          <div className="text-[10px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#1F4D3E" }}>
            Ask
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                openBubble();
                send(search.trim());
                setSearch("");
              }
            }}
            placeholder='"3-bed near a good school, room for a home office, under $1.5M, walkable"'
            className="flex-1 border-0 outline-none text-[13.5px] bg-transparent italic placeholder:text-[#5E6B78]"
          />
        </div>
      </div>

      {/* Stage */}
      <div className="grid lg:grid-cols-[1fr_480px] grid-cols-1 flex-1" style={{ height: "calc(100vh - 130px)", minHeight: 560 }}>
        {/* Map */}
        <div
          className="relative overflow-hidden h-[300px] lg:h-auto"
          style={{
            background: `#E5DFD2 ${MAP_BG} repeat`,
            backgroundSize: "600px 600px",
          }}
        >
          <div
            className="absolute top-3.5 left-3.5 bg-white px-3.5 py-2 rounded text-xs border border-[#E1DCCF]"
            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
          >
            <b className="font-semibold" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Brooklyn
            </b>{" "}
            · 14 listings · <span style={{ color: "#1F4D3E" }}>3 highlighted by Buddy</span>
          </div>
          {AREA_LABELS.map((a) => (
            <div
              key={a.l}
              className="absolute text-[11px] tracking-[0.18em] uppercase text-[#5E6B78]"
              style={{ top: a.top, left: a.left, fontFamily: "var(--font-geist), sans-serif" }}
            >
              {a.l}
            </div>
          ))}
          {PINS.map((p, i) => (
            <div
              key={i}
              className="absolute font-semibold text-[13px] px-2.5 py-1.5 rounded-full border cursor-pointer"
              style={{
                top: p.top,
                left: p.left,
                fontFamily: "var(--font-geist), sans-serif",
                background: p.active ? "#1F4D3E" : "#fff",
                color: p.active ? "#fff" : "#0F1A24",
                borderColor: p.active ? "#1F4D3E" : "#E1DCCF",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                transform: "translate(-50%,-100%)",
              }}
            >
              {p.price}
            </div>
          ))}
        </div>

        {/* Listings panel */}
        <div className="bg-white lg:border-l border-t lg:border-t-0 border-[#E1DCCF] overflow-y-auto px-6 py-4.5">
          <div className="flex justify-between items-end mb-3.5">
            <div>
              <h2 className="m-0 font-semibold text-[18px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                14 homes
              </h2>
              <div className="text-xs text-[#5E6B78]">Brooklyn · $1.2M–$1.8M · 2-3 bed</div>
            </div>
            <div className="text-xs cursor-pointer" style={{ color: "#1F4D3E" }}>
              Best match ▾
            </div>
          </div>

          {LISTINGS.map((l, i) => (
            <div
              key={i}
              className={`grid gap-3.5 py-3.5 cursor-pointer ${i < LISTINGS.length - 1 ? "border-b border-[#E1DCCF]" : ""} hover:bg-[rgba(31,77,62,0.03)]`}
              style={{ gridTemplateColumns: "140px 1fr" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.img}
                alt={l.addr}
                className="rounded object-cover w-full"
                style={{ aspectRatio: "4/3", background: "#F5F2EC" }}
              />
              <div>
                <div className="font-semibold text-[18px] -tracking-[0.01em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                  {l.price}
                </div>
                <div className="text-[13px] mt-0.5">{l.addr}</div>
                <div className="text-xs text-[#5E6B78] mt-1 flex gap-2.5">
                  {l.specs.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                {l.badge && (
                  <span
                    className="inline-block px-1.5 py-0.5 text-white text-[10px] tracking-[0.04em] uppercase mt-1.5 font-semibold rounded-sm"
                    style={{ background: "#B7975B" }}
                  >
                    {l.badge}
                  </span>
                )}
                {l.match && l.why && (
                  <div
                    className="mt-2 px-2.5 py-1.5 italic text-[11.5px]"
                    style={{
                      background: "rgba(31,77,62,0.06)",
                      borderLeft: "2px solid #1F4D3E",
                      color: "#143329",
                    }}
                  >
                    {l.why}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openBubble())}
        className="fixed right-6 bottom-6 w-[60px] h-[60px] rounded-full text-white grid place-items-center cursor-pointer border-0 z-50 transition-transform hover:scale-105"
        style={{ background: "#1F4D3E", boxShadow: "0 12px 30px rgba(31,77,62,0.4)" }}
        aria-label="Open Buddy"
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: "#1F4D3E", opacity: 0.4, animation: "ks-pulse 2.4s infinite" }}
        />
        <span className="relative text-white font-semibold text-[22px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>K</span>
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-32px)] bg-white rounded-xl overflow-hidden flex flex-col z-50 border border-[#E1DCCF]"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)", height: 580, maxHeight: "calc(100vh - 140px)" }}
        >
          <div className="px-4.5 py-3.5 flex items-center gap-2.5 text-white" style={{ background: "#1F4D3E" }}>
            <div className="w-8 h-8 rounded-lg grid place-items-center text-white font-semibold text-[15px]" style={{ background: "rgba(255,255,255,0.18)", fontFamily: "var(--font-fraunces), serif" }}>
              K
            </div>
            <div>
              <h3 className="m-0 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Keystone Concierge
              </h3>
              <div className="text-[11.5px] text-white/70">Powered by Buddy Assist</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto bg-transparent border-0 text-white text-base cursor-pointer w-7 h-7 rounded-md hover:bg-white/10"
            >
              ×
            </button>
          </div>

          <div ref={bbodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: "#F5F2EC" }}>
            <div
              className="px-3.5 py-2.5 rounded-[10px] text-[13.5px] leading-[1.5] max-w-[280px] bg-white border border-[#E1DCCF] text-[#0F1A24] self-start"
              style={{ borderTopLeftRadius: 2 }}
            >
              Hi — I&apos;m your Keystone concierge. Tell me what you&apos;re really looking for. School? Commute? Outdoor space? I&apos;ll re-rank these listings around your life, not just your price filter.
            </div>

            {!hideQuicks && (
              <div className="flex flex-col gap-1.5 mt-1">
                {QUICKS.map((q) => (
                  <button
                    key={q.l}
                    type="button"
                    onClick={() => send(q.q)}
                    className="text-left bg-white border border-[#E1DCCF] rounded-md px-3 py-2 text-[12.5px] cursor-pointer text-[#0F1A24] hover:border-[#1F4D3E]"
                    style={{ background: "#fff" }}
                  >
                    {q.l}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3.5 py-2.5 rounded-[10px] text-[13.5px] leading-[1.5] max-w-[280px] whitespace-pre-wrap ${
                  m.role === "user" ? "self-end text-white" : "self-start bg-white border border-[#E1DCCF]"
                }`}
                style={{
                  background: m.role === "user" ? "#1F4D3E" : undefined,
                  borderTopLeftRadius: m.role === "bot" ? 2 : undefined,
                  borderTopRightRadius: m.role === "user" ? 2 : undefined,
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: mdInline(m.text) }} />
              </div>
            ))}

            {typing && (
              <div className="px-3.5 py-3 rounded-[10px] max-w-[280px] bg-white border border-[#E1DCCF] self-start" style={{ borderTopLeftRadius: 2 }}>
                <div className="inline-flex gap-1 py-1.5">
                  <span className="typing-dot" style={{ background: "#5E6B78" }} />
                  <span className="typing-dot" style={{ background: "#5E6B78", animationDelay: ".15s" }} />
                  <span className="typing-dot" style={{ background: "#5E6B78", animationDelay: ".3s" }} />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="px-3.5 py-3 border-t border-[#E1DCCF] bg-white flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about these homes…"
              className="flex-1 border border-[#E1DCCF] rounded-full px-3.5 py-2 text-[13px] outline-none focus:border-[#1F4D3E]"
            />
            <button
              type="submit"
              className="text-white border-0 rounded-full w-9 h-9 cursor-pointer text-sm"
              style={{ background: "#1F4D3E" }}
            >
              →
            </button>
          </form>
        </div>
      )}

      <IndustrySwitcher currentSlug="keystone" />

      <style jsx>{`
        @keyframes ks-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
