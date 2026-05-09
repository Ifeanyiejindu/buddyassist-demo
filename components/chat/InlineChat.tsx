"use client";

import { useEffect, useRef, useState } from "react";
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

export function InlineChat({
  systemPrompt,
  brand,
  introLines,
  suggests,
  accent = "#3A4A3F",
  bg = "#F1ECE0",
  textColor = "#1F2A1F",
}: Props) {
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
    <section
      className="rounded-2xl p-7 border-l-4"
      style={{ background: bg, color: textColor, borderColor: accent }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase opacity-70">Ask {brand}</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase opacity-50">live</span>
      </div>

      <div ref={bodyRef} className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
        {introLines.map((line, i) => (
          <div
            key={i}
            className="self-start max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-bl text-[14px] leading-[1.55]"
            style={{ background: "rgba(0,0,0,0.05)" }}
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
                className="text-left px-3 py-2.5 rounded-lg border text-[13px] cursor-pointer hover:-translate-y-px transition-transform"
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
            className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[1.55] whitespace-pre-wrap ${
              m.role === "user" ? "self-end rounded-br" : "self-start rounded-bl"
            }`}
            style={{
              background: m.role === "user" ? accent : "rgba(0,0,0,0.05)",
              color: m.role === "user" ? bg : textColor,
            }}
            dangerouslySetInnerHTML={{ __html: m.html }}
          />
        ))}
        {typing && (
          <div className="self-start px-3.5 py-3 rounded-2xl rounded-bl flex gap-1" style={{ background: "rgba(0,0,0,0.05)" }}>
            <span className="typing-dot" style={{ background: accent }} />
            <span className="typing-dot" style={{ background: accent, animationDelay: ".15s" }} />
            <span className="typing-dot" style={{ background: accent, animationDelay: ".3s" }} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="rounded-full px-3 py-1 flex gap-2 items-center mt-4"
        style={{ background: "rgba(0,0,0,0.05)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${brand}…`}
          autoComplete="off"
          className="flex-1 border-0 outline-none bg-transparent text-[14px] px-2 py-2.5"
          style={{ color: textColor }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="w-9 h-9 rounded-full grid place-items-center text-sm font-medium disabled:opacity-40"
          style={{ background: accent, color: bg }}
        >
          →
        </button>
      </form>
    </section>
  );
}
