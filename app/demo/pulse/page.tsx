"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat } from "@/lib/buddyChat";

const SYSTEM_PROMPT = `
You are Buddy, the marketing intelligence assistant inside Pulse — a marketing analytics & campaign tool.
The active workspace is "Northwood Co." — a DTC brand running paid on Meta, Google, TikTok, LinkedIn. Last 30 days: spend $184k, CAC $76 (up 18% WoW), ROAS 3.42x (down 6.8%), conversions 2,418.
Top campaigns by ROAS: "Brand search" 8.4x ($18.7k), "Spring · Pro" 5.1x ($42.2k), "Lookalike · 30d" 4.6x ($28.9k), "Retarget · cart" 2.1x ($22.3k), "Cold · TikTok" 1.8x ($15.2k).
You're confident, fast, data-grounded. Cite specific numbers and channel/campaign names. When asked to act (kill ads, reallocate, brief), give a 3-5 step concrete plan.
You CAN'T directly mutate accounts — say "I'll prep the change for your approval."
Keep replies tight (3-5 short paragraphs max). No bullet markdown — write in compact paragraphs.
`.trim();

const SUGGESTS = [
  { lbl: "Diagnose", q: "Why is CAC up 18% this week?" },
  { lbl: "Action", q: "Which 3 ads should I kill today?" },
  { lbl: "Plan", q: "Draft a Q3 budget reallocation across Meta, Google, and TikTok based on last 30 days." },
  { lbl: "Insight", q: "What creative themes are winning on TikTok this month?" },
  { lbl: "Cohort", q: "Compare LTV by acquisition channel for Q2 cohort." },
  { lbl: "Brief", q: "Build a brief for a fall retargeting campaign — $40k, 6 weeks." },
];

const KPIS = [
  { lbl: "Spend", v: "$184,312", delta: "▲ 12.4%", deltaClass: "up", color: "#5B5EF0", points: "0,24 10,22 20,18 30,20 40,14 50,16 60,12 70,10 80,12 90,8 100,5" },
  { lbl: "Conversions", v: "2,418", delta: "▲ 4.1%", deltaClass: "up", color: "#10B981", points: "0,18 10,16 20,14 30,12 40,16 50,10 60,12 70,8 80,10 90,6 100,8" },
  { lbl: "CAC", v: "$76.20", delta: "▲ 18.0% vs LW", deltaClass: "down", color: "#E55C5C", points: "0,24 10,22 20,20 30,16 40,14 50,12 60,10 70,8 80,7 90,6 100,4" },
  { lbl: "ROAS", v: "3.42×", delta: "▼ 6.8%", deltaClass: "down", color: "#5B5EF0", points: "0,8 10,10 20,12 30,9 40,11 50,14 60,12 70,16 80,18 90,20 100,22" },
];

const TOP_CAMPAIGNS = [
  { name: "Spring · Pro", spend: "$42,180", roas: "5.1×", roasClass: "ok", color: "#5B5EF0" },
  { name: "Lookalike · 30d", spend: "$28,940", roas: "4.6×", roasClass: "ok", color: "#10B981" },
  { name: "Retarget · cart", spend: "$22,310", roas: "2.1×", roasClass: "warn", color: "#E55C5C" },
  { name: "Brand search", spend: "$18,704", roas: "8.4×", roasClass: "ok", color: "#F4A261" },
  { name: "Cold · TikTok", spend: "$15,210", roas: "1.8×", roasClass: "warn", color: "#7A8AC4" },
];

const ANOMALIES = [
  {
    signal: "CAC spike on Meta",
    sub: '"Cold · prospect" audience CPM up 38%',
    channel: "Meta",
    impact: "+$3,120 / wk",
    impactClass: "warn",
    rec: 'Pause "Cold · prospect" Tuesday; shift to lookalike-30.',
    cta: "Apply",
  },
  {
    signal: "Creative fatigue",
    sub: "3 ads > 14 day, CTR ↓ 42%",
    channel: "Meta",
    impact: "$1,800 wasted",
    impactClass: "warn",
    rec: "Refresh hooks; rotate static → UGC.",
    cta: "Brief",
  },
  {
    signal: "Brand search underspending",
    sub: "IS 71%, ROAS 8.4×",
    channel: "Google",
    impact: "+$5,400 / wk",
    impactClass: "ok",
    rec: "Lift daily cap by $400.",
    cta: "Apply",
  },
];

export default function PulsePage() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string; src?: boolean }[]>([]);
  const [typing, setTyping] = useState(false);
  const [hideSuggests, setHideSuggests] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT }));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setHideSuggests(true);
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
      onDone: () => {
        setMessages((m) => {
          if (botIdx === -1) return m;
          const next = [...m];
          next[botIdx] = { ...next[botIdx], src: true };
          return next;
        });
      },
    });
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-screen"
      style={{
        ["--ink" as string]: "#0B0F14",
        ["--paper" as string]: "#fff",
        ["--bg" as string]: "#F4F5F7",
        ["--line" as string]: "#E6E8EC",
        ["--mute" as string]: "#6A7280",
        ["--accent" as string]: "#5B5EF0",
        ["--accent-deep" as string]: "#3F42C9",
        ["--warn" as string]: "#E55C5C",
        ["--good" as string]: "#10B981",
        ["--buddy" as string]: "#2FC463",
        ["--buddy-deep" as string]: "#1E9E4B",
        background: "#F4F5F7",
        color: "#0B0F14",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex bg-[#0B0F14] text-white py-4.5 px-3.5 flex-col gap-1.5 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 py-1.5 font-semibold text-[18px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
          <div className="w-[26px] h-[26px] rounded-[7px] grid place-items-center text-[13px]" style={{ background: "#5B5EF0" }}>P</div>
          Pulse
        </div>

        <div className="text-[10px] tracking-[0.14em] uppercase text-[#6A7280] px-2 pt-3.5 pb-1">Workspace</div>
        <nav className="flex flex-col gap-px">
          {[
            { ic: "▦", l: "Overview", active: true },
            { ic: "↗", l: "Campaigns" },
            { ic: "$", l: "Spend" },
            { ic: "⚲", l: "Audiences" },
            { ic: "✎", l: "Creative" },
            { ic: "⌘", l: "Reports" },
          ].map((it) => (
            <a
              key={it.l}
              className={`px-2.5 py-2 rounded-md text-[13px] flex items-center gap-2.5 cursor-pointer ${
                it.active ? "text-white" : "text-white/[0.78] hover:bg-white/[0.06]"
              }`}
              style={{ background: it.active ? "rgba(91,94,240,0.18)" : undefined }}
            >
              <span className="w-3.5 text-center text-xs">{it.ic}</span>
              {it.l}
            </a>
          ))}
        </nav>

        <div className="text-[10px] tracking-[0.14em] uppercase text-[#6A7280] px-2 pt-3.5 pb-1">Channels</div>
        <nav className="flex flex-col gap-px">
          {["Meta", "Google", "TikTok", "LinkedIn"].map((c) => (
            <a key={c} className="px-2.5 py-2 rounded-md text-[13px] text-white/[0.78] hover:bg-white/[0.06] cursor-pointer flex items-center gap-2.5">
              <span className="w-3.5 text-center text-xs">●</span>
              {c}
            </a>
          ))}
        </nav>

        <div className="mt-auto pt-3 px-2 border-t border-white/[0.08] flex items-center gap-2.5 text-[12.5px]">
          <div className="w-[26px] h-[26px] rounded-full" style={{ background: "linear-gradient(135deg, #E76F51, #F4D9B8)" }} />
          <div>
            <div className="font-semibold text-[12.5px]">Northwood Co.</div>
            <div className="text-[10.5px] text-white/50">Client · Pro</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="relative">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#E6E8EC] px-7 py-3 flex items-center gap-3.5">
          <div className="flex items-center gap-2 text-[13px] text-[#6A7280]">
            Pulse · <b className="text-[#0B0F14] font-semibold">Northwood Co.</b> · Last 30 days
          </div>
          <div className="hidden lg:flex ml-auto items-center gap-2 px-3 py-1.5 bg-[#F4F5F7] border border-[#E6E8EC] rounded-lg text-[12.5px] text-[#6A7280] min-w-[280px]">
            ⌕ Search campaigns, ads, audiences…
            <kbd className="ml-auto text-[10px] bg-white px-1.5 py-0.5 border border-[#E6E8EC] rounded font-mono">⌘K</kbd>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="ml-auto lg:ml-0 flex items-center gap-2 px-3 py-1.5 bg-[#0B0F14] text-white rounded-lg text-[12.5px] font-medium cursor-pointer"
          >
            <span className="w-[18px] h-[18px] rounded-[5px] grid place-items-center" style={{ background: "#2FC463" }}>
              <Image src="/assets/ba-icon-white.png" alt="" width={11} height={11} className="w-[11px] h-[11px]" />
            </span>
            Ask Buddy
            <kbd className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white">⌘B</kbd>
          </button>
        </div>

        {/* Buddy slide-down */}
        <div
          className="fixed top-[53px] left-0 md:left-[220px] right-0 z-25 bg-white border-b border-[#E6E8EC] max-h-[70vh] overflow-hidden flex flex-col"
          style={{
            transform: open ? "translateY(0)" : "translateY(-110%)",
            transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.10)",
          }}
        >
          <div className="px-7 py-4.5 border-b border-[#E6E8EC] flex items-center gap-3.5" style={{ background: "linear-gradient(180deg, #fff, #FBFBFD)" }}>
            <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center" style={{ background: "#2FC463", boxShadow: "0 0 0 4px rgba(47,196,99,0.15)" }}>
              <Image src="/assets/ba-icon-white.png" alt="" width={18} height={18} className="w-[18px] h-[18px]" />
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask anything about your campaigns, spend, or creative…"
              className="flex-1 border-0 outline-none text-[18px] bg-transparent -tracking-[0.01em]"
              style={{ fontFamily: "var(--font-geist), sans-serif" }}
            />
            <kbd className="font-mono text-[10px] bg-[#F4F5F7] px-2 py-0.5 rounded border border-[#E6E8EC] text-[#6A7280]">↵ to send</kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-2 w-[30px] h-[30px] rounded-lg bg-transparent border-0 cursor-pointer text-[#6A7280] text-base hover:bg-[#F4F5F7]"
            >
              ×
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-4">
            {!hideSuggests && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {SUGGESTS.map((s) => (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => send(s.q)}
                    className="text-left px-4 py-3.5 border border-[#E6E8EC] rounded-[10px] bg-white cursor-pointer flex flex-col gap-1 hover:border-[#5B5EF0] hover:bg-[#FAFAFE]"
                  >
                    <span className="text-[10px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#3F42C9" }}>
                      {s.lbl}
                    </span>
                    <span className="text-[13.5px] font-medium -tracking-[0.005em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                      {s.q}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div
                  className="w-8 h-8 rounded-[9px] grid place-items-center text-white font-semibold text-xs"
                  style={{ background: m.role === "bot" ? "#2FC463" : "#0B0F14" }}
                >
                  {m.role === "bot" ? <Image src="/assets/ba-icon-white.png" alt="" width={16} height={16} /> : "N"}
                </div>
                <div>
                  <div className="font-semibold text-[12.5px] mb-1" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                    {m.role === "bot" ? "Buddy" : "You"}
                  </div>
                  <div className="text-[14px] leading-[1.55] whitespace-pre-wrap">{m.text}</div>
                  {m.src && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {["meta_ads.csv", "ga4.events", "stripe.charges"].map((s) => (
                        <span key={s} className="font-mono text-[10px] px-1.5 py-1 rounded" style={{ background: "#EEF0FF", color: "#3F42C9" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="w-8 h-8 rounded-[9px] grid place-items-center" style={{ background: "#2FC463" }}>
                  <Image src="/assets/ba-icon-white.png" alt="" width={16} height={16} />
                </div>
                <div>
                  <div className="font-semibold text-[12.5px] mb-1" style={{ fontFamily: "var(--font-geist), sans-serif" }}>Buddy</div>
                  <div className="flex gap-1 py-1.5">
                    <span className="typing-dot" style={{ background: "#6A7280" }} />
                    <span className="typing-dot" style={{ background: "#6A7280", animationDelay: ".15s" }} />
                    <span className="typing-dot" style={{ background: "#6A7280", animationDelay: ".3s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-7 py-2.5 border-t border-[#E6E8EC] text-[11px] text-[#6A7280] flex justify-between" style={{ background: "#F4F5F7" }}>
            <span>
              Buddy reads from your connected sources — Meta, Google, GA4, Stripe, Notion. <b style={{ color: "#1E9E4B" }}>Demo only.</b>
            </span>
            <span>
              Press <b>Esc</b> to close
            </span>
          </div>
        </div>

        {/* Stage */}
        <section className="px-7 py-6 flex flex-col gap-5">
          <div className="flex items-end justify-between gap-5 flex-wrap">
            <div>
              <h1 className="m-0 font-semibold text-[32px] -tracking-[0.02em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Overview
              </h1>
              <div className="text-[#6A7280] text-[13.5px] mt-1">Northwood Co. · all channels · Apr 9 – May 9, 2026</div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="px-3.5 py-2.5 rounded-lg border border-[#E6E8EC] bg-white text-[12.5px] font-medium cursor-pointer">
                Last 30 days ▾
              </button>
              <button type="button" className="px-3.5 py-2.5 rounded-lg border border-[#E6E8EC] bg-white text-[12.5px] font-medium cursor-pointer">
                Export
              </button>
              <button type="button" className="px-3.5 py-2.5 rounded-lg border border-[#0B0F14] bg-[#0B0F14] text-white text-[12.5px] font-medium cursor-pointer">
                + New campaign
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KPIS.map((k) => (
              <div key={k.lbl} className="bg-white border border-[#E6E8EC] rounded-[10px] p-4">
                <div className="text-[11.5px] text-[#6A7280] uppercase tracking-[0.08em]">{k.lbl}</div>
                <div className="font-semibold text-[30px] -tracking-[0.02em] mt-2 leading-none" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                  {k.v}
                </div>
                <div
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium font-mono"
                  style={{ color: k.deltaClass === "up" ? "#10B981" : "#E55C5C" }}
                >
                  {k.delta}
                </div>
                <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="block h-8 mt-2 w-full">
                  <polyline fill="none" stroke={k.color} strokeWidth="1.5" points={k.points} />
                </svg>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
            <div className="bg-white border border-[#E6E8EC] rounded-[10px] p-4.5">
              <h3 className="m-0 mb-1 text-[15px] font-semibold -tracking-[0.005em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Spend & conversions
              </h3>
              <div className="text-xs text-[#6A7280] mb-3.5">Trailing 30 days · all channels</div>
              <div className="h-[240px] rounded-md relative overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(91,94,240,0.05), transparent)" }}>
                <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="w-full h-full block">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5B5EF0" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#5B5EF0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,180 C50,170 100,160 150,150 S250,120 300,130 S400,90 450,80 S550,60 600,40 L600,240 L0,240 Z" fill="url(#g1)" />
                  <polyline
                    fill="none"
                    stroke="#5B5EF0"
                    strokeWidth="2"
                    points="0,180 50,172 100,160 150,150 200,140 250,125 300,130 350,110 400,90 450,80 500,72 550,55 600,40"
                  />
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    points="0,200 50,195 100,188 150,180 200,182 250,170 300,175 350,160 400,155 450,150 500,148 550,140 600,132"
                  />
                </svg>
              </div>
              <div className="flex gap-3.5 text-[11.5px] text-[#6A7280] mt-2.5">
                <span>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: "#5B5EF0" }} />
                  Spend
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: "#10B981" }} />
                  Conversions
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E8EC] rounded-[10px] p-4.5">
              <h3 className="m-0 mb-1 text-[15px] font-semibold -tracking-[0.005em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Top campaigns
              </h3>
              <div className="text-xs text-[#6A7280] mb-3.5">Sorted by ROAS</div>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {["Campaign", "Spend", "ROAS"].map((h) => (
                      <th
                        key={h}
                        className="text-left font-medium text-[#6A7280] text-[11px] tracking-[0.06em] uppercase px-2.5 py-2 border-b border-[#E6E8EC]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_CAMPAIGNS.map((c, i) => (
                    <tr key={c.name}>
                      <td className={`px-2.5 py-3 ${i < TOP_CAMPAIGNS.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
                          {c.name}
                        </span>
                      </td>
                      <td className={`px-2.5 py-3 ${i < TOP_CAMPAIGNS.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>{c.spend}</td>
                      <td className={`px-2.5 py-3 ${i < TOP_CAMPAIGNS.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: c.roasClass === "ok" ? "rgba(16,185,129,0.12)" : "rgba(229,92,92,0.12)",
                            color: c.roasClass === "ok" ? "#10B981" : "#E55C5C",
                          }}
                        >
                          {c.roas}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomalies */}
          <div className="bg-white border border-[#E6E8EC] rounded-[10px] p-4.5">
            <h3 className="m-0 mb-1 text-[15px] font-semibold -tracking-[0.005em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Anomalies & opportunities
            </h3>
            <div className="text-xs text-[#6A7280] mb-3.5">Buddy flagged these in the last 24 hours</div>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Signal", "Channel", "Impact", "Recommendation", ""].map((h, i) => (
                    <th
                      key={i}
                      className="text-left font-medium text-[#6A7280] text-[11px] tracking-[0.06em] uppercase px-2.5 py-2 border-b border-[#E6E8EC]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ANOMALIES.map((a, i) => (
                  <tr key={a.signal}>
                    <td className={`px-2.5 py-3 ${i < ANOMALIES.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>
                      <b className="font-semibold">{a.signal}</b>
                      <br />
                      <span className="text-[#6A7280] text-[11.5px]">{a.sub}</span>
                    </td>
                    <td className={`px-2.5 py-3 ${i < ANOMALIES.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>{a.channel}</td>
                    <td className={`px-2.5 py-3 ${i < ANOMALIES.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          background: a.impactClass === "ok" ? "rgba(16,185,129,0.12)" : "rgba(229,92,92,0.12)",
                          color: a.impactClass === "ok" ? "#10B981" : "#E55C5C",
                        }}
                      >
                        {a.impact}
                      </span>
                    </td>
                    <td className={`px-2.5 py-3 ${i < ANOMALIES.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>{a.rec}</td>
                    <td className={`px-2.5 py-3 ${i < ANOMALIES.length - 1 ? "border-b border-[#E6E8EC]" : ""}`}>
                      <button type="button" className="px-3.5 py-2 rounded-lg border border-[#E6E8EC] bg-white text-[12.5px] font-medium cursor-pointer">
                        {a.cta}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <IndustrySwitcher currentSlug="pulse" />
    </div>
  );
}
