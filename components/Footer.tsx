import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-7 py-12 bg-[#0A0A0A] text-white/45 text-[11px] tracking-[0.1em] uppercase border-t border-white/[0.08]">
      <div className="max-w-[1280px] mx-auto flex justify-between gap-5 flex-wrap">
        <span>© 2026 Buddy Assist · Demo build</span>
        <span className="flex gap-[18px]">
          <Link href="/brand" className="text-white/70 no-underline hover:text-white">Brand book</Link>
          <a href="#top" className="text-white/70 no-underline hover:text-white">Back to top ↑</a>
        </span>
      </div>
    </footer>
  );
}
