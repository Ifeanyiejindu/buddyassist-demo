"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BuddyChat, mdInline } from "@/lib/buddyChat";

interface SidePanelChatProps {
  systemPrompt: string;
  brand: string;
  introLines: string[];
  suggests: { pill: string; text: string }[];
  /** Side of screen — defaults to right. */
  side?: "left" | "right";
  /** Header accent color. */
  accent?: string;
  bg?: string;
  textColor?: string;
}

export function SidePanelChat({
  systemPrompt,
  brand,
  introLines,
  suggests,
  side = "right",
  accent = "#2FC463",
  bg = "#FFFFFF",
  textColor = "#0A0A0A",
}: SidePanelChatProps) {
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(420);
  const [resizing, setResizing] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; html: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [hideSuggests, setHideSuggests] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt }));

  useEffect(() => {
    if (!resizing) return;
    function onMove(e: MouseEvent) {
      const w = side === "right" ? window.innerWidth - e.clientX : e.clientX;
      setWidth(Math.min(Math.max(320, w), 720));
    }
    function onUp() { setResizing(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, side]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || chat.current.busy) return;
    setHideSuggests(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", html: mdInline(value) }]);
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(value, {
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-1/2 -translate-y-1/2 z-[9000] rounded-l-md py-3 px-2 text-white text-xs writing-mode-vertical"
        style={{
          [side]: 0,
          background: textColor,
          writingMode: "vertical-rl",
        }}
        aria-label="Open Buddy"
      >
        Buddy ↘
      </button>
    );
  }

  return (
    <aside
      className="fixed top-0 bottom-0 z-[9000] flex flex-col"
      style={{
        [side]: 0,
        width: `${width}px`,
        background: bg,
        color: textColor,
        boxShadow: side === "right"
          ? "-20px 0 60px rgba(0,0,0,0.18)"
          : "20px 0 60px rgba(0,0,0,0.18)",
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={() => setResizing(true)}
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-black/10"
        style={{ [side === "right" ? "left" : "right"]: 0 }}
      />

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="w-9 h-9 rounded-full grid place-items-center" style={{ background: accent }}>
          <Image src="/assets/ba-icon-white.png" alt="" width={18} height={18} />
        </div>
        <div className="flex flex-col leading-[1.15]">
          <b className="font-semibold text-sm">{brand}</b>
          <small className="text-[11px] opacity-60 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            Live · Buddy Assist
          </small>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto w-7 h-7 rounded-md text-lg opacity-60 hover:opacity-100 hover:bg-black/5"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {introLines.map((line, i) => (
          <div
            key={i}
            className="self-start max-w-[85%] px-3.5 py-2.5 text-[13.5px] leading-[1.5] rounded-2xl rounded-bl"
            style={{ background: "rgba(0,0,0,0.04)" }}
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
                className="text-left px-3 py-2.5 rounded-lg border text-[12.5px] cursor-pointer"
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
            className={`max-w-[85%] px-3.5 py-2.5 text-[13.5px] leading-[1.5] rounded-2xl whitespace-pre-wrap ${
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
          <div className="self-start px-3.5 py-3 rounded-2xl rounded-bl flex gap-1" style={{ background: "rgba(0,0,0,0.04)" }}>
            <span className="typing-dot" />
            <span className="typing-dot" style={{ animationDelay: ".15s" }} />
            <span className="typing-dot" style={{ animationDelay: ".3s" }} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t px-3 py-2.5 flex gap-2 items-center"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${brand}…`}
          autoComplete="off"
          className="flex-1 border-0 outline-none text-[13.5px] bg-transparent px-1 py-2.5"
          style={{ color: textColor }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="w-9 h-9 rounded-full grid place-items-center text-sm transition-colors disabled:opacity-40"
          style={{ background: accent, color: textColor }}
        >
          →
        </button>
      </form>
    </aside>
  );
}
