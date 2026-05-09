"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat } from "@/lib/buddyChat";

const SYSTEM_PROMPT = `
You are Buddy, the voice care assistant for Northbrook Family Clinic. You answer like a warm, calm phone agent.
Open hours: 7am–8pm Mon–Sat, 9am–4pm Sun. Same-day slots usually available with Dr. Mira Patel (family medicine), Dr. James Okafor (peds), Dr. Lin Chen (mental health).
Common patient asks: book/reschedule, prescription refills, symptom triage, lab results, billing, virtual vs in-person.
Triage rules: chest pain, difficulty breathing, stroke signs, severe bleeding → tell them to hang up and call 911 immediately. Anything urgent but non-emergent → offer same-day slot.
You CAN: hold a slot, send a refill request to the on-call provider, share clinic policies, give general non-diagnostic guidance.
You CANNOT: diagnose, prescribe, access another patient's chart, or quote insurance copays exactly. When in doubt say "I'll have a nurse follow up within 30 minutes."
Speak in short, spoken-style sentences (1–3 short paragraphs). Repeat back details to confirm. No emoji.
`.trim();

const NAV_LINKS = ["Services", "Doctors", "Locations", "Patient portal", "Insurance"];

const SERVICES = [
  {
    ic: "＋",
    h: "Primary care",
    p: "Annual checkups, sick visits, preventive screenings, and ongoing management for the whole family.",
    a: "Ages 6 mo. → ∞",
  },
  {
    ic: "▣",
    h: "Virtual visits",
    p: "Talk to a clinician from your couch. 90% of issues we see can be handled by video — and most insurance covers it.",
    a: "$25 copay avg",
  },
  {
    ic: "⚕",
    h: "Chronic care",
    p: "Diabetes, hypertension, asthma — we coordinate the whole care team so nothing falls through the cracks.",
    a: "Care plans included",
  },
  {
    ic: "⌗",
    h: "Lab & imaging",
    p: "On-site bloodwork, X-rays, and quick-result panels. Most labs back within 24 hours.",
    a: "No appointment needed",
  },
  {
    ic: "♡",
    h: "Pediatrics",
    p: "Well-child visits, immunizations, and growth tracking. Friendly clinicians who specialize in tiny humans.",
    a: "Newborn → 18",
  },
  {
    ic: "∿",
    h: "Mental health",
    p: "Confidential therapy and medication management. Same-week openings — because waiting isn't an option.",
    a: "Sliding scale available",
  },
];

const TODAYS_CALLS = [
  { t: "Refill — Lisinopril", at: "1:24 PM" },
  { t: "Cough, 3 days", at: "2:08 PM" },
  { t: "Reschedule annual", at: "3:11 PM" },
  { t: "Pre-op questions", at: "3:47 PM" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function NorthbrookPage() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState<{ who: "buddy" | "you"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT }));

  // Timer
  useEffect(() => {
    if (!open) return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [open]);

  // Auto-scroll transcript
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [transcript, thinking]);

  function openCall() {
    chat.current.reset();
    setTranscript([]);
    setSeconds(0);
    setOpen(true);
    setTimeout(() => {
      setTranscript((t) => [
        ...t,
        {
          who: "buddy",
          text:
            "Hi — this is Buddy at Northbrook. Are you calling about an appointment, a refill, or something else? I can also help if you're not sure.",
        },
      ]);
    }, 500);
  }

  function closeCall() {
    setOpen(false);
  }

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setTranscript((t) => [...t, { who: "you", text: v }]);
    setInput("");
    setThinking(true);
    const reply = await chat.current.send(v);
    setThinking(false);
    if (reply) setTranscript((t) => [...t, { who: "buddy", text: reply }]);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ["--ink" as string]: "#0E2A3F",
        ["--paper" as string]: "#FCFCFA",
        ["--line" as string]: "#E3E7EA",
        ["--mute" as string]: "#5F7282",
        ["--accent" as string]: "#2F6D8C",
        ["--accent-deep" as string]: "#1F4E68",
        ["--soft" as string]: "#EAF2F6",
        ["--warm" as string]: "#F4D9B8",
        ["--buddy" as string]: "#2FC463",
        ["--buddy-deep" as string]: "#1E9E4B",
        background: "#FCFCFA",
        color: "#0E2A3F",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="border-b border-[#E3E7EA] bg-white sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-7 py-4.5 flex items-center gap-8">
          <div className="flex items-center gap-2.5" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, fontWeight: 500 }}>
            <div className="w-[30px] h-[30px] rounded-full grid place-items-center text-white text-sm font-semibold" style={{ background: "#2F6D8C" }}>+</div>
            <span>Northbrook</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm ml-6">
            {NAV_LINKS.map((l) => (
              <a key={l} className="cursor-pointer hover:text-[#2F6D8C]">{l}</a>
            ))}
          </div>
          <div className="ml-auto flex gap-2.5 items-center">
            <a className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-transparent text-[#0E2A3F] border border-[#E3E7EA] font-medium text-[13.5px] hover:-translate-y-px transition-transform">
              Sign in
            </a>
            <a className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-white font-medium text-[13.5px] hover:-translate-y-px transition-transform" style={{ background: "#2F6D8C" }}>
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#2F6D8C] grid place-items-center text-[9px]">☎</span>
              Book a visit
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-7 pt-15 pb-10 grid md:grid-cols-2 gap-16 items-center w-full">
        <div>
          <div className="text-xs tracking-[0.18em] uppercase text-[#1F4E68] font-medium">
            Family medicine · Since 1998
          </div>
          <h1
            className="font-medium leading-none -tracking-[0.02em] my-5"
            style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(48px, 6.4vw, 82px)" }}
          >
            Trusted care,<br />
            <em className="italic" style={{ color: "#2F6D8C" }}>on your schedule.</em>
          </h1>
          <p className="text-[#5F7282] text-[17px] max-w-[48ch] mb-7 m-0">
            Same-day appointments, virtual visits, and a 24/7 care assistant that books, triages, and answers questions in plain English. Your whole family, one clinic.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={openCall}
              className="inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-white font-medium text-[13.5px] cursor-pointer hover:-translate-y-px transition-transform"
              style={{ background: "#2F6D8C" }}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white grid place-items-center text-[9px]" style={{ color: "#2F6D8C" }}>☎</span>
              Talk to Buddy now
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4.5 py-3 rounded-lg bg-transparent text-[#0E2A3F] border border-[#E3E7EA] font-medium text-[13.5px] cursor-pointer"
            >
              Book online
            </button>
          </div>
        </div>

        {/* Hero card */}
        <div
          className="rounded-3xl p-7 border border-[#E3E7EA]"
          style={{
            background: "linear-gradient(160deg, #EAF2F6, #fff)",
            boxShadow: "0 30px 60px rgba(14,42,63,0.08)",
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full mb-3.5"
            style={{ color: "#1E9E4B", background: "#E8F9EF" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
            3 same-day slots open today
          </span>
          <div className="flex gap-3 items-center pb-3.5 border-b border-[#E3E7EA] mb-2">
            <div
              className="w-12 h-12 rounded-full"
              style={{ background: "linear-gradient(135deg, #F4D9B8, #C8A77B)" }}
            />
            <div>
              <div className="font-medium text-[18px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                Dr. Mira Patel, MD
              </div>
              <div className="text-xs text-[#5F7282]">Family medicine · 12 yrs</div>
            </div>
          </div>
          {[
            { l: "Next available", v: "Today, 2:40 PM" },
            { l: "Visit type", v: "In-person or video" },
            { l: "Average wait", v: "8 minutes" },
            { l: "Insurance", v: "In-network ✓" },
          ].map((row) => (
            <div key={row.l} className="flex justify-between items-baseline border-b border-[#E3E7EA] py-3 last:border-b-0">
              <span className="text-xs text-[#5F7282] tracking-[0.06em] uppercase">{row.l}</span>
              <span className="font-medium" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust band */}
      <div className="border-t border-b border-[#E3E7EA] py-4.5 px-7 text-xs text-[#5F7282]" style={{ background: "#EAF2F6" }}>
        <div className="max-w-[1240px] mx-auto flex justify-between gap-6 flex-wrap">
          <span>
            <b className="text-[#0E2A3F] font-semibold">4.9 ★</b> 2,300+ reviews
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">HIPAA</b> compliant patient portal
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">Same-day</b> appointments, 7 days/week
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">40+</b> insurance plans accepted
          </span>
        </div>
      </div>

      {/* Services */}
      <section className="max-w-[1240px] mx-auto px-7 py-15 w-full">
        <h2 className="font-medium m-0 mb-2 -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 42, fontWeight: 500 }}>
          How we care for you.
        </h2>
        <p className="text-[#5F7282] text-[17px] max-w-[54ch] m-0 mb-8">
          From a sniffle to a chronic concern, we keep things simple. Book in seconds, talk to a real human within minutes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SERVICES.map((s) => (
            <div
              key={s.h}
              className="border border-[#E3E7EA] rounded-2xl p-6 bg-white transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgba(14,42,63,0.08)]"
            >
              <div
                className="w-9 h-9 rounded-[10px] grid place-items-center text-base mb-3.5"
                style={{ background: "#EAF2F6", color: "#2F6D8C" }}
              >
                {s.ic}
              </div>
              <h3 className="m-0 mb-1.5 font-medium text-[20px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {s.h}
              </h3>
              <p className="text-[#5F7282] text-[13.5px] m-0 mb-3">{s.p}</p>
              <div className="flex justify-between text-xs font-medium border-t border-[#E3E7EA] pt-2.5" style={{ color: "#2F6D8C" }}>
                <span>{s.a}</span>
                <span>Learn more →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Care band */}
      <section className="px-7 py-20 mt-10" style={{ background: "#0E2A3F", color: "#fff" }}>
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-[1.2fr_1fr] gap-15 items-center">
          <div>
            <div className="text-xs tracking-[0.16em] uppercase mb-3.5" style={{ color: "#2FC463" }}>
              A new front door
            </div>
            <h2 className="m-0 mb-4.5 font-medium" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48, lineHeight: 1.05 }}>
              Call Buddy<br />before you call us.
            </h2>
            <p className="text-white/70 max-w-[48ch] m-0 mb-5 text-base">
              Buddy is our 24/7 care assistant. It books appointments, triages symptoms against your chart, refills prescriptions, and tells you when something needs a doctor right now. Powered by Buddy Assist — no menus, no holds, just a conversation.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="border-l border-white/[0.18] pl-4">
                <div className="font-medium leading-none -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
                  94%
                </div>
                <div className="text-[11px] text-white/55 tracking-[0.1em] uppercase mt-1.5">First-call resolution</div>
              </div>
              <div className="border-l border-white/[0.18] pl-4">
                <div className="font-medium leading-none -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
                  22s
                </div>
                <div className="text-[11px] text-white/55 tracking-[0.1em] uppercase mt-1.5">Average wait</div>
              </div>
            </div>
          </div>

          <div className="bg-white text-[#0E2A3F] rounded-3xl p-6 flex flex-col gap-3.5" style={{ aspectRatio: "0.7" }}>
            <div className="font-medium text-[22px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              Today&apos;s calls
            </div>
            {TODAYS_CALLS.map((c) => (
              <div
                key={c.t}
                className="px-3 py-2.5 border border-[#E3E7EA] rounded-[10px] flex justify-between text-[13px]"
              >
                <span>{c.t}</span>
                <b className="font-medium">{c.at}</b>
              </div>
            ))}
            <button
              type="button"
              onClick={openCall}
              className="mt-auto rounded-[10px] py-3 text-white font-medium text-sm cursor-pointer text-center"
              style={{ background: "#2F6D8C" }}
            >
              📞 Tap to talk to Buddy
            </button>
          </div>
        </div>
      </section>

      <footer className="px-7 py-10 border-t border-[#E3E7EA] text-xs text-[#5F7282]">
        <div className="max-w-[1240px] mx-auto flex justify-between flex-wrap gap-3.5">
          <span>© 2026 Northbrook Family Clinic — A demo for Buddy Assist.</span>
          <span>Privacy · HIPAA · Accessibility · Patient rights</span>
        </div>
      </footer>

      {/* Call FAB (pill) */}
      <button
        type="button"
        onClick={openCall}
        className="fixed right-6 bottom-6 z-[9000] flex items-center gap-3 pl-2 pr-4.5 py-2 bg-white border border-[#E3E7EA] rounded-full cursor-pointer transition-transform hover:-translate-y-0.5"
        style={{ boxShadow: "0 14px 30px rgba(14,42,63,0.14)" }}
        aria-label="Call Buddy"
      >
        <span
          className="w-11 h-11 rounded-full grid place-items-center"
          style={{ background: "#2FC463", boxShadow: "0 0 0 4px rgba(47,196,99,0.18)" }}
        >
          <Image src="/assets/ba-icon-white.png" alt="" width={22} height={22} className="w-[22px] h-[22px]" />
        </span>
        <span className="flex flex-col leading-[1.15] text-left">
          <b className="text-[13.5px] font-semibold -tracking-[0.005em]">Call Buddy</b>
          <small className="text-[11px] text-[#5F7282] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
            24/7 · 22s avg wait
          </small>
        </span>
      </button>

      {/* Call overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(14,42,63,0.42)",
            backdropFilter: "blur(8px)",
            animation: "ba-open 0.3s ease",
          }}
        >
          <div
            className="bg-white rounded-[28px] overflow-hidden flex flex-col"
            style={{
              width: "min(520px, calc(100vw - 32px))",
              boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
            }}
          >
            {/* Head */}
            <div
              className="px-8 pt-8 pb-6 text-center border-b border-[#E3E7EA]"
              style={{ background: "linear-gradient(180deg, #EAF2F6, #fff)" }}
            >
              <div
                className="w-[104px] h-[104px] rounded-full grid place-items-center mx-auto mb-4"
                style={{
                  background: "#2FC463",
                  animation: "nb-ring-pulse 1.8s ease-out infinite",
                }}
              >
                <Image src="/assets/ba-icon-white.png" alt="" width={50} height={50} />
              </div>
              <h3
                className="font-medium m-0 mb-1 text-[26px] -tracking-[0.01em]"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                Buddy · Northbrook
              </h3>
              <div className="text-[13px] text-[#5F7282] inline-flex items-center gap-1.5">
                <span className="w-[7px] h-[7px] rounded-full bg-[#2FC463]" />
                Connected · listening
              </div>
              <div className="text-sm text-[#5F7282] mt-2" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {pad(mins)}:{pad(secs)}
              </div>
            </div>

            {/* Wave */}
            <div className="h-12 flex items-center justify-center gap-[3px] px-7">
              {Array.from({ length: 12 }, (_, i) => {
                const delay = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.4, 0.32, 0.24, 0.16, 0.08][i];
                return (
                  <span
                    key={i}
                    className="rounded-sm"
                    style={{
                      width: 3,
                      background: "#2FC463",
                      animation: thinking || transcript.length > 0
                        ? `nb-wave 1.1s ease-in-out infinite ${delay}s`
                        : "none",
                      height: thinking || transcript.length > 0 ? undefined : 6,
                      opacity: thinking || transcript.length > 0 ? undefined : 0.35,
                    }}
                  />
                );
              })}
            </div>

            {/* Body */}
            <div ref={bodyRef} className="px-7 py-6 max-h-[42vh] overflow-y-auto flex flex-col gap-3.5">
              {transcript.map((t, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className="text-[11px] tracking-[0.08em] uppercase font-medium flex-shrink-0 pt-1 w-[54px]"
                    style={{ color: t.who === "buddy" ? "#1E9E4B" : "#5F7282" }}
                  >
                    {t.who === "buddy" ? "Buddy" : "You"}
                  </div>
                  <div
                    className="text-[14.5px] leading-[1.55] flex-1 whitespace-pre-wrap"
                    style={{
                      color: t.who === "buddy" ? "#0E2A3F" : "#5F7282",
                      fontStyle: t.who === "you" ? "italic" : "normal",
                    }}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3 items-start">
                  <div className="text-[11px] tracking-[0.08em] uppercase font-medium flex-shrink-0 pt-1 w-[54px]" style={{ color: "#1E9E4B" }}>
                    Buddy
                  </div>
                  <div className="flex gap-1 pt-2">
                    <span className="typing-dot" style={{ background: "#2FC463" }} />
                    <span className="typing-dot" style={{ background: "#2FC463", animationDelay: ".15s" }} />
                    <span className="typing-dot" style={{ background: "#2FC463", animationDelay: ".3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="px-7 pb-2 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type instead of speaking..."
                autoComplete="off"
                className="flex-1 border border-[#E3E7EA] rounded-full px-4.5 py-3 text-sm outline-none focus:border-[#2F6D8C]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="border-0 text-white rounded-full px-5.5 font-medium text-[13px] cursor-pointer disabled:opacity-40"
                style={{ background: "#2F6D8C" }}
              >
                Send
              </button>
            </form>

            {/* Controls */}
            <div className="px-6 py-4.5 flex justify-center gap-3 border-t border-[#E3E7EA]">
              <button
                type="button"
                title="Mute"
                className="w-[54px] h-[54px] rounded-full border-0 cursor-pointer grid place-items-center text-lg"
                style={{ background: "#EAF2F6", color: "#1F4E68" }}
              >
                ⏸
              </button>
              <button
                type="button"
                onClick={closeCall}
                title="End call"
                className="w-[62px] h-[62px] rounded-full border-0 cursor-pointer grid place-items-center text-2xl text-white hover:bg-[#B53737]"
                style={{ background: "#D14545" }}
              >
                ✕
              </button>
              <button
                type="button"
                title="Keypad"
                className="w-[54px] h-[54px] rounded-full border-0 cursor-pointer grid place-items-center text-lg"
                style={{ background: "#EAF2F6", color: "#1F4E68" }}
              >
                ⌗
              </button>
            </div>

            <div className="text-center px-2.5 py-2.5 text-[11px] text-[#5F7282]" style={{ background: "#EAF2F6" }}>
              Demo line · powered by <b style={{ color: "#1E9E4B" }}>Buddy Assist</b> · no real PHI is stored
            </div>
          </div>
        </div>
      )}

      <IndustrySwitcher currentSlug="northbrook" />

      <style jsx>{`
        @keyframes nb-ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(47,196,99,0.45); }
          70% { box-shadow: 0 0 0 28px rgba(47,196,99,0); }
          100% { box-shadow: 0 0 0 0 rgba(47,196,99,0); }
        }
        @keyframes nb-wave {
          0%, 100% { height: 8px; opacity: 0.4; }
          50% { height: 36px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
