"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { INDUSTRIES } from "@/lib/industries";

export function IndustrySwitcher({ currentSlug }: { currentSlug: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const idx = INDUSTRIES.findIndex((i) => i.slug === currentSlug);
  const current = INDUSTRIES[idx] || INDUSTRIES[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed left-4 bottom-4 z-[99999] font-sans"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Tray */}
      <div
        className={`absolute left-0 bottom-[calc(100%+10px)] w-[360px] bg-white text-[#0A0A0A] rounded-2xl overflow-hidden transition-all ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        style={{
          boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 0 0 1px #EAEAEA",
        }}
      >
        <div className="px-4 pt-3.5 pb-2.5 border-b border-[#EAEAEA] flex items-center gap-2.5">
          <Image src="/assets/ba-icon-green.png" alt="" width={22} height={22} />
          <div className="font-grotesk font-medium text-sm -tracking-[0.01em]">Buddy Assist · Live demo</div>
          <span className="text-[11px] text-[#6B6B6B] ml-auto tracking-[0.06em] uppercase">Switch industry</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {INDUSTRIES.map((ind) => {
            const active = ind.slug === currentSlug;
            return (
              <Link
                key={ind.id}
                href={`/demo/${ind.slug}`}
                className={`grid grid-cols-[28px_1fr_auto] gap-2.5 px-4 py-2.5 items-center cursor-pointer no-underline text-inherit ${
                  active ? "bg-[#E8F9EF]" : "hover:bg-[#F6F6F4]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full justify-self-center"
                  style={{
                    background: active ? "#2FC463" : "#EAEAEA",
                    boxShadow: active ? "0 0 0 4px rgba(47,196,99,0.18)" : undefined,
                  }}
                />
                <span className="font-grotesk font-medium text-[13.5px] leading-[1.2]">
                  {ind.name}
                  <small className="block font-sans font-normal text-[11px] text-[#6B6B6B] mt-0.5">
                    {ind.domain}
                  </small>
                </span>
                <span className="font-mono text-[9.5px] uppercase text-[#6B6B6B] tracking-[0.08em] text-right">
                  {ind.surface}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="px-4 py-2.5 border-t border-[#EAEAEA] flex justify-between items-center text-[11px] text-[#6B6B6B]">
          <span>Each is the same Buddy under different skins.</span>
          <Link href="/" className="text-[#1E9E4B] font-medium no-underline">← Landing</Link>
        </div>
      </div>

      {/* Pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Switch industry"
        className="flex items-center gap-2.5 pl-2 pr-3 py-2 bg-[#0A0A0A] text-white rounded-full cursor-pointer select-none text-[12.5px] -tracking-[0.005em] transition-transform hover:-translate-y-px"
        style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)" }}
      >
        <span className="w-6 h-6 rounded-full bg-[#2FC463] inline-flex items-center justify-center text-[#0A0A0A] font-bold text-[11px] font-grotesk">
          B
        </span>
        <span className="flex flex-col leading-[1.1] items-start">
          <span className="text-[9.5px] text-[#9A9A9A] tracking-[0.12em] uppercase">
            Demo · {idx + 1}/{INDUSTRIES.length}
          </span>
          <span className="font-medium text-[12.5px]">{current.name}</span>
        </span>
        <span className="text-[#6B6B6B] text-[11px] pl-1">▴</span>
      </button>
    </div>
  );
}
