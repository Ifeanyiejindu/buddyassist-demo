"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BuddyChat, mdInline } from "@/lib/buddyChat";

interface Props {
  systemPrompt: string;
  brand: string;
  introLines: string[];
  suggests: { pill: string; text: string }[];
  accent?: string;
  bg?: string;
  textColor?: string;
}

export function TopBarChat({
  systemPrompt,
  brand,
  introLines,
  suggests,
  accent = "#A8FF35",
  bg = "#0E0F12",
  textColor = "#A8FF35",
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; html: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [hideSuggests, setHideSuggests] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt }));

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setHideSuggests(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", html: mdInline(v) }]);
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(v, {
      onToken: (full) => {
        setTyping(false);
        setMessages((m) => {
          if (botIdx === -1) {
            const next = [...m, { role: "assistant" as const, html: mdInline(full) }];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...m];
          next[botIdx] = { ...next[botIdx], html: mdInline(full) };
          return next;
        });
      },
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 right-4 z-[9000] inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-[11px] tracking-[0.1em] uppercase font-medium"
        style={{ background: accent, color: bg }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: bg }} />
        Ask Buddy
      </button>

      <div
        className={`fixed top-0 left-0 right-0 z-[8999] transition-all duration-300 overflow-hidden`}
        style={{
          background: bg,
          color: textColor,
          maxHeight: open ? "70vh" : "0",
          borderBottom: open ? `1px solid ${accent}` : "none",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-7 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full grid place-items-center" style={{ background: accent }}>
              <Image src="/assets/ba-icon-white.png" alt="" width={16} height={16} />
            </div>
            <b className="font-grotesk font-semibold text-base" style={{ color: textColor }}>{brand}</b>
            <small className="font-mono text-[10px] tracking-[0.12em] uppercase opacity-60 ml-2">Top-bar slide</small>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto w-7 h-7 rounded text-lg opacity-60 hover:opacity-100"
              style={{ color: textColor }}
            >
              ×
            </button>
          </div>

          <div ref={bodyRef} className="max-h-[42vh] overflow-y-auto flex flex-col gap-2.5 mb-3">
            {introLines.map((line, i) => (
              <div
                key={i}
                className="self-start max-w-[80%] px-3.5 py-2.5 text-[14px] leading-[1.55] rounded-2xl rounded-bl border"
                style={{ borderColor: `${accent}40` }}
              >
                {line}
              </div>
            ))}
            {!hideSuggests && (
              <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
                {suggests.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(s.text)}
                    className="text-left px-3 py-2.5 rounded-lg border text-[12.5px] cursor-pointer"
                    style={{ borderColor: `${accent}40`, color: textColor }}
                  >
                    <b style={{ color: accent }}>{s.pill}</b>{" "}{s.text}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3.5 py-2.5 text-[14px] leading-[1.55] rounded-2xl whitespace-pre-wrap ${
                  m.role === "user" ? "self-end rounded-br" : "self-start rounded-bl"
                }`}
                style={{
                  background: m.role === "user" ? accent : "transparent",
                  color: m.role === "user" ? bg : textColor,
                  border: m.role === "user" ? "none" : `1px solid ${accent}40`,
                }}
                dangerouslySetInnerHTML={{ __html: m.html }}
              />
            ))}
            {typing && (
              <div className="self-start px-3.5 py-3 rounded-2xl rounded-bl flex gap-1 border" style={{ borderColor: `${accent}40` }}>
                <span className="typing-dot" style={{ background: accent }} />
                <span className="typing-dot" style={{ background: accent, animationDelay: ".15s" }} />
                <span className="typing-dot" style={{ background: accent, animationDelay: ".3s" }} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="rounded-full border-2 px-3 py-1 flex gap-2 items-center"
            style={{ borderColor: accent }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${brand}…`}
              autoComplete="off"
              className="flex-1 border-0 outline-none bg-transparent text-[14px] px-2 py-2.5 placeholder:opacity-50"
              style={{ color: textColor }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="px-4 py-2 rounded-full text-sm font-medium font-mono uppercase tracking-[0.08em] disabled:opacity-40"
              style={{ background: accent, color: bg }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
