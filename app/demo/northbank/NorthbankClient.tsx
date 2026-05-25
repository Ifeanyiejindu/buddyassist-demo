"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat, mdInline } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";
import type {
  NbAccount,
  NbCustomer,
  NbTransaction,
  NbStatement,
} from "@/lib/demoApi";

interface NorthbankClientProps {
  /** The "logged in" customer (the page treats Eleanor Vance as the user). */
  customer: NbCustomer | null;
  /** All accounts this customer owns. */
  accounts: NbAccount[];
  /** Recent transactions on the primary checking account. */
  transactions: NbTransaction[];
  /** Categorised statement summary for the primary account. */
  statement: NbStatement | null;
}

// Pretty USD without losing cents on small numbers.
function money(n: number, opts?: { signed?: boolean }): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (opts?.signed && n > 0) return `+$${formatted}`;
  if (n < 0) return `−$${formatted}`;
  return `$${formatted}`;
}

// Friendly account label for the sidebar / chat references.
function accountLabel(a: NbAccount): string {
  const word =
    a.type === "checking"
      ? "Everyday Checking"
      : a.type === "savings"
        ? "High-Yield Savings"
        : a.type === "brokerage"
          ? "Brokerage"
          : "Account";
  // Show the last 4 of the number so the user can tell duplicates apart.
  const tail = a.accountNumber.split("-").pop() || a.accountNumber;
  return `${word} · ${tail}`;
}

// Tiny merchant-icon lookup so the transaction list doesn't look bare.
function txnIcon(category: string): string {
  return {
    groceries: "🛒",
    dining: "🍽",
    transport: "⛽",
    utilities: "💡",
    shopping: "📦",
    income: "↗",
  }[category] || "•";
}

function relativeWhen(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// TXNS now come from the live API via props — see NorthbankClientProps.

const QUICKS = [
  { lbl: "Spending", q: "Where am I overspending vs last month? Be specific." },
  { lbl: "Goal math", q: "If I move $1,500 a month from checking to savings, can I hit my $80k down payment by Q2 2027?" },
  { lbl: "Subscriptions", q: "List my 11 subscriptions and which 3 you'd cancel. Estimate annual savings." },
  { lbl: "Cash flow", q: "My credit card has $1,247 due May 22. What's the smartest way to pay it given my cash flow?" },
  { lbl: "Cash mgmt", q: "Should I move $20k of brokerage cash into 4-week T-bills at 5.2% or stay in HYSA at 4.4%?" },
];

export default function NorthbankClient({
  customer,
  accounts,
  transactions,
  statement,
}: NorthbankClientProps) {
  const firstName = customer?.name?.split(" ")[0] || "there";
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const primaryAccount =
    accounts.find((a) => a.type === "checking") || accounts[0] || null;

  // Build the system prompt from REAL data so the bot's snapshot matches
  // the dashboard exactly. The bot can still call the connectors mid-
  // conversation for fresher numbers or other accounts.
  const accountsLine = accounts
    .map((a) => `${accountLabel(a)} ${money(a.balance)}`)
    .join("; ");
  const stmtLine = statement
    ? `This month on ${primaryAccount?.accountNumber}: ${money(statement.totalIncome)} income, ${money(statement.totalSpending)} spending, net ${money(statement.net, { signed: true })}.`
    : "";
  const SYSTEM_PROMPT = `You are Buddy, the private banking assistant for ${customer?.name || "this customer"} inside Northbank — a personal banking & wealth app.
Snapshot: total balance ${money(totalBalance)} across ${accounts.length} account(s). ${accountsLine}.
${stmtLine}
You are CONSERVATIVE, accurate, and clear. Always show simple math (monthly $ × months) when projecting. Be honest if a goal looks unrealistic.
You CANNOT move money or cancel anything yourself — phrase actions as "I'll prep this for your approval" or "I can draft the cancellations for you to confirm." Mention 2FA when sensitive actions come up.
Don't give specific investment advice ("you should buy AAPL"). General cash-management framing (HYSA vs T-bills, fees, taxes at high level) is fine.
Format: 2-4 short paragraphs, conversational, no bullet markdown. Round dollars to whole numbers in projections.`;

  const [collapsed, setCollapsed] = useState(false);
  const [hideQuicks, setHideQuicks] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string; src?: boolean }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bbodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("northbank") }));

  useEffect(() => {
    if (bbodyRef.current) bbodyRef.current.scrollTop = bbodyRef.current.scrollHeight;
  }, [messages, typing]);

  function open() {
    setCollapsed(false);
    setTimeout(() => inputRef.current?.focus(), 200);
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
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: collapsed ? "240px 1fr 0" : "240px 1fr 400px",
        transition: "grid-template-columns 0.25s",
        ["--ink" as string]: "#0A1628",
        ["--paper" as string]: "#fff",
        ["--bg" as string]: "#F4F6FA",
        ["--line" as string]: "#DCE2EB",
        ["--mute" as string]: "#5C6878",
        ["--navy" as string]: "#0E2A47",
        ["--gold" as string]: "#C9A75A",
        ["--good" as string]: "#1F8A5B",
        ["--warn" as string]: "#C2453D",
        background: "#F4F6FA",
        color: "#0A1628",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside className="bg-[#0E2A47] text-white p-5 flex flex-col gap-1.5 overflow-y-auto">
        <div className="flex items-center gap-2.5 font-semibold text-[18px] px-2 py-1.5 tracking-[0.04em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
          <div
            className="w-[30px] h-[30px] rounded-lg grid place-items-center text-[#0E2A47] font-bold text-sm"
            style={{ background: "#C9A75A", fontFamily: "var(--font-geist), sans-serif" }}
          >
            N
          </div>
          NORTHBANK
        </div>

        <div className="text-[10px] tracking-[0.14em] uppercase text-white/40 px-2 pt-3.5 pb-1">Banking</div>
        <nav className="flex flex-col gap-px">
          {[
            { ic: "⌂", l: "Overview", active: true },
            { ic: "↔", l: "Transfer" },
            { ic: "⊟", l: "Pay & Bills" },
            { ic: "⌂", l: "Mortgages" },
            { ic: "⊕", l: "Cards" },
          ].map((it, i) => (
            <a
              key={i}
              className={`px-3 py-2.5 rounded-md text-[13.5px] flex items-center gap-2.5 cursor-pointer ${
                it.active ? "text-white border-l-2" : "text-white/[0.78] hover:bg-white/[0.06]"
              }`}
              style={{
                background: it.active ? "rgba(201,167,90,0.15)" : undefined,
                borderColor: it.active ? "#C9A75A" : undefined,
                paddingLeft: it.active ? 10 : undefined,
              }}
            >
              {it.ic} {it.l}
            </a>
          ))}
        </nav>

        <div className="text-[10px] tracking-[0.14em] uppercase text-white/40 px-2 pt-3.5 pb-1">Wealth</div>
        <nav className="flex flex-col gap-px">
          {[
            { ic: "↗", l: "Investments" },
            { ic: "⊞", l: "Retirement" },
            { ic: "⊕", l: "Goals" },
          ].map((it) => (
            <a key={it.l} className="px-3 py-2.5 rounded-md text-[13.5px] text-white/[0.78] hover:bg-white/[0.06] cursor-pointer flex items-center gap-2.5">
              {it.ic} {it.l}
            </a>
          ))}
        </nav>

        <div className="text-[10px] tracking-[0.14em] uppercase text-white/40 px-2 pt-3.5 pb-1">Your accounts</div>
        <div className="mt-2.5 flex flex-col gap-1.5 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          {accounts.length === 0 ? (
            <div className="text-[11px] text-white/50">No accounts on file.</div>
          ) : (
            accounts.map((a) => (
              <Link
                key={a.accountNumber}
                href={`/demo/northbank/account/${a.accountNumber}`}
                className="flex justify-between text-xs no-underline text-inherit hover:text-white px-1.5 py-1 -mx-1.5 rounded hover:bg-white/[0.05]"
              >
                <span className="text-white/70">{accountLabel(a)}</span>
                <span
                  className="font-medium"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: a.status === "frozen" ? "#C2453D" : undefined,
                  }}
                >
                  {money(a.balance)}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="mt-auto pt-3 px-2 border-t border-white/[0.08] flex items-center gap-2.5 text-[12.5px]">
          <div className="w-7 h-7 rounded-full" style={{ background: "linear-gradient(135deg, #C9A75A, #8C6E33)" }} />
          <div>
            <div className="font-semibold">{customer?.name || "Welcome"}</div>
            <div className="text-white/50 text-[10.5px]">
              {customer
                ? `Member since ${new Date(customer.memberSince).getFullYear()}`
                : ""}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="overflow-y-auto px-9 py-7">
        <div className="flex justify-between items-center mb-1.5">
          <div>
            <h1 className="m-0 font-semibold text-[28px] -tracking-[0.015em]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Welcome back, {firstName}
            </h1>
            <div className="text-[#5C6878] text-[13px] mt-1.5">
              {customer
                ? `Credit score ${customer.creditScore} · member since ${new Date(customer.memberSince).getFullYear()}`
                : "Welcome to Northbank"}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-3.5 py-2 rounded-md border border-[#DCE2EB] bg-white text-[12.5px] cursor-pointer font-medium">
              Statements
            </button>
            <button type="button" className="px-3.5 py-2 rounded-md border border-[#DCE2EB] bg-white text-[12.5px] cursor-pointer font-medium">
              Help
            </button>
            <button
              type="button"
              onClick={open}
              className="px-3.5 py-2 rounded-md text-white text-[12.5px] cursor-pointer font-medium"
              style={{ background: "#0E2A47", borderColor: "#0E2A47" }}
            >
              Ask Buddy →
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div
          className="mt-6 rounded-xl px-8 py-7 grid items-center gap-6 relative overflow-hidden text-white"
          style={{
            background: "linear-gradient(135deg, #0E2A47 0%, #16365A 100%)",
            gridTemplateColumns: "1fr auto",
          }}
        >
          <div
            className="absolute -right-10 -top-10 w-60 h-60 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(201,167,90,0.18), transparent 70%)" }}
          />
          <div className="relative">
            <div className="text-[11.5px] tracking-[0.14em] uppercase text-white/60">Total balance</div>
            <div className="font-semibold text-[46px] -tracking-[0.02em] mt-1.5" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              ${Math.floor(totalBalance).toLocaleString()}
              <small className="text-[22px] text-white/60 font-normal ml-1.5">
                .{(totalBalance % 1).toFixed(2).slice(2)}
              </small>
            </div>
            <div className="text-[12.5px] text-white/70 mt-1.5">
              {statement && (
                <>
                  <b style={{ color: statement.net >= 0 ? "#C9A75A" : "#C2453D" }}>
                    {money(statement.net, { signed: true })} this month
                  </b>
                  {" · "}
                </>
              )}
              across {accounts.length} account{accounts.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex gap-2 items-center relative">
            <button type="button" className="px-3.5 py-2.5 rounded-md text-white text-[12.5px] cursor-pointer flex items-center gap-1.5 hover:bg-white/[0.12]" style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)" }}>
              ↔ Transfer
            </button>
            <button type="button" className="px-3.5 py-2.5 rounded-md text-white text-[12.5px] cursor-pointer flex items-center gap-1.5 hover:bg-white/[0.12]" style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)" }}>
              ⊟ Pay bill
            </button>
            <button type="button" className="px-3.5 py-2.5 rounded-md text-[12.5px] cursor-pointer font-semibold" style={{ background: "#C9A75A", color: "#0E2A47", borderColor: "#C9A75A" }}>
              + Move to savings
            </button>
          </div>
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          {/* Recent transactions — live from the API */}
          <div className="bg-white border border-[#DCE2EB] rounded-[10px] p-4.5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="m-0 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                Recent transactions
              </h3>
              {primaryAccount && (
                <Link
                  href={`/demo/northbank/account/${primaryAccount.accountNumber}`}
                  className="text-[11px] text-[#0E2A47] no-underline hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="text-[11.5px] text-[#5C6878] mb-3">
              {primaryAccount ? accountLabel(primaryAccount) : "No account"}
            </div>
            {transactions.length === 0 ? (
              <div className="py-6 text-center text-[12.5px] text-[#5C6878]">
                No recent activity.
              </div>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {transactions.slice(0, 5).map((t, i, arr) => {
                    const isLast = i === arr.length - 1;
                    const pos = t.amount > 0;
                    return (
                      <tr key={t.txnId}>
                        <td className={`py-2.5 ${!isLast ? "border-b border-[#DCE2EB]" : ""}`}>
                          <span className="inline-grid place-items-center w-[30px] h-[30px] rounded-lg mr-2.5 align-middle text-sm" style={{ background: "#F4F6FA" }}>
                            {txnIcon(t.category)}
                          </span>
                          <span className="font-medium">{t.merchant}</span>{" "}
                          <span className="text-[11.5px] text-[#5C6878]">{relativeWhen(t.date)}</span>
                        </td>
                        <td
                          className={`py-2.5 text-right font-medium ${!isLast ? "border-b border-[#DCE2EB]" : ""} ${pos ? "text-[#1F8A5B]" : ""}`}
                          style={{ fontFamily: "var(--font-mono), monospace" }}
                        >
                          {money(t.amount, { signed: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Spending donut */}
          <div className="bg-white border border-[#DCE2EB] rounded-[10px] p-4.5">
            <h3 className="m-0 mb-1 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Spending breakdown
            </h3>
            <div className="text-[11.5px] text-[#5C6878] mb-3">
              {statement
                ? `${money(statement.totalSpending)} spent · ${statement.transactionCount} txns`
                : "No statement yet"}
            </div>
            {(() => {
              const spending = statement?.totalSpending || 0;
              const income = statement?.totalIncome || 0;
              const ratio = income > 0 ? Math.min(1, spending / income) : 0;
              const dash = Math.round(ratio * 490);
              const pct = Math.round(ratio * 100);
              const cats = statement
                ? Object.entries(statement.byCategory)
                    .filter(([k]) => k !== "income")
                    .map(([k, v]) => [k, Math.abs(v)] as const)
                    .sort((a, b) => b[1] - a[1])
                : [];
              return (
                <>
                  <svg viewBox="0 0 200 110" className="w-full h-auto block">
                    <circle cx="100" cy="100" r="78" fill="none" stroke="#E4EAF2" strokeWidth="14" />
                    <circle
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={pct > 90 ? "#C2453D" : "#0E2A47"}
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} 490`}
                      transform="rotate(-180 100 100)"
                    />
                    <text x="100" y="92" textAnchor="middle" fontFamily="var(--font-geist), sans-serif" fontSize="22" fontWeight="600" fill="#0A1628">
                      {pct}%
                    </text>
                    <text x="100" y="106" textAnchor="middle" fontSize="9" fill="#5C6878" letterSpacing="2">
                      OF INCOME
                    </text>
                  </svg>
                  {cats.length >= 2 && (
                    <div className="flex justify-between mt-2 text-[11.5px] text-[#5C6878] capitalize">
                      <span>{cats[0][0]} · {money(cats[0][1])}</span>
                      <span>{cats[1][0]} · {money(cats[1][1])}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Goals */}
          <div className="bg-white border border-[#DCE2EB] rounded-[10px] p-4.5">
            <h3 className="m-0 mb-1 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Goals
            </h3>
            <div className="text-[11.5px] text-[#5C6878] mb-3">2 active</div>
            <div className="flex flex-col gap-3.5 mt-1.5">
              <div>
                <div className="flex justify-between text-[12.5px] mb-1.5">
                  <span>Down payment · 2026</span>
                  <span style={{ fontFamily: "var(--font-mono), monospace" }}>$32k / $80k</span>
                </div>
                <div className="h-2 rounded overflow-hidden" style={{ background: "#F4F6FA" }}>
                  <div className="h-full" style={{ width: "40%", background: "#C9A75A" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12.5px] mb-1.5">
                  <span>Emergency fund</span>
                  <span style={{ fontFamily: "var(--font-mono), monospace" }}>$18k / $24k</span>
                </div>
                <div className="h-2 rounded overflow-hidden" style={{ background: "#F4F6FA" }}>
                  <div className="h-full" style={{ width: "75%", background: "#1F8A5B" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div
          className="mt-5 bg-white border border-[#DCE2EB] rounded-[10px] p-4.5 grid items-center gap-4.5"
          style={{ gridTemplateColumns: "auto 1fr auto", borderLeft: "4px solid #C9A75A" }}
        >
          <div className="w-[46px] h-[46px] rounded-[10px] grid place-items-center text-white font-semibold text-[20px]" style={{ background: "#0E2A47", fontFamily: "var(--font-geist), sans-serif" }}>
            N
          </div>
          <div>
            <h4 className="m-0 mb-1 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Your subscriptions are up 22% YoY.
            </h4>
            <p className="text-[13px] text-[#5C6878] m-0">
              You&apos;re paying <b className="text-[#0A1628] font-medium">$184/mo across 11 active subscriptions</b>. Three haven&apos;t been used in 60+ days. Want me to draft cancellations and route the savings to your down payment goal?
            </p>
          </div>
          <button
            type="button"
            onClick={open}
            className="px-3.5 py-2 rounded-md text-[12.5px] cursor-pointer font-medium"
            style={{ background: "#C9A75A", color: "#0E2A47", borderColor: "#C9A75A" }}
          >
            Review with Buddy →
          </button>
        </div>
      </main>

      {/* Buddy panel */}
      <aside className={`bg-white border-l border-[#DCE2EB] flex flex-col overflow-hidden ${collapsed ? "hidden" : ""}`}>
        <div className="px-5 py-4 flex items-center gap-3 text-white" style={{ background: "#0E2A47" }}>
          <div className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-white font-semibold text-[15px]" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(201,167,90,0.4)", fontFamily: "var(--font-geist), sans-serif" }}>
            N
          </div>
          <div>
            <h3 className="m-0 font-semibold text-[14.5px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              Northbank
            </h3>
            <div className="text-[11.5px] text-white/60">Your private banking assistant</div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="ml-auto bg-transparent border-0 text-white cursor-pointer text-base w-7 h-7 rounded-md hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-2.5 text-[11.5px] flex items-center gap-2" style={{ background: "#FFF8E6", borderBottom: "1px solid #F0E5C2", color: "#6F5722" }}>
          <span style={{ color: "#C9A75A" }}>🔒</span>
          <b>Powered by Buddy Assist</b>
        </div>

        <div ref={bbodyRef} className="flex-1 overflow-y-auto px-5 py-4.5 flex flex-col gap-3.5" style={{ background: "#F4F6FA" }}>
          <div className="px-3.5 py-3 rounded-[10px] text-[13.5px] leading-[1.55] max-w-[300px] bg-white border border-[#DCE2EB] self-start" style={{ borderTopLeftRadius: 2 }}>
            <div className="text-[11px] font-semibold text-[#5C6878] mb-1">Northbank</div>
            Hi {firstName}.{statement && statement.net !== 0 ? (
              <>
                {" "}
                I see you&apos;re{" "}
                <b>
                  {money(statement.net, { signed: true })} {statement.net > 0 ? "ahead" : "behind"}
                </b>{" "}
                on the month across <b>{accounts.length}</b> account{accounts.length === 1 ? "" : "s"}.
              </>
            ) : (
              " Ready when you are — ask me anything about your money."
            )}{" "}
            Want to look at where it&apos;s going, or focus on something else?
          </div>

          {!hideQuicks && (
            <div className="flex flex-col gap-1.5">
              {QUICKS.map((q) => (
                <button
                  key={q.lbl}
                  type="button"
                  onClick={() => send(q.q)}
                  className="text-left px-3 py-2.5 rounded-md bg-white border border-[#DCE2EB] text-[12.5px] cursor-pointer hover:border-[#0E2A47] hover:bg-[#F8F9FB]"
                >
                  <span className="text-[9.5px] tracking-[0.1em] uppercase font-semibold block mb-0.5" style={{ color: "#C9A75A" }}>
                    {q.lbl}
                  </span>
                  {q.q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`px-3.5 py-3 rounded-[10px] text-[13.5px] leading-[1.55] max-w-[300px] whitespace-pre-wrap ${
                m.role === "user" ? "self-end text-white" : "self-start bg-white border border-[#DCE2EB]"
              }`}
              style={{
                background: m.role === "user" ? "#0E2A47" : undefined,
                borderTopLeftRadius: m.role === "bot" ? 2 : undefined,
                borderTopRightRadius: m.role === "user" ? 2 : undefined,
              }}
            >
              {m.role === "bot" && <div className="text-[11px] font-semibold text-[#5C6878] mb-1">Northbank</div>}
              <span dangerouslySetInnerHTML={{ __html: mdInline(m.text) }} />
              {m.role === "bot" && m.src && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {["txns.30d", "budgets.json", "goals.yaml"].map((s) => (
                    <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded text-[#5C6878]" style={{ background: "#F4F6FA" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="px-3.5 py-3 rounded-[10px] max-w-[300px] bg-white border border-[#DCE2EB] self-start" style={{ borderTopLeftRadius: 2 }}>
              <div className="text-[11px] font-semibold text-[#5C6878] mb-1">Northbank</div>
              <div className="inline-flex gap-1 py-1.5">
                <span className="typing-dot" style={{ background: "#5C6878" }} />
                <span className="typing-dot" style={{ background: "#5C6878", animationDelay: ".15s" }} />
                <span className="typing-dot" style={{ background: "#5C6878", animationDelay: ".3s" }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-4.5 py-3.5 border-t border-[#DCE2EB] bg-white flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask Buddy about your money…"
            className="flex-1 border border-[#DCE2EB] rounded-lg px-3 py-2.5 text-[13px] resize-none h-[38px] outline-none focus:border-[#0E2A47] focus:h-20 transition-[height] duration-200 leading-[1.4]"
          />
          <button
            type="button"
            onClick={() => send(input)}
            className="text-white border-0 w-[38px] h-[38px] rounded-lg cursor-pointer text-sm"
            style={{ background: "#0E2A47" }}
          >
            →
          </button>
        </div>
      </aside>

      {collapsed && (
        <button
          type="button"
          onClick={open}
          className="fixed right-0 top-1/2 -translate-y-1/2 px-2 py-3.5 rounded-l-lg text-xs font-semibold cursor-pointer text-[#0E2A47]"
          style={{ background: "#C9A75A", writingMode: "vertical-rl", fontFamily: "var(--font-geist), sans-serif" }}
        >
          ⊞ Buddy
        </button>
      )}

      <IndustrySwitcher currentSlug="northbank" />
    </div>
  );
}
