"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, cartCount } from "@/lib/cart";

export function AcmeCartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(cartCount(getCart()));
    const refresh = () => setCount(cartCount(getCart()));
    window.addEventListener("acme-cart-update", refresh);
    return () => window.removeEventListener("acme-cart-update", refresh);
  }, []);

  return (
    <Link
      href="/demo/acme/cart"
      aria-label={`Cart (${count} items)`}
      className="relative w-[34px] h-[34px] rounded-full border border-[#E8E3D9] grid place-items-center bg-white no-underline text-[#191815] hover:border-[#191815] transition-colors"
    >
      {/* bag icon */}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#C8553D] text-white text-[9px] w-[18px] h-[18px] rounded-full grid place-items-center font-semibold leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
