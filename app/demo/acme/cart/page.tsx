"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { AcmeCartIcon } from "@/components/acme/AcmeCartIcon";
import {
  getCart,
  removeFromCart,
  updateQty,
  cartTotal,
  type CartItem,
} from "@/lib/cart";

const SYSTEM_PROMPT = `
You are Buddy, the in-store assistant for Acme — a slow-goods home store.
The user is viewing their cart. Help them check out, remove items, or find complementary products.
Shipping: free over $75; in-stock items ship within 24h. Returns: 60 days, free door pickup.
You cannot place orders — say "I'll hand you to checkout for that" instead.
When recommending products keep replies short and warm.
`.trim();

export default function AcmeCartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCart(getCart());
    const refresh = () => setCart(getCart());
    window.addEventListener("acme-cart-update", refresh);
    return () => window.removeEventListener("acme-cart-update", refresh);
  }, []);

  const total = cartTotal(cart);
  const freeShipping = total >= 75;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#FAF8F4",
        color: "#191815",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Announcement */}
      <div className="bg-[#191815] text-[#FAF8F4] py-2 text-center text-[11.5px] tracking-[0.06em]">
        Free shipping over $75 ·{" "}
        <b className="text-[#C8553D] font-medium">Spring sale ends Sunday</b>
      </div>

      {/* Header */}
      <header className="border-b border-[#E8E3D9] bg-[#FAF8F4] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-7 py-4.5 flex items-center justify-between">
          <Link
            href="/demo/acme"
            className="font-serif text-[28px] -tracking-[0.02em] no-underline text-inherit"
          >
            acme<span className="text-[#C8553D]">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/demo/acme"
              className="text-[13px] text-[#8A847A] no-underline hover:text-[#191815]"
            >
              ← Continue shopping
            </Link>
            <AcmeCartIcon />
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-7 py-12 w-full flex-1">
        <h1 className="font-serif text-[42px] font-normal -tracking-[0.02em] mb-8">
          Your Cart
        </h1>

        {!mounted ? null : cart.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <span className="text-[48px]">🛍️</span>
            <p className="text-[#8A847A] text-[17px]">Your cart is empty.</p>
            <Link
              href="/demo/acme"
              className="inline-block px-6 py-3.5 bg-[#191815] text-[#FAF8F4] rounded-full text-[13px] font-medium no-underline hover:-translate-y-px transition-transform"
            >
              Shop the collection
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-10 items-start">
            {/* Line items */}
            <div className="flex flex-col divide-y divide-[#E8E3D9]">
              {cart.map((item) => (
                <div key={item.sku} className="flex gap-4 py-5 items-center">
                  <Link href={`/demo/acme/product/${item.sku}`} className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-[#F1ECE0]"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/demo/acme/product/${item.sku}`}
                      className="font-serif text-[18px] -tracking-[0.01em] no-underline text-inherit hover:text-[#9A3F2C]"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[13px] text-[#8A847A] mt-0.5">
                      ${item.price.toFixed(2)} each
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => updateQty(item.sku, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-[#E8E3D9] grid place-items-center text-[16px] cursor-pointer hover:border-[#191815] transition-colors"
                      >
                        −
                      </button>
                      <span className="text-[14px] font-medium w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.sku, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-[#E8E3D9] grid place-items-center text-[16px] cursor-pointer hover:border-[#191815] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold text-[16px]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.sku)}
                      className="text-[11px] text-[#8A847A] hover:text-[#C8553D] cursor-pointer border-b border-transparent hover:border-[#C8553D] transition-colors bg-transparent border-0 p-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-6 flex flex-col gap-4 sticky top-[80px]">
              <h2 className="font-serif text-[22px] font-normal -tracking-[0.01em] m-0">
                Order summary
              </h2>

              <dl className="flex flex-col gap-2 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-[#8A847A]">Subtotal</dt>
                  <dd className="m-0 font-medium">${total.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8A847A]">Shipping</dt>
                  <dd className="m-0 font-medium">
                    {freeShipping ? (
                      <span className="text-[#1E9E4B]">Free</span>
                    ) : (
                      <>
                        $6.95{" "}
                        <span className="text-[#8A847A] text-[11px]">
                          (add ${(75 - total).toFixed(2)} for free)
                        </span>
                      </>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E8E3D9] pt-2.5 mt-1">
                  <dt className="font-semibold">Total</dt>
                  <dd className="m-0 font-semibold text-[16px]">
                    ${(total + (freeShipping ? 0 : 6.95)).toFixed(2)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="w-full py-3.5 bg-[#191815] text-[#FAF8F4] rounded-full font-medium text-[13px] cursor-pointer hover:-translate-y-px transition-transform text-center"
              >
                Proceed to checkout →
              </button>

              <p className="text-[11px] text-[#8A847A] text-center m-0">
                60-day returns · free door pickup · Carbon-neutral delivery
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="px-7 py-10 border-t border-[#E8E3D9] text-xs text-[#8A847A]">
        <div className="max-w-[1280px] mx-auto flex justify-between flex-wrap gap-3.5">
          <span>© 2026 Acme — Demo storefront powered by Buddy Assist.</span>
          <span>Care · Shipping · Returns · Press</span>
        </div>
      </footer>

      <FloatingChat
        systemPrompt={SYSTEM_PROMPT}
        brand="Acme Assistant"
        greeting="Questions about your cart?"
        introLines={[
          "Hi — I can help you review your cart, check shipping, or find anything else you need.",
        ]}
        suggests={[
          { pill: "Ship", text: "When will my order arrive?" },
          { pill: "Return", text: "How does the return policy work?" },
          { pill: "More", text: "What else goes with what's in my cart?" },
          { pill: "Cart", text: "What's in my cart right now?" },
        ]}
        inputPlaceholder="Ask about your order…"
        industrySlug="acme"
      />
      <IndustrySwitcher currentSlug="acme" />
    </div>
  );
}
