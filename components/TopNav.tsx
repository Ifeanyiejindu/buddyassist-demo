import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";

interface TopNavProps {
  variant?: "home" | "page";
}

export function TopNav({ variant = "home" }: TopNavProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[200] border-b border-line backdrop-blur-md backdrop-saturate-[160%]"
      style={{ background: "color-mix(in srgb, var(--paper) 86%, transparent)" }}
    >
      <div className="max-w-[1280px] mx-auto px-7 py-3.5 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <Image
            src="/assets/ba-icon-green.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="font-grotesk text-[17px] font-normal -tracking-[0.01em]">
            buddy<b className="font-bold">assist</b>
          </span>
        </Link>
        <nav className="flex gap-[22px] ml-auto">
          {variant === "home" ? (
            <>
              <a href="#how" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">How it works</a>
              <a href="#surfaces" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Surfaces</a>
              <a href="#industries" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Industries</a>
              <Link href="/brand" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Brand</Link>
            </>
          ) : (
            <>
              <Link href="/" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Home</Link>
              <Link href="/#industries" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Industries</Link>
              <Link href="/brand" className="text-[13px] text-ink no-underline opacity-80 hover:opacity-100 hover:text-green-deep">Brand</Link>
            </>
          )}
        </nav>
        <ThemeToggle />
        <a
          href="#industries"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green text-ink no-underline font-grotesk text-[13px] font-medium transition-transform hover:-translate-y-px"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-ink" style={{ boxShadow: "0 0 0 3px rgba(0,0,0,0.18)" }} />
          See it in action
        </a>
      </div>
    </header>
  );
}
