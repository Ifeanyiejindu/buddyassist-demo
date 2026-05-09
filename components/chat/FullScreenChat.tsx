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

export function FullScreenChat({
  systemPrompt,
  brand,
  introLines,
  suggests,
  accent = "#2FC463",
  bg = "#FFFFFF",
  textColor = "#0A0A0A",
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
      className="w-full grid place-items-center px-7"
      style={{ background: bg, color: textColor, minHeight: "calc(100vh - 80px)" }}
    >
      <div className="w-full max-w-[820px] flex flex-col gap-6 py-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: accent }}>
            <Image src="/assets/ba-icon-white.png" alt="" width={20} height={20} />
          </div>
          <div className="flex flex-col leading-[1.15]">
            <b className="font-grotesk font-medium text-base">{brand}</b>
            <small className="text-xs opacity-60 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              Live · Buddy Assist
            </small>
          </div>
        </div>

        <div ref={bodyRef} className="flex flex-col gap-3">
          {introLines.map((line, i) => (
            <div
              key={i}
              className="self-start max-w-[80%] px-4 py-3 rounded-2xl rounded-bl text-[15px] leading-[1.55]"
              style={{ background: "rgba(0,0,0,0.04)" }}
            >
              {line}
            </div>
          ))}

          {!hideSuggests && (
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {suggests.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send(s.text)}
                  className="text-left px-3.5 py-3 rounded-xl border text-[13.5px] cursor-pointer hover:-translate-y-px transition-transform"
                  style={{ borderColor: "rgba(0,0,0,0.1)" }}
                >
                  <b className="font-semibold mr-1.5" style={{ color: accent }}>{s.pill}</b>
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] leading-[1.55] whitespace-pre-wrap ${
                m.role === "user" ? "self-end rounded-br" : "self-start rounded-bl"
              }`}
              style={{
                background: m.role === "user" ? textColor : "rgba(0,0,0,0.04)",
                color: m.role === "user" ? bg : textColor,
              }}
              dangerouslySetInnerHTML={{ __html: m.html }}
            />
          ))}

          {typing && (
            <div className="self-start px-4 py-3.5 rounded-2xl rounded-bl flex gap-1" style={{ background: "rgba(0,0,0,0.04)" }}>
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: ".15s" }} />
              <span className="typing-dot" style={{ animationDelay: ".3s" }} />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="sticky bottom-6 mt-6 rounded-full border-2 px-2.5 py-1 flex gap-2 items-center"
          style={{ background: bg, borderColor: textColor }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${brand} anything…`}
            autoComplete="off"
            className="flex-1 border-0 outline-none bg-transparent text-[15px] px-3 py-3"
            style={{ color: textColor }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send"
            className="px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40"
            style={{ background: accent, color: textColor }}
          >
            Send →
          </button>
        </form>
      </div>
    </section>
  );
}
