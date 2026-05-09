import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { FloatingChat } from "@/components/chat/FloatingChat";

const PRODUCTS = [
  { name: "Mara Bowl", price: "$48", sub: "Stoneware · set of 2", bg: "#E2C8B5", shape: "#9A3F2C", badge: "New" },
  { name: "Sage Throw", price: "$128", sub: "Brushed wool · 50×72\"", bg: "#C9D6CD", shape: "#3A4A3F" },
  { name: "Field Carafe", price: "$62", sub: "Mouth-blown glass · 32oz", bg: "#E8E3D9", shape: "#191815", badge: "Best" },
  { name: "Ember Lamp", price: "$215", sub: "Linen + brass · 14\"", bg: "#F1ECE0", shape: "#C8553D" },
];

const CATEGORIES = [
  { ct: "01 / Tableware", nm: "Earth & Stone", grad: "linear-gradient(160deg,#F1ECE0,#D9C7A8)", color: "#191815" },
  { ct: "02 / Linens", nm: "Soft Living", grad: "linear-gradient(160deg,#E2C8B5,#C8553D)", color: "#fff" },
  { ct: "03 / Kitchen", nm: "Slow Cooking", grad: "linear-gradient(160deg,#C9D6CD,#7A9587)", color: "#191815" },
  { ct: "04 / Light", nm: "Quiet Hours", grad: "linear-gradient(160deg,#191815,#3A3530)", color: "#fff" },
];

const SYSTEM_PROMPT = `
You are Buddy, the in-store assistant for Acme — a slow-goods home store (pottery, linens, kitchen, lighting).
The store is small and curated. Best-sellers include: Mara Bowl ($48, stoneware set of 2), Sage Throw ($128, brushed wool), Field Carafe ($62, mouth-blown glass), Ember Lamp ($215, linen+brass).
Shipping: free over $75; in-stock items ship within 24h; standard 2-5 business days domestic. Returns: 60 days, free, door pickup.
You can recommend items, suggest pairings, give care advice, estimate shipping windows, and explain returns. You cannot place orders or charge cards — say "I'll hand you to checkout for that" instead.
When recommending, name 1-3 specific items with prices. Keep replies short and warm.
`.trim();

export const metadata = { title: "Acme Store — Modern Goods for Everyday Living" };

export default function AcmeStorePage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ["--ink" as string]: "#191815",
        ["--paper" as string]: "#FAF8F4",
        ["--line" as string]: "#E8E3D9",
        ["--mute" as string]: "#8A847A",
        ["--accent" as string]: "#C8553D",
        ["--accent-deep" as string]: "#9A3F2C",
        ["--soft" as string]: "#F1ECE0",
        background: "#FAF8F4",
        color: "#191815",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Announcement bar */}
      <div className="bg-[#191815] text-[#FAF8F4] py-2 text-center text-[11.5px] tracking-[0.06em]">
        Free shipping over $75 · <b className="text-[#C8553D] font-medium">Spring sale ends Sunday</b>
      </div>

      <header className="border-b border-[#E8E3D9] bg-[#FAF8F4] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-7 py-4.5 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="hidden md:flex gap-6 text-[13px]">
            {["Shop all", "New", "Home", "Kitchen", "Sale"].map((l) => (
              <a key={l} className="relative py-1 cursor-pointer hover:text-[#9A3F2C]">{l}</a>
            ))}
          </div>
          <div className="font-serif text-[28px] -tracking-[0.02em] text-center">
            acme<span className="text-[#C8553D]">.</span>
          </div>
          <div className="flex justify-end gap-4.5 items-center text-[13px]">
            <span className="w-8.5 h-8.5 rounded-full border border-[#E8E3D9] grid place-items-center bg-white">⌕</span>
            <span className="w-8.5 h-8.5 rounded-full border border-[#E8E3D9] grid place-items-center bg-white">♡</span>
            <span className="relative w-8.5 h-8.5 rounded-full border border-[#E8E3D9] grid place-items-center bg-white">
              ⌒
              <span className="absolute -top-1 -right-1 bg-[#C8553D] text-white text-[9px] w-3.5 h-3.5 rounded-full grid place-items-center">3</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-7 pt-15 pb-20 grid md:grid-cols-[1.05fr_1fr] gap-12 items-center">
        <div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-[#9A3F2C] font-medium">
            Spring 2026 · The Earthen Edit
          </div>
          <h1 className="font-serif text-[clamp(54px,7vw,96px)] font-normal leading-[0.95] -tracking-[0.02em] my-4">
            Things you&apos;ll <em className="italic text-[#C8553D]">keep</em> for years.
          </h1>
          <p className="text-[#8A847A] text-[17px] max-w-[46ch] mb-7 leading-[1.55]">
            Slow goods for the home — pottery, linens, kitchen tools, and small-batch finds. Made well, priced fairly, shipped quickly.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button type="button" className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#191815] text-[#FAF8F4] rounded-full font-medium text-[13px] tracking-[0.02em] cursor-pointer hover:-translate-y-px transition-transform">
              Shop the edit →
            </button>
            <button type="button" className="inline-flex items-center gap-2 px-5 py-3.5 bg-transparent text-[#191815] border border-[#191815] rounded-full font-medium text-[13px] cursor-pointer hover:-translate-y-px transition-transform">
              Lookbook
            </button>
          </div>
        </div>
        <div
          className="relative aspect-[0.92] rounded-xl overflow-hidden"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px), linear-gradient(160deg,#D9C7A8 0%, #C8553D 110%)",
          }}
        >
          <div
            className="absolute inset-[18%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 55%), linear-gradient(160deg, #F1ECE0, #B89866)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.18)",
            }}
          />
          <div
            className="absolute left-6 bottom-6 bg-white/90 px-3.5 py-2.5 rounded-lg flex flex-col gap-0.5 text-xs"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <b className="font-serif text-[18px]">Terracotta vessel</b>
            <span className="text-[#9A3F2C] font-semibold">$84.00</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1280px] mx-auto px-7 pb-15 grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((c, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl p-5.5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden"
            style={{ background: c.grad, color: c.color }}
          >
            <span className="text-[11px] tracking-[0.1em] uppercase opacity-70">{c.ct}</span>
            <span className="font-serif text-[24px] leading-none">{c.nm}</span>
          </div>
        ))}
      </section>

      {/* Products */}
      <section className="max-w-[1280px] mx-auto px-7 py-15">
        <div className="flex justify-between items-end border-b border-[#E8E3D9] pb-4.5 mb-7">
          <h2 className="font-serif text-[42px] font-normal -tracking-[0.02em] m-0">Best loved</h2>
          <a className="text-xs tracking-[0.08em] uppercase border-b border-[#191815] pb-0.5 cursor-pointer">Shop all →</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="flex flex-col gap-2">
              <div
                className="aspect-[0.85] rounded-lg relative overflow-hidden"
                style={{ background: p.bg }}
              >
                <div
                  className="absolute inset-[18%] rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 55%), ${p.shape}`,
                  }}
                />
                {p.badge && (
                  <span className="absolute left-3 top-3 bg-white px-2.5 py-1 rounded-full text-[10px] tracking-[0.08em] uppercase font-semibold">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-serif text-[18px] -tracking-[0.01em]">{p.name}</span>
                <span className="font-semibold text-sm">{p.price}</span>
              </div>
              <span className="text-xs text-[#8A847A]">{p.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Promise band */}
      <section className="bg-[#191815] text-[#FAF8F4] py-15 px-7 mt-15">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { h: "Made slow.", p: "Most pieces are made-to-order by small workshops. We list lead times honestly." },
            { h: "Shipped quick.", p: "If we have it in stock, it leaves within 24 hours. Carbon-neutral on every order." },
            { h: "Returned easy.", p: "60 days, no receipts, no restocking. We collect from your door." },
            { h: "Made better.", p: "1% of every sale plants native trees through our partner Heartwood." },
          ].map((it) => (
            <div key={it.h} className="border-l border-white/15 pl-4.5">
              <h4 className="font-serif text-[24px] font-normal m-0 mb-1.5">{it.h}</h4>
              <p className="text-white/65 m-0 text-[13px] leading-[1.55]">{it.p}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-7 py-10 border-t border-[#E8E3D9] text-xs text-[#8A847A]">
        <div className="max-w-[1280px] mx-auto flex justify-between flex-wrap gap-3.5">
          <span>© 2026 Acme — Demo storefront powered by Buddy Assist.</span>
          <span>Care · Shipping · Returns · Press</span>
        </div>
      </footer>

      <FloatingChat
        systemPrompt={SYSTEM_PROMPT}
        brand="Acme Assistant"
        greeting="Need a hand finding something?"
        introLines={[
          "Hi — I can help with the catalog, your cart, returns, and shipping windows. Ask me anything, or pick a starter:",
        ]}
        suggests={[
          { pill: "Gift", text: "Help me pick a housewarming gift under $100." },
          { pill: "Match", text: "What goes with the Mara Bowl?" },
          { pill: "Ship", text: "Will the Ember Lamp arrive before Friday in NYC?" },
          { pill: "Care", text: "How do I clean stoneware?" },
        ]}
        inputPlaceholder="Try: 'jacket for a rainy commute under $200'"
        catalog={PRODUCTS}
      />
      <IndustrySwitcher currentSlug="acme" />
    </div>
  );
}
