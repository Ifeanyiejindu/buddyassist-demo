"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat, mdInline } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";
import type { OlDish, OlAvailability } from "@/lib/demoApi";

interface OlivettaClientProps {
  /** Full menu fetched live from the Olivetta API — each dish includes
   *  course, price, dietary flags, and a wine pairing list. */
  menu: OlDish[];
  /** Tonight's chef specials (subset of menu where isSpecial=true). */
  specials: OlDish[];
  /** Tonight's open reservation slots (default party 2). Used by the
   *  "Tonight" availability strip so visitors see real seats. */
  availability: OlAvailability | null;
}

// Map server dietary / description flags → little badge config the
// existing dish-card rendering expects. Keeps the visual untouched while
// the data underneath becomes real.
function dishTags(d: OlDish): Array<{ l: string; k: string }> {
  const tags: Array<{ l: string; k: string }> = [];
  if (d.dietary?.includes("vegan")) tags.push({ l: "vegan", k: "veg" });
  else if (d.dietary?.includes("vegetarian")) tags.push({ l: "vegetarian", k: "veg" });
  if (d.dietary?.includes("gluten-free")) tags.push({ l: "gluten-free", k: "gf" });
  const desc = (d.description || "").toLowerCase();
  if (desc.includes("spicy") || desc.includes("chili") || desc.includes("nduja")) {
    tags.push({ l: "spicy", k: "spicy" });
  }
  return tags;
}

// Build a natural "ask" prompt per dish — teaches visitors how to talk
// to Renata. Uses pairings/dietary info when available.
function askForDish(d: OlDish): string {
  if (d.pairings?.length) return `What wine should I pair with the ${d.name}?`;
  if (d.dietary?.length) return `Tell me about the ${d.name} — is it filling, and how would you pair it?`;
  return `Tell me about the ${d.name}.`;
}

/**
 * Recipe #2 — find real menu items the AI mentioned in its reply so
 * we can render their cards under the bubble. Case-insensitive match
 * on the full dish name; capped so a single response doesn't render
 * 10 cards in a row.
 */
function findMentionedDishes(reply: string, menu: OlDish[]): OlDish[] {
  if (!reply) return [];
  const lower = reply.toLowerCase();
  const found: OlDish[] = [];
  const seen = new Set<string>();
  for (const d of menu) {
    if (!d.name) continue;
    // Word-boundary match on name — avoids overlapping partial hits
    // like "Mara Bowl" also matching every mention of "mara".
    const safe = d.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${safe}\\b`, "i");
    if (re.test(reply) || lower.includes(d.name.toLowerCase())) {
      if (!seen.has(d.itemId)) {
        seen.add(d.itemId);
        found.push(d);
      }
    }
    if (found.length >= 6) break;
  }
  return found;
}

const SYSTEM_PROMPT = `
You are Renata Falci, the sommelier and dining host at Olivella — a neighbourhood wood-fired Italian trattoria in Carroll Gardens, Brooklyn.
Speak warmly, in plain English, with a touch of Italian-American warmth (light, never cartoonish — no "mamma mia"). You know the menu by heart and have a 240-bottle Italian wine list.
Tonight's menu (sample):
Antipasti: Burrata di Andria $19, Vitello Tonnato $22, Carciofi alla Giudia $17 (V/GF).
Primi: Cacio e Pepe $24 (V), Bucatini all'Amatriciana $26 (mild heat), Ravioli di Zucca $28 (V).
Pizza: Margherita D.O.C. $21 (V), Diavola $24 (spicy 'nduja & hot honey).
Secondi: Branzino al Forno $38 (GF), Bistecca alla Fiorentina $96 32oz (GF).
You can suggest dishes, build a course, pair wine (mention specific Italian regions/grapes — Etna Rosso, Brunello, Greco di Tufo, Barbera, Lambrusco, etc.), accommodate diet needs, and reassure on heat/portion. If asked things outside the restaurant (politics, code, etc.), gently redirect to "let's keep my world to the menu and the wine list."
Keep replies tight (1-3 short paragraphs). Don't bullet — write like you're at the table.
`.trim();

// DISHES are now fetched server-side and passed in via props. The
// page renders whatever the live menu endpoint returns — including
// real images, prices, dietary flags, and per-dish wine pairings.

const QUICKS = [
  { label: "2 ppl · vegetarian · anniversary", q: "Two of us, vegetarian, anniversary dinner. We love bold reds." },
  { label: "6 ppl · 1 GF · celebration", q: "Group of 6, one gluten-free. We're celebrating a promotion. Budget around $90/pp food." },
  { label: "Solo at the bar", q: "Just walked in solo at the bar, what should I order with a glass of wine?" },
  { label: "Best pizza + wine", q: "What's the best pizza on the menu and what wine should I have with it?" },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  veg: { bg: "rgba(63,78,42,0.12)", color: "#2C3A1B" },
  gf: { bg: "rgba(194,150,53,0.18)", color: "#2C3A1B" },
  spicy: { bg: "rgba(181,83,28,0.15)", color: "#B5531C" },
};

export default function OlivettaClient({ menu, specials, availability }: OlivettaClientProps) {
  // Transform the live menu into the shape the existing cards expect.
  // Keep the visual contract — only the data underneath becomes real.
  const dishes = menu
    .filter((d) => d.available !== false)
    .map((d) => ({
      itemId: d.itemId,
      name: d.name,
      image:
        d.image ||
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=70",
      price: String(d.price),
      desc: d.description,
      tags: dishTags(d),
      ask: askForDish(d),
    }));

  // Use the next 4 open slots so visitors immediately see tonight's
  // available times (real seats remaining counts).
  const nextSlots = availability?.openSlots?.slice(0, 4) || [];
  // Specials count surfaced in the header strip so visitors know there's
  // a chef's selection tonight without us hardcoding "3 specials!".
  const specialsCount = specials.length;

  const [open, setOpen] = useState(false);
  const [hideQuicks, setHideQuicks] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const convoRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("olivetta") }));

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  function openConvo() {
    setOpen(true);
    setTimeout(() => {
      convoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => inputRef.current?.focus(), 400);
    }, 50);
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

  function askDish(q: string) {
    if (!open) {
      openConvo();
      setTimeout(() => send(q), 600);
    } else {
      send(q);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ["--ink" as string]: "#1A1410",
        ["--paper" as string]: "#FAF6EE",
        ["--cream" as string]: "#F2EAD8",
        ["--line" as string]: "#E2D6BD",
        ["--mute" as string]: "#7A6E5B",
        ["--olive" as string]: "#3F4E2A",
        ["--olive-d" as string]: "#2C3A1B",
        ["--rust" as string]: "#B5531C",
        ["--gold" as string]: "#C29635",
        background: "#FAF6EE",
        color: "#1A1410",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <nav className="flex items-center justify-between px-6 md:px-14 py-5.5 border-b border-[#E2D6BD]">
        <div className="text-[24px] font-semibold tracking-[0.04em]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Olivella<span style={{ color: "#B5531C", fontStyle: "italic" }}>·</span>
        </div>
        <ul className="hidden md:flex gap-8 text-[13px] tracking-[0.06em] uppercase list-none m-0 p-0">
          <li>Menu</li>
          <li>Wine list</li>
          <li>Private events</li>
          <li>Visit</li>
          <li>Stories</li>
        </ul>
        <button type="button" className="px-4.5 py-2.5 rounded-full text-white text-[13px] font-medium border-0 cursor-pointer" style={{ background: "#3F4E2A" }}>
          Reserve a table →
        </button>
      </nav>

      <section className="px-6 md:px-14 pt-14 pb-8 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="m-0 font-medium leading-[0.95] -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(54px, 7vw, 84px)" }}>
            Wood-fired,<br />slow-rolled<br />
            <em className="italic" style={{ color: "#B5531C" }}>Italian.</em>
          </h1>
          <p className="text-[17px] text-[#7A6E5B] max-w-[480px] mt-4.5">
            A neighbourhood trattoria in Carroll Gardens since 2014. Hand-pulled pasta, oak-fired pizzas, and a 240-bottle Italian list curated by Sommelier <i>Renata Falci</i>.
          </p>
          <div className="flex gap-4 mt-6 text-[13px] text-[#7A6E5B] items-center flex-wrap">
            <span><b className="text-[#1A1410]">4.8</b> ★ · 412 reviews</span>
            <span>Open today · 5:30–11pm</span>
            <span>183 Smith St, Brooklyn</span>
          </div>
        </div>
        {/* Hero image — first popular dish or first menu item, pulled
            from the live Olivetta API. Falls back to the striped
            placeholder if the menu hasn't loaded yet. */}
        {(() => {
          const heroDish = menu.find((d) => d.popular) || menu[0];
          if (heroDish?.image) {
            return (
              <div
                className="rounded-md overflow-hidden relative"
                style={{ aspectRatio: "4/5" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroDish.image}
                  alt={heroDish.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute left-4 bottom-4 px-3 py-1.5 rounded text-[11.5px] text-white"
                  style={{
                    background: "rgba(26,20,16,0.65)",
                    backdropFilter: "blur(4px)",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {heroDish.name}{heroDish.popular ? " · popular" : ""}
                </div>
              </div>
            );
          }
          return (
            <div
              className="rounded-md grid place-items-center text-[#7A6E5B] text-[11px]"
              style={{
                aspectRatio: "4/5",
                background: "#F2EAD8",
                backgroundImage: "repeating-linear-gradient(45deg, transparent 0 16px, rgba(63,78,42,0.06) 16px 17px)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              [ wood-fired oven · golden hour ]
            </div>
          );
        })()}
      </section>

      <section className="px-6 md:px-14 py-8">
        <div className="flex items-end justify-between mb-8 border-b border-[#E2D6BD] pb-4.5 flex-wrap gap-4">
          <h2 className="m-0 font-medium -tracking-[0.015em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
            Menu
          </h2>
          <div className="flex gap-6 text-[13px] text-[#7A6E5B] uppercase tracking-[0.08em]">
            {[
              { l: "Antipasti", on: true },
              { l: "Primi" },
              { l: "Secondi" },
              { l: "Pizza" },
              { l: "Dolci" },
            ].map((a) => (
              <a
                key={a.l}
                className={`cursor-pointer ${a.on ? "text-[#1A1410] font-medium border-b border-[#1A1410] pb-0.5" : ""}`}
              >
                {a.l}
              </a>
            ))}
          </div>
        </div>

        {/* Sommelier strip */}
        <div
          className="my-6 px-8 py-7 rounded-md grid items-center gap-7"
          style={{
            background: "#F2EAD8",
            borderLeft: "4px solid #3F4E2A",
            gridTemplateColumns: "auto 1fr auto",
          }}
        >
          <div
            className="w-[54px] h-[54px] rounded-full grid place-items-center text-[#FAF6EE] italic"
            style={{ background: "#3F4E2A", fontFamily: "var(--font-fraunces), serif", fontSize: 22 }}
          >
            R
          </div>
          <div>
            <h3 className="m-0 mb-1 font-medium" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22 }}>
              Renata can pair this menu for you.
            </h3>
            <p className="m-0 text-[13.5px] text-[#7A6E5B]">
              Tell her what you like, who you&apos;re with, or what you ate last weekend — she&apos;ll suggest dishes and a wine, in plain English. Powered by Buddy Assist.
            </p>
          </div>
          <button
            type="button"
            onClick={openConvo}
            className="px-4.5 py-2.5 rounded-full text-[#FAF6EE] border-0 cursor-pointer text-[13px] inline-flex items-center gap-2"
            style={{ background: "#1A1410" }}
          >
            Ask Renata <span style={{ opacity: 0.6 }}>→</span>
          </button>
        </div>

        {/* Inline conversation */}
        {open && (
          <div ref={convoRef} className="my-2 mb-8 bg-white border border-[#E2D6BD] rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2D6BD] flex items-center gap-3.5" style={{ background: "#F2EAD8" }}>
              <div
                className="w-[38px] h-[38px] rounded-full grid place-items-center text-[#FAF6EE] italic"
                style={{ background: "#3F4E2A", fontFamily: "var(--font-fraunces), serif", fontSize: 18 }}
              >
                R
              </div>
              <div>
                <h4 className="m-0 font-medium" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18 }}>
                  Renata Falci · Sommelier
                </h4>
                <div className="text-xs text-[#7A6E5B]">Asks dietary needs, suggests dishes from tonight&apos;s menu, pairs the wine. Demo only.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto bg-transparent border-0 cursor-pointer text-[#7A6E5B] text-base"
              >
                ×
              </button>
            </div>
            <div ref={bodyRef} className="px-6 py-5 flex flex-col gap-3.5 max-h-[400px] overflow-y-auto">
              <div className="text-[14.5px] leading-[1.6] max-w-[540px] text-[#1A1410]">
                <div className="mb-1 italic text-sm" style={{ color: "#2C3A1B", fontFamily: "var(--font-fraunces), serif" }}>
                  Renata
                </div>
                <div className="whitespace-pre-wrap">
                  Welcome! Tell me a little about your party — how many of you, any allergies or preferences, and roughly what kind of evening you&apos;re after. Light and bright, or rich and slow? I&apos;ll build you a course.
                </div>
              </div>
              {!hideQuicks && (
                <div className="flex gap-2 flex-wrap mb-1.5">
                  {QUICKS.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => send(q.q)}
                      className="px-3 py-1.5 rounded-full border border-[#E2D6BD] text-[#1A1410] text-[12.5px] cursor-pointer hover:bg-[#3F4E2A] hover:text-[#FAF6EE] hover:border-[#3F4E2A]"
                      style={{ background: "#F2EAD8" }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div
                    key={i}
                    className="text-[14.5px] leading-[1.6] max-w-[540px] ml-auto px-3.5 py-2.5 text-[#FAF6EE]"
                    style={{ background: "#3F4E2A", borderRadius: "14px 14px 2px 14px" }}
                  >
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="text-[14.5px] leading-[1.6] max-w-[540px] text-[#1A1410]">
                    <div className="mb-1 italic text-sm" style={{ color: "#2C3A1B", fontFamily: "var(--font-fraunces), serif" }}>
                      Renata
                    </div>
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: mdInline(m.text) }} />
                    {/* Recipe #2 — when Renata names a real dish from
                        the live menu, render a small linkable card so
                        the guest can tap straight through to the dish
                        detail page with pairings. */}
                    {(() => {
                      const mentioned = findMentionedDishes(m.text, menu);
                      if (mentioned.length === 0) return null;
                      return (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-[540px]">
                          {mentioned.map((d) => (
                            <Link
                              key={d.itemId}
                              href={`/demo/olivetta/menu/${d.itemId}`}
                              className="bg-white border border-[#E2D6BD] rounded-lg overflow-hidden no-underline text-inherit hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(63,78,42,0.10)] transition-all"
                            >
                              {d.image && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={d.image} alt={d.name} className="w-full aspect-[4/3] object-cover" />
                              )}
                              <div className="p-2">
                                <div
                                  className="text-[12px] font-medium leading-tight"
                                  style={{ fontFamily: "var(--font-fraunces), serif" }}
                                >
                                  {d.name}
                                </div>
                                <div className="text-[11px] text-[#7A6E5B] mt-0.5" style={{ fontFamily: "var(--font-mono), monospace" }}>
                                  ${d.price}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ),
              )}
              {typing && (
                <div className="text-[14.5px] leading-[1.6] max-w-[540px] text-[#1A1410]">
                  <div className="mb-1 italic text-sm" style={{ color: "#2C3A1B", fontFamily: "var(--font-fraunces), serif" }}>
                    Renata
                  </div>
                  <div className="inline-flex gap-1 py-1.5">
                    <span className="typing-dot" style={{ background: "#7A6E5B" }} />
                    <span className="typing-dot" style={{ background: "#7A6E5B", animationDelay: ".15s" }} />
                    <span className="typing-dot" style={{ background: "#7A6E5B", animationDelay: ".3s" }} />
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="px-6 py-3.5 border-t border-[#E2D6BD] flex gap-2.5"
              style={{ background: "#FAF6EE" }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Renata… 'I'm pescatarian, what should I get?'"
                className="flex-1 border border-[#E2D6BD] bg-white px-3.5 py-2.5 rounded-full text-[14px] outline-none focus:border-[#3F4E2A]"
              />
              <button
                type="submit"
                className="px-4.5 py-2.5 rounded-full text-[#FAF6EE] border-0 cursor-pointer text-[13px]"
                style={{ background: "#1A1410" }}
              >
                Ask
              </button>
            </form>
          </div>
        )}

        {/* Tonight's availability strip — real seats remaining from API */}
        {nextSlots.length > 0 && (
          <div className="mb-6 py-3 px-4 rounded-lg border border-[#E2D6BD] bg-[#FAF3E1] flex items-center gap-3 flex-wrap">
            <span className="text-[12px] uppercase tracking-[0.1em] text-[#7A6E5B] font-medium">
              Tonight — party of {availability?.partySize ?? 2}
              {specialsCount > 0 && (
                <>
                  {" "}· <span className="text-[#B5531C]">{specialsCount} chef special{specialsCount === 1 ? "" : "s"}</span>
                </>
              )}
            </span>
            <div className="flex gap-2 flex-wrap">
              {nextSlots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  onClick={() =>
                    askDish(`I'd like to reserve a table for ${availability?.partySize ?? 2} tonight at ${s.time}.`)
                  }
                  className="px-3 py-1.5 rounded-md bg-white border border-[#E2D6BD] text-[13px] font-medium hover:bg-[#3F4E2A] hover:text-white hover:border-[#3F4E2A] cursor-pointer transition-colors"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dishes — real menu items, each linkable to its detail page with pairings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-14">
          {dishes.length === 0 ? (
            <div className="col-span-2 py-10 text-center text-[#7A6E5B] text-[14px]">
              The menu is being prepared — check back in a moment.
            </div>
          ) : null}
          {dishes.map((d) => (
            <div
              key={d.itemId}
              className="py-4.5 grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-4.5 cursor-pointer relative group"
              style={{ borderBottom: "1px dashed #E2D6BD" }}
              onClick={() => askDish(d.ask)}
            >
              <Link
                href={`/demo/olivetta/menu/${d.itemId}`}
                onClick={(e) => e.stopPropagation()}
                className="col-span-2 block"
                aria-label={`Open ${d.name} detail`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-44 object-cover rounded-lg mb-1"
                />
              </Link>
              <Link
                href={`/demo/olivetta/menu/${d.itemId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium leading-tight no-underline text-inherit hover:text-[#3F4E2A]"
                style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22 }}
              >
                {d.name}
              </Link>
              <div className="font-medium text-[13px] text-[#1A1410]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                ${d.price}
              </div>
              <div className="text-[13.5px] text-[#7A6E5B] col-span-2">{d.desc}</div>
              {d.tags.length > 0 && (
                <div className="flex gap-1.5 col-span-2 mt-1">
                  {d.tags.map((t) => (
                    <span
                      key={t.l}
                      className="text-[10.5px] tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-sm font-medium"
                      style={TAG_STYLES[t.k] || { background: "#F2EAD8", color: "#2C3A1B" }}
                    >
                      {t.l}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  askDish(d.ask);
                }}
                className="absolute top-4.5 right-0 w-[26px] h-[26px] rounded-full bg-transparent border border-[#E2D6BD] text-[#7A6E5B] cursor-pointer text-xs hidden md:group-hover:grid place-items-center hover:bg-[#3F4E2A] hover:text-white hover:border-[#3F4E2A]"
              >
                ?
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reservation */}
      <section
        className="my-12 mx-6 md:mx-14 mb-20 px-6 md:px-12 py-10 rounded-md grid md:grid-cols-2 gap-12 items-center"
        style={{ background: "#1A1410", color: "#FAF6EE" }}
      >
        <div>
          <h2 className="m-0 font-medium -tracking-[0.015em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
            Reserve a table
          </h2>
          <p className="mt-2 text-[15px]" style={{ color: "rgba(250,246,238,0.7)" }}>
            Indoor &amp; sidewalk seating. Walk-ins welcome at the bar. Private dining for parties of 8-22.
          </p>
        </div>
        <div className="bg-[#FAF6EE] text-[#1A1410] p-6 rounded-md flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] tracking-[0.08em] uppercase text-[#7A6E5B] mb-1 block">Date</label>
              <input type="date" defaultValue="2026-05-15" className="w-full px-3 py-2.5 border border-[#E2D6BD] rounded text-sm bg-white" />
            </div>
            <div>
              <label className="text-[11px] tracking-[0.08em] uppercase text-[#7A6E5B] mb-1 block">Time</label>
              <select defaultValue="7:30 pm" className="w-full px-3 py-2.5 border border-[#E2D6BD] rounded text-sm bg-white">
                <option>7:00 pm</option>
                <option>7:30 pm</option>
                <option>8:00 pm</option>
                <option>8:30 pm</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] tracking-[0.08em] uppercase text-[#7A6E5B] mb-1 block">Party</label>
              <select defaultValue="4" className="w-full px-3 py-2.5 border border-[#E2D6BD] rounded text-sm bg-white">
                <option>2</option>
                <option>4</option>
                <option>6</option>
                <option>8</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] tracking-[0.08em] uppercase text-[#7A6E5B] mb-1 block">Seating</label>
              <select className="w-full px-3 py-2.5 border border-[#E2D6BD] rounded text-sm bg-white">
                <option>No preference</option>
                <option>Indoor</option>
                <option>Sidewalk</option>
                <option>Bar</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="py-3 rounded text-[#FAF6EE] border-0 cursor-pointer font-medium uppercase tracking-[0.04em] text-[12.5px]"
            style={{ background: "#3F4E2A" }}
          >
            Find a table
          </button>
          <button
            type="button"
            onClick={() => askDish("What's a great Friday night reservation for 4 — what should we order and which wine?")}
            className="mt-2 px-3.5 py-2.5 rounded text-[12.5px] text-[#7A6E5B] flex items-center gap-2 cursor-pointer text-left"
            style={{ background: "#F2EAD8", border: "1px dashed #E2D6BD" }}
          >
            💬 Not sure of the time or vibe? <b className="text-[#2C3A1B]">&nbsp;Ask Renata what&apos;s good Friday night for 4.</b>
          </button>
        </div>
      </section>

      <footer
        className="px-6 md:px-14 py-8 border-t border-[#E2D6BD] text-[12.5px] text-[#7A6E5B] flex justify-between flex-wrap gap-3.5"
        style={{ letterSpacing: "0.04em" }}
      >
        <span>© Olivella · 183 Smith St, Brooklyn · (718) 555-0143</span>
        <span><b className="text-[#2C3A1B]">Powered by Buddy Assist</b></span>
      </footer>

      <IndustrySwitcher currentSlug="olivetta" />
    </div>
  );
}
