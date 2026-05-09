"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat, mdInline } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";

const SYSTEM_PROMPT = `
You are Buddy, the support copilot inside Helix Support — a helpdesk for SaaS customer support agents.
Active ticket #4821: customer Maya Chen (CTO, Acme Corp, Pro plan, churn flag) reports webhooks failing with 502 on staging, started 10:14 UTC. Other Pro customers (#4819, #4817) have similar symptoms.
Likely cause: a Cloudflare WAF rule "challenge_bot_v2" rolled out 10:11 UTC matching our outbound webhook user-agent.
Patch ETA: 10:55 UTC (UA bump). Workaround: customer adds WAF allow-rule for "Helix-Webhook/2".
You are a copilot for the AGENT (the human reading this) — not the customer. The agent will paste/edit your drafts before sending. Speak to the agent in second person ("you can…", "I'd suggest…"). When asked to draft a reply, address it to the customer (Maya). Be concise, action-first, and cite ticket numbers and times when relevant. Keep replies tight (3-5 short paragraphs).
`.trim();

const TICKETS = [
  {
    name: "Maya Chen",
    time: "2m",
    subj: "Webhooks failing on Acme staging — 502 since 10:14",
    preview: "Hey team, getting a 502 from /v2/webhooks every minute…",
    pri: "high",
    priLabel: "High",
    id: "#4821",
    org: "Acme Corp · Pro",
    active: true,
  },
  {
    name: "Diego Park",
    time: "14m",
    subj: "Cannot delete archived workspace",
    preview: "When I click Delete it just spins and times out.",
    pri: "med",
    priLabel: "Med",
    id: "#4820",
    org: "Northbrook",
  },
  {
    name: "Sage Williams",
    time: "1h",
    subj: "Billing — switched plan, charged twice",
    preview: "I upgraded last Monday and was charged on both plans.",
    pri: "high",
    priLabel: "High",
    id: "#4818",
    org: "Lakeside Studio",
  },
  {
    name: "Tomas Reyes",
    time: "2h",
    subj: "SSO loop after Okta migration",
    preview: "After login I get redirected back to the SSO page…",
    pri: "med",
    priLabel: "Med",
    id: "#4815",
    org: "Quantum Labs",
  },
  {
    name: "Iris Bauer",
    time: "3h",
    subj: "Export to CSV missing rows after May 1",
    preview: "Hi — I noticed the export only contains entries up to…",
    pri: "low",
    priLabel: "Low",
    id: "#4811",
    org: "Gildenhall",
  },
  {
    name: "Renée Voss",
    time: "5h",
    subj: "Slow API responses — EU region",
    preview: "P95 has been around 1.8s all afternoon.",
    pri: "med",
    priLabel: "Med",
    id: "#4806",
    org: "Pelican Foods",
  },
];

const INITIAL_DRAFT = `Hi Maya — thanks for the details, that's super helpful.

We've identified the cause: a Cloudflare WAF rule that rolled out at 10:11 UTC is matching our outbound webhook user-agent and returning 502s on a subset of customer endpoints. Three other Pro customers on Fly.io have reported the same symptom in the last 20 minutes.

Two options for you right now:
  1.  Add a WAF allow-rule for User-Agent "Helix-Webhook/2" on your staging endpoint — fastest fix, ~2 min.
  2.  Wait for our patch — we're deploying a UA bump that bypasses the rule at 10:55 UTC (~20 min).

Either way, queued deliveries will replay automatically once the path clears. I'll keep this ticket open and ping you the moment the patch goes out. Sorry for the disruption.

— [Your name]`;

const STREAM = [
  {
    role: "customer" as const,
    who: "Maya Chen · Acme Corp · 10:24",
    body: (
      <>
        Hey team — webhook deliveries to our staging endpoint started failing about 10 minutes ago. We&apos;re getting 502s on every retry from /v2/webhooks. Nothing on our side changed; backend deploy was 4 days ago. Endpoint hash:{" "}
        <span style={{ fontFamily: "var(--font-mono), monospace" }}>whk_9aJ2…</span> — the same hash works fine on production.
      </>
    ),
    time: "10:24 AM",
  },
  {
    role: "agent" as const,
    who: "You · Helix Support · 10:31",
    body:
      "Hi Maya — looking now, give me a few minutes. Do you remember when the staging endpoint was last redeployed on your side, and is it sitting behind Cloudflare or the same load balancer as prod?",
    time: "10:31 AM",
  },
  {
    role: "customer" as const,
    who: "Maya Chen · 10:33",
    body: "Staging redeployed last Friday. It's behind a different LB than prod (Fly.io app, single region IAD). Same WAF rules though.",
    time: "10:33 AM",
  },
];

export default function HelixPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [bubbles, setBubbles] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [ask, setAsk] = useState("");
  const bbodyRef = useRef<HTMLDivElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("helix") }));

  useEffect(() => {
    if (bbodyRef.current) bbodyRef.current.scrollTop = bbodyRef.current.scrollHeight;
  }, [bubbles, typing]);

  async function send(text: string, asDraft: boolean) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setBubbles((b) => [...b, { role: "user", text: v }]);
    setAsk("");
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(v, {
      onToken: (full) => {
        setTyping(false);
        setBubbles((b) => {
          if (botIdx === -1) {
            const next = [...b, { role: "bot" as const, text: full }];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...b];
          next[botIdx] = { ...next[botIdx], text: full };
          return next;
        });
        if (asDraft) setDraft(full);
      },
    });
  }

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: collapsed ? "64px 280px 1fr 0px" : "64px 280px 1fr 380px",
        transition: "grid-template-columns 0.25s cubic-bezier(0.2,0.8,0.2,1)",
        ["--ink" as string]: "#0E1116",
        ["--paper" as string]: "#fff",
        ["--bg" as string]: "#F6F7F9",
        ["--line" as string]: "#E4E7EC",
        ["--mute" as string]: "#5C6470",
        ["--accent" as string]: "#0F62FE",
        ["--accent-d" as string]: "#0044C9",
        ["--warn" as string]: "#E55C5C",
        ["--good" as string]: "#10B981",
        ["--amber" as string]: "#F59E0B",
        ["--buddy" as string]: "#2FC463",
        ["--buddy-deep" as string]: "#1E9E4B",
        background: "#F6F7F9",
        color: "#0E1116",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Rail */}
      <div className="bg-[#0E1116] text-white flex flex-col items-center py-3.5 gap-1.5">
        <div
          className="w-9 h-9 rounded-[9px] grid place-items-center text-base font-bold mb-2"
          style={{ background: "#0F62FE", fontFamily: "var(--font-geist), sans-serif" }}
        >
          H
        </div>
        {[
          { ic: "⌂" },
          { ic: "✉", active: true },
          { ic: "☎" },
          { ic: "⊞" },
          { ic: "⌘" },
        ].map((x, i) => (
          <button
            key={i}
            type="button"
            className="w-9 h-9 rounded-lg grid place-items-center text-sm cursor-pointer"
            style={{
              background: x.active ? "rgba(15,98,254,0.2)" : "transparent",
              color: x.active ? "#fff" : "rgba(255,255,255,0.7)",
            }}
          >
            {x.ic}
          </button>
        ))}
        <div className="mt-auto w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg, #F4A261, #E76F51)" }} />
      </div>

      {/* List */}
      <div className="bg-white border-r border-[#E4E7EC] flex flex-col overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#E4E7EC] flex flex-col gap-2">
          <h2 className="font-semibold text-base m-0" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            Inbox <span className="text-[#5C6470] font-normal text-[12.5px]">· 26 open</span>
          </h2>
          <div className="flex gap-1.5 text-[11.5px] text-[#5C6470]">
            {["Mine", "Team", "Unassigned", "SLA risk"].map((f, i) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full cursor-pointer"
                style={{
                  background: i === 0 ? "#0E1116" : "#F6F7F9",
                  color: i === 0 ? "#fff" : "#5C6470",
                }}
              >
                {f}
              </span>
            ))}
          </div>
          <input
            placeholder="Search tickets, customers…"
            className="px-2.5 py-1.5 border border-[#E4E7EC] rounded-md text-[12.5px] outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {TICKETS.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 border-b border-[#E4E7EC] cursor-pointer flex flex-col gap-1 ${
                t.active ? "bg-[#EFF4FF] border-l-[3px] !pl-[13px]" : "hover:bg-[#FAFBFC]"
              }`}
              style={{ borderLeftColor: t.active ? "#0F62FE" : undefined }}
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold text-[13px]">{t.name}</span>
                <span className="text-[11px] text-[#5C6470]">{t.time}</span>
              </div>
              <div className="text-[12.5px] truncate">{t.subj}</div>
              <div className="text-[11.5px] text-[#5C6470] truncate">{t.preview}</div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#5C6470]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: t.pri === "high" ? "#E55C5C" : t.pri === "med" ? "#F59E0B" : "#5C6470",
                  }}
                />
                {t.priLabel} · {t.id} · {t.org}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex flex-col bg-[#F6F7F9] min-w-0">
        <div className="px-6 py-3.5 bg-white border-b border-[#E4E7EC] flex items-center gap-3.5">
          <div>
            <h2 className="font-semibold text-base m-0" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Webhooks failing on Acme staging — 502 since 10:14
            </h2>
            <div className="text-xs text-[#5C6470] mt-0.5">
              #4821 · Maya Chen, Acme Corp · opened 12 min ago ·{" "}
              <span className="font-semibold" style={{ color: "#E55C5C" }}>
                SLA in 48 min
              </span>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button type="button" className="px-3 py-1.5 rounded-md border border-[#E4E7EC] bg-white text-[12.5px] font-medium cursor-pointer">
              Assign
            </button>
            <button type="button" className="px-3 py-1.5 rounded-md border border-[#E4E7EC] bg-white text-[12.5px] font-medium cursor-pointer">
              Snooze
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer inline-flex items-center gap-1.5"
              style={{
                border: collapsed ? "1px solid #E4E7EC" : "1px solid #2FC463",
                background: collapsed ? "#fff" : "rgba(47,196,99,0.06)",
                color: collapsed ? "#5C6470" : "#1E9E4B",
              }}
            >
              ⊞ Buddy
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {STREAM.map((m, i) => (
            <div
              key={i}
              className="max-w-[560px] p-3.5 rounded-[10px] border text-[13.5px] leading-[1.55]"
              style={{
                alignSelf: m.role === "agent" ? "flex-end" : "flex-start",
                background: m.role === "agent" ? "#E8F0FE" : "#fff",
                borderColor: m.role === "agent" ? "#CBDDFB" : "#E4E7EC",
              }}
            >
              <div className="text-[11.5px] font-semibold text-[#5C6470] mb-1.5 flex items-center gap-1.5">
                <span
                  className="w-[18px] h-[18px] rounded-full"
                  style={{
                    background:
                      m.role === "agent"
                        ? "linear-gradient(135deg, #0F62FE, #0044C9)"
                        : "linear-gradient(135deg, #F4A261, #E76F51)",
                  }}
                />
                {m.who}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <time className="block text-[11px] text-[#5C6470] mt-1.5">{m.time}</time>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E4E7EC] bg-white px-6 py-3.5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply… (Buddy can draft from the right panel)"
            className="w-full border border-[#E4E7EC] rounded-lg px-3.5 py-3 text-[13.5px] min-h-[90px] resize-y outline-none focus:border-[#0F62FE]"
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1.5 text-xs text-[#5C6470]">
              <span>📎 Attach</span>
              <span>{`{ } Snippet`}</span>
              <span>≡ Macros</span>
            </div>
            <div className="ml-auto flex gap-2">
              <button type="button" className="px-3 py-1.5 rounded-md border border-[#E4E7EC] bg-white text-[12.5px] font-medium cursor-pointer">
                Save draft
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-white text-[12.5px] font-medium cursor-pointer"
                style={{ background: "#0E1116", borderColor: "#0E1116" }}
              >
                Send reply →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buddy panel */}
      <aside
        className={`bg-white border-l border-[#E4E7EC] flex flex-col overflow-hidden ${collapsed ? "hidden" : ""}`}
      >
        <div className="px-4.5 py-3.5 border-b border-[#E4E7EC] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg grid place-items-center text-white font-semibold text-[14px]" style={{ background: "#0F62FE", fontFamily: "var(--font-geist), sans-serif" }}>
            H
          </div>
          <div>
            <h3 className="m-0 font-semibold text-[14.5px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Helix Assistant
            </h3>
            <div className="text-[11.5px] text-[#5C6470]">Reading ticket #4821 + Acme history</div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="ml-auto bg-transparent border-0 cursor-pointer text-[#5C6470] text-base w-7 h-7 rounded-md hover:bg-[#F6F7F9]"
          >
            ×
          </button>
        </div>

        <div className="px-4.5 py-3 border-b border-[#E4E7EC]" style={{ background: "#FBFBFD" }}>
          <div className="text-[10px] tracking-[0.1em] uppercase text-[#5C6470] font-semibold mb-1.5">Context loaded</div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { l: "Ticket #4821", active: true },
              { l: "Acme Corp · 14 prior" },
              { l: "webhooks docs" },
              { l: "incidents.log" },
            ].map((c) => (
              <span
                key={c.l}
                className="px-2 py-0.5 rounded text-[11px]"
                style={{
                  background: c.active ? "#0F62FE" : "#EEF0F4",
                  color: c.active ? "#fff" : "#0E1116",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {c.l}
              </span>
            ))}
          </div>
        </div>

        <div ref={bbodyRef} className="flex-1 overflow-y-auto px-4.5 py-3.5 flex flex-col gap-3.5">
          {/* Customer signal */}
          <div className="p-3.5 rounded-[10px] border border-[#E4E7EC]" style={{ background: "#FBFBFD" }}>
            <h4 className="m-0 mb-2 font-semibold text-[13px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Customer signal
            </h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[12.5px] items-center">
              <span className="text-[11.5px] text-[#5C6470] uppercase tracking-[0.04em]">Plan</span>
              <span className="font-medium">Pro · $890/mo</span>
              <span className="text-[11.5px] text-[#5C6470] uppercase tracking-[0.04em]">CSAT</span>
              <span className="font-medium" style={{ color: "#10B981" }}>96% · 18 tickets</span>
              <span className="text-[11.5px] text-[#5C6470] uppercase tracking-[0.04em]">Health</span>
              <span className="font-medium" style={{ color: "#E55C5C" }}>At risk · churn flag</span>
              <span className="text-[11.5px] text-[#5C6470] uppercase tracking-[0.04em]">Owner</span>
              <span className="font-medium">Maya Chen, CTO</span>
            </div>
          </div>

          {/* Likely cause */}
          <div className="p-3.5 rounded-[10px] border border-[#E4E7EC]" style={{ background: "#FBFBFD" }}>
            <h4 className="m-0 mb-2 font-semibold text-[13px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Likely cause
            </h4>
            <div className="text-[13px] leading-[1.55]">
              <b>Cloudflare WAF rule &quot;challenge_bot_v2&quot;</b> rolled out at 10:11 UTC matches our webhook user-agent. Three other Pro customers on Fly.io reported similar 502s in the last 20 min (#4819, #4817, this ticket).
            </div>
            <div className="mt-2.5 text-[11.5px] text-[#5C6470]">
              Confidence: <b style={{ color: "#10B981" }}>High (87%)</b> · Pattern matched against incidents.log
            </div>
          </div>

          {/* Drafted reply */}
          <div className="p-3.5 rounded-[10px]" style={{ border: "1px dashed rgba(47,196,99,0.5)", background: "rgba(47,196,99,0.05)" }}>
            <div className="flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] uppercase font-semibold mb-2" style={{ color: "#1E9E4B" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2FC463" }} />
              Drafted reply · review before sending
            </div>
            <div className="text-[13px] leading-[1.55] whitespace-pre-wrap text-[#0E1116]" dangerouslySetInnerHTML={{ __html: mdInline(draft) }} />
            <div className="flex gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => setReply(draft.trim())}
                className="px-2.5 py-1 rounded text-[11.5px] cursor-pointer font-medium text-white"
                style={{ background: "#0E1116", borderColor: "#0E1116" }}
              >
                Use draft
              </button>
              <button
                type="button"
                onClick={() => send("Regenerate the reply to Maya for ticket #4821 — concise, two-option, slightly warmer tone.", true)}
                className="px-2.5 py-1 rounded border border-[#E4E7EC] bg-white text-[11.5px] cursor-pointer font-medium"
              >
                Regenerate
              </button>
              <button type="button" className="px-2.5 py-1 rounded border border-[#E4E7EC] bg-white text-[11.5px] cursor-pointer font-medium">
                Edit tone
              </button>
            </div>
          </div>

          {/* Suggested macros */}
          <div className="p-3.5 rounded-[10px] border border-[#E4E7EC]" style={{ background: "#FBFBFD" }}>
            <h4 className="m-0 mb-2 font-semibold text-[13px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Suggested macros
            </h4>
            <div className="flex flex-col gap-1.5 text-[13px]">
              {[
                "“Webhook 502 — WAF UA”",
                "“Apologize + status link”",
                "“Schedule postmortem”",
              ].map((m) => (
                <div key={m} className="flex justify-between items-center">
                  <span>{m}</span>
                  <button type="button" className="px-2 py-0.5 rounded border border-[#E4E7EC] bg-white text-[11px] cursor-pointer">
                    Insert
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation bubbles */}
          {bubbles.map((b, i) => (
            <div key={i} className="p-3.5 rounded-[10px] border" style={{ borderColor: b.role === "user" ? "#0F62FE" : "#E4E7EC", background: "#FBFBFD" }}>
              <h4
                className="m-0 mb-2 font-semibold text-[13px]"
                style={{
                  color: b.role === "user" ? "#0044C9" : "#0E1116",
                  fontFamily: "var(--font-geist), sans-serif",
                }}
              >
                {b.role === "user" ? "You" : "Buddy"}
              </h4>
              <div className="text-[13px] leading-[1.55] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: mdInline(b.text) }} />
            </div>
          ))}
          {typing && (
            <div className="p-3.5 rounded-[10px] border border-[#E4E7EC]" style={{ background: "#FBFBFD" }}>
              <h4 className="m-0 mb-2 font-semibold text-[13px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Helix
              </h4>
              <div className="flex gap-1 py-1.5">
                <span className="typing-dot" style={{ background: "#5C6470" }} />
                <span className="typing-dot" style={{ background: "#5C6470", animationDelay: ".15s" }} />
                <span className="typing-dot" style={{ background: "#5C6470", animationDelay: ".3s" }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-4.5 py-3 border-t border-[#E4E7EC] flex items-start gap-2" style={{ background: "#FBFBFD" }}>
          <textarea
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(ask, false);
              }
            }}
            placeholder="Ask Buddy or refine the draft…"
            className="flex-1 border border-[#E4E7EC] rounded-lg px-3 py-2.5 text-[13px] resize-none h-9 outline-none focus:border-[#0F62FE] focus:h-20 transition-[height] duration-200"
          />
          <button
            type="button"
            onClick={() => send(ask, false)}
            className="px-3 py-2 rounded-lg text-white border-0 cursor-pointer text-[13px] font-medium"
            style={{ background: "#0E1116" }}
          >
            Ask
          </button>
        </div>
      </aside>

      {/* Reopen tab */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed right-0 top-1/2 -translate-y-1/2 text-white px-2 py-3.5 rounded-l-lg text-xs font-semibold cursor-pointer"
          style={{
            background: "#2FC463",
            writingMode: "vertical-rl",
            fontFamily: "var(--font-geist), sans-serif",
          }}
        >
          ⊞ Buddy
        </button>
      )}

      <IndustrySwitcher currentSlug="helix" />
    </div>
  );
}
