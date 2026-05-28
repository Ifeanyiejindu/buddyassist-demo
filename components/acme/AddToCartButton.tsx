"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

interface Props {
  sku: string;
  name: string;
  price: number;
  image: string;
  outOfStock?: boolean;
}

export function AddToCartButton({ sku, name, price, image, outOfStock }: Props) {
  const [state, setState] = useState<"idle" | "added">("idle");

  function handleAdd() {
    addToCart({ sku, name, price, image });
    setState("added");
    setTimeout(() => setState("idle"), 2200);
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#191815] text-[#FAF8F4] rounded-full font-medium text-[13px] opacity-40 cursor-not-allowed"
      >
        Sold out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={state === "added"}
      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium text-[13px] cursor-pointer transition-all hover:-translate-y-px disabled:cursor-default"
      style={{
        background: state === "added" ? "#1E9E4B" : "#191815",
        color: "#FAF8F4",
        transform: state === "added" ? "none" : undefined,
      }}
    >
      {state === "added" ? "✓ Added to cart!" : "Add to cart"}
    </button>
  );
}
