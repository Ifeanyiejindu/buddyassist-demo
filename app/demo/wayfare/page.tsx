"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat } from "@/lib/buddyChat";

const SYSTEM_PROMPT = `
You are Buddy, the trip-planning concierge for Wayfare — a travel-booking app.
You can plan itineraries, suggest flights/hotels with rough prices, recommend restaurants and neighborhoods, give visa/weather/packing tips, and refine in conversation.
When asked to plan, propose a tight day-by-day with: where to stay (1 hotel pick + 1 alt with rough $/night), 2-3 things per day, 1 lunch + 1 dinner pick, and a final-line total estimate.
Use real-feeling specifics (neighborhoods, dish names, neighborhoods to skip). Currency in dollars unless asked.
You CAN'T actually book — say "I'll hand this to checkout when you're ready." Keep replies skimmable. Use short headings if helpful but no markdown bullets — write in concise paragraphs separated by linebreaks.
`.trim();

const RECENT_TRIPS = [
  { t: "Lisbon · 4 days", s: "Sep 12 – 16 · drafted", active: true },
  { t: "Tokyo + Kyoto", s: "Nov 4 – 14 · booked" },
  { t: "Iceland ring road", s: "Aug 1 – 8 · saved" },
  { t: "Mexico City weekend", s: "Jul 18 – 21 · booked" },
];

const SAVED_PLACES = [
  { t: "Time Out Market", s: "Lisbon · €€" },
  { t: "Hotel Sotão", s: "Lisbon · 4★" },
  { t: "Belém Tower", s: "Lisbon · landmark" },
];

const QUICKSETS = [
  {
    ic: "⛱",
    h: "Plan 4 days in Lisbon",
    p: "Two travelers · ~$2,000 · food + beach",
    q: "Plan a 4-day trip to Lisbon for two — first time, mid-September, mix of food and beach. Around $2,000 total.",
  },
  {
    ic: "✿",
    h: "Cherry blossom timing in Japan",
    p: "Two weeks · cities + dates",
    q: "I want to see the cherry blossoms in Japan in 2026. Two weeks. What dates and which cities?",
  },
  {
    ic: "✈",
    h: "Cheapest summer week to Iceland",
    p: "JFK · ±5 days flexible",
    q: "What's the cheapest week to fly to Iceland from JFK in summer? I'm flexible by 5 days.",
  },
  {
    ic: "⌂",
    h: "Family hotels in Mexico City",
    p: "2 adults + 1 kid · August",
    q: "Family-friendly hotels in Mexico City near a park. Two adults, one kid, August.",
  },
];

export default function WayfarePage() {
  const [turns, setTurns] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const convoRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT }));

  useEffect(() => {
    if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight;
  }, [turns, typing]);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
  }

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setTurns((t) => [...t, { role: "user", text: v }]);
    setInput("");
    requestAnimationFrame(autosize);
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(v, {
      onToken: (full) => {
        setTyping(false);
        setTurns((t) => {
          if (botIdx === -1) {
            const next = [...t, { role: "bot" as const, text: full }];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...t];
          next[botIdx] = { ...next[botIdx], text: full };
          return next;
        });
      },
    });
  }

  const showWelcome = turns.length === 0;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-screen overflow-hidden"
      style={{
        ["--ink" as string]: "#1A1A1A",
        ["--paper" as string]: "#F8F5F0",
        ["--line" as string]: "#E5DFD3",
        ["--mute" as string]: "#7A736A",
        ["--accent" as string]: "#E76F51",
        ["--accent-deep" as string]: "#C95A3D",
        ["--sand" as string]: "#EBDFCC",
        ["--sky" as string]: "#A7C4BC",
        ["--buddy" as string]: "#2FC463",
        ["--buddy-deep" as string]: "#1E9E4B",
        background: "#F8F5F0",
        color: "#1A1A1A",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex bg-[#1A1A1A] text-white p-4.5 flex-col gap-3.5 overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 py-1.5" style={{ fontFamily: "var(--font-bricolage), sans-serif", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <div className="w-[30px] h-[30px] rounded-lg grid place-items-center font-bold" style={{ background: "#E76F51" }}>W</div>
          Wayfare
        </div>
        <button
          type="button"
          className="mt-1.5 px-3.5 py-2.5 rounded-[10px] text-white text-[13.5px] font-medium flex items-center gap-2 cursor-pointer"
          style={{ background: "#E76F51" }}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-xs">+</span>
          New trip
        </button>

        <div className="text-[10.5px] tracking-[0.14em] uppercase text-[#7A736A] px-2 pt-3.5 pb-1.5">Recent trips</div>
        {RECENT_TRIPS.map((it) => (
          <div
            key={it.t}
            className={`px-3 py-2.5 rounded-lg text-[13px] text-white/85 cursor-pointer flex flex-col gap-0.5 ${
              it.active ? "bg-white/[0.10]" : "hover:bg-white/[0.06]"
            }`}
          >
            <span className="font-medium">{it.t}</span>
            <small className="text-[11px] text-white/50">{it.s}</small>
          </div>
        ))}

        <div className="text-[10.5px] tracking-[0.14em] uppercase text-[#7A736A] px-2 pt-3.5 pb-1.5">Saved places</div>
        {SAVED_PLACES.map((it) => (
          <div key={it.t} className="px-3 py-2.5 rounded-lg text-[13px] text-white/85 hover:bg-white/[0.06] cursor-pointer flex flex-col gap-0.5">
            <span className="font-medium">{it.t}</span>
            <small className="text-[11px] text-white/50">{it.s}</small>
          </div>
        ))}

        <div className="mt-auto pt-3 px-2 border-t border-white/10 flex items-center gap-2.5 text-[13px]">
          <div className="w-[30px] h-[30px] rounded-full" style={{ background: "linear-gradient(135deg, #EBDFCC, #E76F51)" }} />
          <div>
            <div className="font-semibold text-[13px]">Sam Ramirez</div>
            <div className="text-[11px] text-white/50">Pro plan</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="flex flex-col h-screen overflow-hidden">
        <div className="px-7 py-3.5 border-b border-[#E5DFD3] bg-[#F8F5F0] flex items-center gap-3.5">
          <span className="px-3 py-1.5 border border-[#E5DFD3] rounded-full text-[11.5px] text-[#7A736A] inline-flex items-center gap-1.5 bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
            Buddy · live
          </span>
          <span className="text-[18px] font-semibold ml-1" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
            Lisbon · 4 days
          </span>
          <div className="ml-auto flex gap-2">
            {[
              { t: "Share", c: "↗" },
              { t: "Export", c: "↓" },
              { t: "Settings", c: "⚙" },
            ].map((b) => (
              <button
                key={b.t}
                type="button"
                title={b.t}
                className="w-[34px] h-[34px] rounded-lg bg-white border border-[#E5DFD3] grid place-items-center text-sm cursor-pointer hover:bg-[#EBDFCC]"
              >
                {b.c}
              </button>
            ))}
          </div>
        </div>

        <div ref={convoRef} className="flex-1 overflow-y-auto flex flex-col">
          {showWelcome ? (
            <div className="flex-1 flex flex-col items-center justify-center px-7 py-10 gap-7 text-center">
              <div
                className="w-16 h-16 rounded-[20px] grid place-items-center"
                style={{ background: "#2FC463", boxShadow: "0 14px 30px rgba(47,196,99,0.25)" }}
              >
                <Image src="/assets/ba-icon-white.png" alt="" width={34} height={34} />
              </div>
              <h1
                className="font-semibold leading-none -tracking-[0.025em] m-0 max-w-[18ch]"
                style={{ fontFamily: "var(--font-bricolage), sans-serif", fontSize: "clamp(40px,5.4vw,68px)" }}
              >
                Where to, <em className="italic" style={{ color: "#C95A3D" }}>this time?</em>
              </h1>
              <p className="text-[#7A736A] text-[17px] max-w-[52ch] m-0">
                Tell me where you&apos;re going, who&apos;s coming, and what you&apos;re in the mood for. I&apos;ll plan the trip — flights, hotels, days, dinners, the works — and you can edit any of it in conversation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-w-[660px]">
                {QUICKSETS.map((q) => (
                  <button
                    key={q.h}
                    type="button"
                    onClick={() => send(q.q)}
                    className="px-5 py-4.5 bg-white border border-[#E5DFD3] rounded-[14px] text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all"
                  >
                    <div
                      className="w-8 h-8 rounded-lg grid place-items-center text-sm mb-2.5"
                      style={{ background: "#EBDFCC" }}
                    >
                      {q.ic}
                    </div>
                    <h4 className="m-0 mb-1 font-semibold text-[15px] -tracking-[0.01em]" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
                      {q.h}
                    </h4>
                    <p className="text-[12.5px] text-[#7A736A] m-0 leading-[1.4]">{q.p}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 py-7 flex flex-col gap-4.5">
              {turns.map((t, i) => (
                <div
                  key={i}
                  className="max-w-[780px] mx-auto px-7 w-full grid grid-cols-[36px_1fr] gap-3.5 items-start"
                >
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center font-semibold text-[13px] text-white"
                    style={{ background: t.role === "bot" ? "#2FC463" : "#1A1A1A" }}
                  >
                    {t.role === "bot" ? (
                      <Image src="/assets/ba-icon-white.png" alt="" width={18} height={18} />
                    ) : (
                      "S"
                    )}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold mb-1" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
                      {t.role === "bot" ? "Buddy" : "You"}
                    </div>
                    <div className="text-[15px] leading-[1.6] whitespace-pre-wrap text-[#1A1A1A]">{t.text}</div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="max-w-[780px] mx-auto px-7 w-full grid grid-cols-[36px_1fr] gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-[10px] grid place-items-center" style={{ background: "#2FC463" }}>
                    <Image src="/assets/ba-icon-white.png" alt="" width={18} height={18} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold mb-1" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
                      Buddy
                    </div>
                    <div className="flex gap-1 py-1.5">
                      <span className="typing-dot" style={{ background: "#7A736A" }} />
                      <span className="typing-dot" style={{ background: "#7A736A", animationDelay: ".15s" }} />
                      <span className="typing-dot" style={{ background: "#7A736A", animationDelay: ".3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#E5DFD3] px-7 pt-4.5 pb-5.5" style={{ background: "linear-gradient(0deg, #F8F5F0, rgba(248,245,240,0.6))" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="max-w-[780px] mx-auto bg-white border border-[#E5DFD3] rounded-[18px] p-3 pl-4.5 flex items-end gap-2 focus-within:border-[#E76F51]"
            style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}
          >
            <div className="flex gap-1">
              {["＋", "⌚"].map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer text-sm text-[#7A736A] grid place-items-center hover:bg-[#EBDFCC]"
                >
                  {c}
                </button>
              ))}
            </div>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autosize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Tell Buddy where you want to go, who's coming, your budget — anything, really."
              className="flex-1 border-0 outline-none resize-none text-[15px] leading-[1.5] bg-transparent text-[#1A1A1A] min-h-[24px] max-h-[160px] py-1"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="w-9 h-9 rounded-[10px] border-0 cursor-pointer text-white text-base grid place-items-center disabled:bg-[#E5DFD3] disabled:cursor-not-allowed"
              style={{ background: input.trim() ? "#E76F51" : "#E5DFD3" }}
            >
              ↑
            </button>
          </form>
          <div className="max-w-[780px] mx-auto mt-2 text-[11px] text-[#7A736A] text-center">
            Buddy can make mistakes — confirm prices and availability before booking. <b style={{ color: "#1E9E4B" }}>Demo build powered by Buddy Assist.</b>
          </div>
        </div>
      </section>

      <IndustrySwitcher currentSlug="wayfare" />
    </div>
  );
}
