"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Image from "next/image";
import { BuddyChat, mdInline, splitForCards } from "@/lib/buddyChat";
import { createBuddyComplete, type IndustrySlug } from "@/lib/buddyClient";
import { getCart, cartSummaryForAI } from "@/lib/cart";

// ── Cross-page chat persistence ──────────────────────────────────────────
//
// Without this, the visitor opens Buddy on /demo/acme, asks about a
// product, clicks the product card → lands on /demo/acme/product/sku →
// component unmounts → state is gone → the next render shows the
// welcome state again. Hostile to a real shopping flow.
//
// Persist per-industry: the UI message log (what the visitor sees), the
// underlying BuddyChat history (what the AI knows), and the open/closed
// panel state so the panel reopens automatically on the next page if
// it was open before. 7-day TTL so abandoned sessions auto-reset.
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface PersistedState {
  messages: ChatMsg[];
  history: { role: "user" | "assistant"; content: string }[];
  open: boolean;
  hideSuggests: boolean;
  savedAt: number;
}

function storageKey(slug?: string) {
  return `bademo:chat:${slug || "_anon"}`;
}

function loadPersisted(slug?: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
      window.localStorage.removeItem(storageKey(slug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(slug: string | undefined, state: Omit<PersistedState, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    // Cap history we keep so localStorage doesn't bloat indefinitely.
    const trimmed: PersistedState = {
      ...state,
      messages: state.messages.slice(-40),
      history: state.history.slice(-40),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(storageKey(slug), JSON.stringify(trimmed));
  } catch {
    /* quota / serialization errors — silently ignore */
  }
}

interface Suggest {
  pill: string;
  text: string;
}

interface ProductCard {
  name: string;
  price?: string;
  sub?: string;
  bg?: string;
  shape?: string;
  /** Real product image URL — rendered instead of the placeholder shape. */
  image?: string;
  /** Link to the product's page; the card becomes clickable. */
  href?: string;
}

/** Extend message state to carry raw text + split parts for product rendering. */
interface ChatMsg {
  role: "user" | "assistant";
  html: string;
  raw: string;
  products?: ProductCard[];
  introHtml?: string;
  trailingHtml?: string;
}

interface FloatingChatProps {
  systemPrompt: string;
  brand: string;
  greeting: string;
  introLines: string[];
  suggests: Suggest[];
  /** Optional input placeholder; defaults to "Ask {brand}…". */
  inputPlaceholder?: string;
  /** Catalog of named items the AI can reference; cards render under the bubble when names match. */
  catalog?: ProductCard[];
  /** Hex strings overriding the chat panel accents. */
  theme?: {
    bubbleAccent?: string;
    sendBg?: string;
    panelBg?: string;
  };
  footer?: ReactNode;
  complete?: (messages: { role: "user" | "assistant"; content: string }[]) => Promise<string>;
  industrySlug?: IndustrySlug;
}

export function FloatingChat({
  systemPrompt,
  brand,
  greeting,
  introLines,
  suggests,
  inputPlaceholder,
  catalog = [],
  theme = {},
  footer,
  complete,
  industrySlug,
}: FloatingChatProps) {
  const resolvedComplete = complete || (industrySlug ? createBuddyComplete(industrySlug) : undefined);

  // Restore the prior session for this industry on mount. The component
  // re-mounts every page navigation (no shared layout in /demo/<industry>),
  // so this is the only thing that makes the conversation survive going
  // from the storefront → product page → cart.
  const restored = useRef<PersistedState | null>(loadPersisted(industrySlug));

  const [open, setOpen] = useState(restored.current?.open ?? false);
  const [showGreet, setShowGreet] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>(
    restored.current?.messages ?? [],
  );
  const [typing, setTyping] = useState(false);
  const [hideSuggests, setHideSuggests] = useState(
    restored.current?.hideSuggests ?? false,
  );
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // Store the base prompt so we can append live cart state before each send
  const basePrompt = useRef(systemPrompt);
  const chat = useRef(
    new BuddyChat({
      systemPrompt,
      complete: resolvedComplete as never,
      // Seed BuddyChat with the prior AI-visible history so the
      // assistant doesn't forget what it discussed when the visitor
      // navigates to a new page.
      history: restored.current?.history ?? [],
    }),
  );

  // Persist on every meaningful state change. Keep this cheap — we run
  // it in an effect (not on every render synchronously) so the writes
  // are batched after React commits.
  useEffect(() => {
    // Don't persist an empty state on first mount.
    if (messages.length === 0 && !open) return;
    savePersisted(industrySlug, {
      messages,
      history: chat.current.history,
      open,
      hideSuggests,
    });
  }, [messages, open, hideSuggests, industrySlug]);

  useEffect(() => {
    const t = setTimeout(() => setShowGreet(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  function findProducts(text: string): ProductCard[] {
    const found: ProductCard[] = [];
    const seen = new Set<string>();
    for (const p of catalog) {
      const re = new RegExp(p.name.replace(/\s+/g, "\\s+"), "i");
      if (re.test(text) && !seen.has(p.name)) {
        seen.add(p.name);
        found.push(p);
      }
    }
    return found;
  }

  async function send(text: string) {
    const value = text.trim();
    if (!value || chat.current.busy) return;

    // Inject live cart state so the bot knows what the user has added
    const cartSummary = cartSummaryForAI(getCart());
    chat.current.systemPrompt =
      basePrompt.current +
      "\n\n[LIVE CART — use when the user asks about their cart, do not repeat verbatim]\n" +
      cartSummary;

    setHideSuggests(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", html: mdInline(value), raw: value }]);
    setTyping(true);

    let botIdx = -1;
    await chat.current.send(value, {
      onToken: (full) => {
        setTyping(false);
        setMessages((m) => {
          if (botIdx === -1) {
            const next = [
              ...m,
              { role: "assistant" as const, html: mdInline(full), raw: full },
            ];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...m];
          next[botIdx] = { ...next[botIdx], html: mdInline(full), raw: full };
          return next;
        });
      },
      onDone: (full) => {
        const products = findProducts(full);
        const { intro, trailing } = splitForCards(full);
        setMessages((m) => {
          const idx = botIdx === -1 ? m.length - 1 : botIdx;
          const next = [...m];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              raw: full,
              html: mdInline(full),
              products: products.length ? products : undefined,
              introHtml: products.length && intro ? mdInline(intro) : undefined,
              trailingHtml: products.length && trailing ? mdInline(trailing) : undefined,
            };
          }
          return next;
        });
      },
    });
  }

  const sendBg = theme.sendBg || "#2FC463";

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-6 bottom-6 z-[9000] w-[60px] h-[60px] rounded-full bg-[#191815] text-white grid place-items-center cursor-pointer transition-transform hover:-translate-y-0.5"
        style={{
          boxShadow:
            "0 14px 30px rgba(0,0,0,0.20), 0 0 0 6px rgba(47,196,99,0.18)",
        }}
        aria-label="Open Buddy"
      >
        <span
          className="absolute -inset-1.5 rounded-full border opacity-60"
          style={{ borderColor: "#2FC463", animation: "ba-rip 2.4s ease-out infinite" }}
        />
        <Image src="/assets/ba-icon-white.png" alt="" width={28} height={28} className="w-7 h-7" />
        {showGreet && !open && (
          <span
            className="absolute right-[72px] top-1/2 -translate-y-1/2 bg-white text-[#191815] px-3.5 py-2 rounded-[14px] rounded-br whitespace-nowrap text-xs border border-[#E8E3D9]"
            style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.10)" }}
          >
            {greeting}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed right-6 bottom-24 z-[9001] w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-120px)] bg-white rounded-[18px] overflow-hidden flex flex-col"
          style={{
            boxShadow: "0 30px 60px rgba(0,0,0,0.22), 0 0 0 1px #EAEAEA",
            transformOrigin: "bottom right",
            animation: "ba-open 0.26s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        >
          <div className="px-4 py-3.5 border-b border-[#EAEAEA] flex items-center gap-2.5 bg-white">
            <div className="w-9 h-9 rounded-full bg-[#2FC463] grid place-items-center">
              <Image src="/assets/ba-icon-white.png" alt="" width={18} height={18} className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-[1.15]">
              <b className="font-semibold text-[13.5px] -tracking-[0.005em] text-[#191815]">{brand}</b>
              <small className="text-[11px] text-[#8A847A] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
                Live · powered by Buddy Assist
              </small>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto w-7.5 h-7.5 rounded-lg bg-transparent border-0 cursor-pointer text-[#8A847A] text-lg hover:bg-[#F1ECE0]"
            >
              ×
            </button>
          </div>

          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto px-4 py-4.5 flex flex-col gap-2.5"
            style={{ background: "linear-gradient(#fff, #FBF9F5)" }}
          >
            {introLines.map((line, i) => (
              <div
                key={i}
                className="bp-msg bot self-start max-w-[88%] px-3.5 py-2.5 rounded-[14px] rounded-bl text-[13.5px] leading-[1.5] bg-white border border-[#E8E3D9] text-[#191815]"
              >
                {line}
              </div>
            ))}

            {!hideSuggests && (
              <div className="flex flex-col gap-1.5 mt-1.5">
                {suggests.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(s.text)}
                    className="text-left px-3 py-2.5 rounded-[10px] border border-[#E8E3D9] bg-white text-[12.5px] cursor-pointer text-[#191815] hover:bg-[#F1ECE0]"
                  >
                    <b className="text-[#1E9E4B] font-semibold mr-1.5">{s.pill}</b>
                    {s.text}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => {
              /* ── User bubble ─────────────────────────────────── */
              if (m.role === "user") {
                return (
                  <div
                    key={i}
                    className="self-end max-w-[88%] px-3.5 py-2.5 rounded-[14px] rounded-br text-[13.5px] leading-[1.5] bg-[#191815] text-white"
                    dangerouslySetInnerHTML={{ __html: m.html }}
                  />
                );
              }

              /* ── Bot message WITH product cards ──────────────── */
              if (m.products && m.products.length > 0) {
                return (
                  <div key={i} className="contents">
                    {/* Intro line e.g. "Here are some of our latest products:" */}
                    {m.introHtml && (
                      <div
                        className="self-start max-w-[88%] px-3.5 py-2.5 rounded-[14px] rounded-bl text-[13.5px] leading-[1.5] bg-white border border-[#E8E3D9] text-[#191815]"
                        dangerouslySetInnerHTML={{ __html: m.introHtml }}
                      />
                    )}

                    {/* Product cards — image-first, clickable */}
                    <div className="self-start max-w-[88%] flex flex-col gap-2">
                      {m.products.map((p) => (
                        <a
                          key={p.name}
                          href={p.href || "#"}
                          className="flex gap-3 items-center bg-white border border-[#E8E3D9] rounded-xl p-2.5 no-underline text-inherit transition-all hover:border-[#191815] hover:-translate-y-px"
                          style={{
                            animation: "ba-prod-in 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
                          }}
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-14 h-14 rounded-lg flex-shrink-0 object-cover bg-[#F1ECE0]"
                            />
                          ) : (
                            <span
                              className="w-14 h-14 rounded-lg flex-shrink-0 relative overflow-hidden"
                              style={{ background: p.bg || "#E2C8B5" }}
                            >
                              <span
                                className="absolute inset-[22%] rounded-full"
                                style={{
                                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 55%), ${
                                    p.shape || "#9A3F2C"
                                  }`,
                                }}
                              />
                            </span>
                          )}
                          <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                            <span className="font-serif text-[15px] leading-[1.1]">
                              {p.name}
                            </span>
                            {p.sub && (
                              <span className="text-[11px] text-[#8A847A] truncate">
                                {p.sub}
                              </span>
                            )}
                          </span>
                          {p.price && (
                            <span className="font-semibold text-[13px] flex-shrink-0 pl-2">
                              {p.price}
                            </span>
                          )}
                          <span className="text-[10px] text-[#C8553D] flex-shrink-0">→</span>
                        </a>
                      ))}
                    </div>

                    {/* Trailing note e.g. "Let me know if you need more info!" */}
                    {m.trailingHtml && (
                      <div
                        className="self-start max-w-[88%] px-3.5 py-2.5 rounded-[14px] rounded-bl text-[13.5px] leading-[1.5] bg-white border border-[#E8E3D9] text-[#191815]"
                        dangerouslySetInnerHTML={{ __html: m.trailingHtml }}
                      />
                    )}
                  </div>
                );
              }

              /* ── Regular bot message ─────────────────────────── */
              return (
                <div
                  key={i}
                  className="self-start max-w-[88%] px-3.5 py-2.5 rounded-[14px] rounded-bl text-[13.5px] leading-[1.5] bg-white border border-[#E8E3D9] text-[#191815]"
                  dangerouslySetInnerHTML={{ __html: m.html }}
                />
              );
            })}

            {typing && (
              <div className="self-start bg-white border border-[#E8E3D9] px-3.5 py-3 rounded-[14px] rounded-bl flex gap-1">
                <span className="typing-dot" style={{ background: "#9A847A" }} />
                <span className="typing-dot" style={{ background: "#9A847A", animationDelay: ".15s" }} />
                <span className="typing-dot" style={{ background: "#9A847A", animationDelay: ".3s" }} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-[#E8E3D9] px-3 py-2.5 flex gap-2 items-center bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder ?? `Ask ${brand} anything…`}
              autoComplete="off"
              className="flex-1 border-0 outline-none font-inherit text-[13.5px] bg-transparent px-1 py-2.5 text-[#191815] placeholder:text-[#8A847A]"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full border-0 cursor-pointer grid place-items-center text-[#191815] transition-colors disabled:bg-[#EAEAEA] disabled:cursor-not-allowed"
              style={{ background: input.trim() ? sendBg : "#EAEAEA" }}
            >
              →
            </button>
          </form>

          <div className="px-3.5 py-2 text-[10px] text-[#8A847A] text-center border-t border-[#E8E3D9] bg-white">
            {footer ?? <b className="text-[#1E9E4B]">Powered by Buddy Assist</b>}
          </div>
        </div>
      )}
    </>
  );
}
