import Image from "next/image";
import Link from "next/link";

const NAV = [
  { num: "00", id: "intro", label: "Introduction" },
  { num: "01", id: "story", label: "Brand story" },
  { num: "02", id: "logo", label: "Logo system" },
  { num: "03", id: "clearspace", label: "Clearspace & sizing" },
  { num: "04", id: "misuse", label: "Misuse" },
  { num: "05", id: "color", label: "Color" },
  { num: "06", id: "type", label: "Typography" },
  { num: "07", id: "voice", label: "Voice & tone" },
  { num: "08", id: "applications", label: "Applications" },
  { num: "09", id: "contact", label: "Contact" },
];

const PRINCIPLES = [
  { n: "01", h: "Helpful before clever.", p: "Every surface should solve something. Cleverness is a reward for doing the work, never a substitute." },
  { n: "02", h: "Answers, not dashboards.", p: "We reduce effort between question and insight. Charts serve answers — not the other way around." },
  { n: "03", h: "Friendly is a feature.", p: "Warmth isn't decoration. A buddy tone invites the questions people were afraid to ask." },
  { n: "04", h: "Trust the receipts.", p: "Every agent answer cites its source. Confidence is earned through transparency, not claims." },
];

const COLORS = [
  { name: "Ink", hex: "#0A0A0A", rgb: "10 · 10 · 10", cmyk: "75 · 68 · 67 · 90", pms: "Black 6 C", pct: "50%", bg: "#0A0A0A", fg: "#fff" },
  { name: "Signal Green", hex: "#2FC463", rgb: "47 · 196 · 99", cmyk: "72 · 0 · 79 · 0", pms: "2257 C", pct: "40%", bg: "#2FC463", fg: "#0A0A0A" },
  { name: "Paper", hex: "#FFFFFF", rgb: "255 · 255 · 255", cmyk: "0 · 0 · 0 · 0", pms: "—", pct: "10%", bg: "#FFFFFF", fg: "#0A0A0A" },
];

const GREEN_SCALE = [
  { wt: "100", code: "#E8F9EF", text: "#1E9E4B" },
  { wt: "200", code: "#BFEFD1", text: "#1E9E4B" },
  { wt: "400", code: "#7EDDA1", text: "#0A0A0A" },
  { wt: "500", code: "#2FC463", text: "#0A0A0A" },
  { wt: "700", code: "#1E9E4B", text: "#FFFFFF" },
  { wt: "900", code: "#0E6A30", text: "#FFFFFF" },
];

const NEUTRAL_SCALE = [
  { wt: "00", code: "#FFFFFF", text: "#0A0A0A", border: true },
  { wt: "50", code: "#F6F6F4", text: "#0A0A0A" },
  { wt: "100", code: "#EAEAEA", text: "#0A0A0A" },
  { wt: "400", code: "#9A9A9A", text: "#0A0A0A" },
  { wt: "800", code: "#3A3A3A", text: "#FFFFFF" },
  { wt: "950", code: "#0A0A0A", text: "#FFFFFF" },
];

const TYPE_SCALE = [
  { name: "Display", spec: "Grotesk · 72 / 68\ntracking −0.03em", sample: "Ask your buddy.", use: "Marketing · Hero", cls: "font-grotesk font-medium text-[72px] leading-[0.95] -tracking-[0.03em]" },
  { name: "H1", spec: "Grotesk · 48 / 48\ntracking −0.025em", sample: "The agent platform for your data.", use: "Page titles", cls: "font-grotesk font-medium text-[48px] leading-none -tracking-[0.025em]" },
  { name: "H2", spec: "Grotesk · 32 / 36\ntracking −0.02em", sample: "Static data, made interactive.", use: "Section titles", cls: "font-grotesk font-medium text-[32px] leading-[1.1] -tracking-[0.02em]" },
  { name: "H3", spec: "Grotesk · 22 / 26\ntracking −0.01em", sample: "Bring your own data sources.", use: "Sub-sections", cls: "font-grotesk font-medium text-[22px] leading-[1.2] -tracking-[0.01em]" },
  { name: "Lede", spec: "Inter · 20 / 30\ntracking 0", sample: "Point Buddy at your spreadsheet and start chatting in under a minute.", use: "Intro paragraphs", cls: "text-[20px] leading-[1.5] text-mute" },
  { name: "Body", spec: "Inter · 15 / 23\ntracking 0", sample: "Every answer comes with receipts — a trace of the exact rows, tables, or documents it drew from.", use: "Long-form", cls: "text-[15px] leading-[1.55]" },
  { name: "Small", spec: "Inter · 12 / 18\nMedium 500", sample: "Meta, labels, footer text, and form helpers.", use: "UI · meta", cls: "text-[12px] font-medium leading-[1.5]" },
  { name: "Mono", spec: "JetBrains · 11\n+0.1em uppercase", sample: "SYSTEM · TELEMETRY · AGENT_V1.2", use: "Code · kickers", cls: "font-mono text-[11px] tracking-[0.1em] uppercase text-mute" },
];

const VOICE_TRAITS = [
  { tag: "Trait 01", h: "Warm, not cute.", p: "We're a buddy, not a mascot. Friendly enough to ask anything, professional enough to take to the boardroom." },
  { tag: "Trait 02", h: "Plain English.", p: "Jargon hides meaning. Use short words, real verbs, and stakes the reader actually cares about." },
  { tag: "Trait 03", h: "Receipts, always.", p: "Claims get evidence. If we promise insight, we show how it was earned — in the product and in our copy." },
  { tag: "Trait 04", h: "Confident without swagger.", p: "We are good at what we do. We don't need to shout about it. The product does the bragging." },
];

const COPY_PAIRS = [
  { do: "Point Buddy at your spreadsheet. Ask it anything.", dont: "Leverage our RAG-powered tabular ingestion pipeline to unlock data-driven decisioning." },
  { do: "Your buddy couldn't find that. Want to try rephrasing?", dont: "Error 4002: The query vector returned zero semantic matches." },
  { do: "Every answer comes with its receipts.", dont: "Buddy features best-in-class hallucination mitigation architecture." },
];

export const metadata = { title: "Buddy Assist — Brand Guidelines" };

export default function BrandGuidePage() {
  return (
    <div className="grid lg:grid-cols-[260px_1fr] max-w-[1440px] mx-auto">
      {/* Side nav */}
      <aside className="lg:sticky lg:top-0 lg:h-screen lg:self-start border-r border-line p-7 flex flex-col gap-7 bg-paper">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-ink">
          <Image src="/assets/ba-icon-green.png" alt="" width={28} height={28} />
          <span className="font-grotesk text-[18px] font-normal -tracking-[0.01em]">
            buddy<b className="font-bold">assist</b>
          </span>
        </Link>

        <div className="flex flex-col gap-0.5 text-[11px] uppercase tracking-[0.12em] text-mute">
          <span>Brand Guidelines</span>
          <span className="text-ink">Volume 01 · v1.0</span>
          <span>April 2026</span>
        </div>

        <ul className="flex flex-col gap-0.5 text-[13px] m-0 p-0 list-none">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="flex items-baseline gap-3 py-1.5 no-underline text-ink hover:text-green-deep">
                <span className="font-mono text-[10px] text-mute-2 min-w-[22px]">{n.num}</span>
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-auto text-[11px] text-mute leading-[1.5]">
          Questions or asset requests<br />
          hello@buddyassist.io
        </div>
      </aside>

      {/* Main */}
      <main id="top">
        {/* HERO */}
        <section className="border-b border-line bg-paper relative overflow-hidden">
          <div className="flex justify-between border-t border-[#141414] px-7 lg:px-[72px] py-3.5 text-[11px] uppercase tracking-[0.14em]">
            <span>Brand Guidelines</span>
            <span>buddyassist.io</span>
            <span>Vol. 01 · 2026</span>
          </div>
          <div className="px-7 lg:px-[72px] py-14 lg:py-16 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-end min-h-[86vh]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-mute font-medium mb-5.5">
                The Buddy Assist brand book
              </div>
              <h1 className="font-grotesk font-medium m-0 text-[clamp(56px,9vw,128px)] leading-[0.92] -tracking-[0.035em]">
                A <em className="not-italic text-green">friendlier</em><br />
                way to talk<br />
                to data.
              </h1>
              <p className="text-mute text-[17px] max-w-[40ch] mt-6">
                This is the reference for how we look, sound, and show up. Built for the team, partners, and anyone who helps tell our story.
              </p>
            </div>
            <div className="flex justify-end">
              <Image
                src="/assets/ba-icon-green.png"
                alt=""
                width={400}
                height={400}
                className="w-3/4 h-auto"
                style={{ filter: "drop-shadow(0 30px 60px rgba(47,196,99,0.18))" }}
              />
            </div>
          </div>
        </section>

        {/* INTRO */}
        <Chapter id="intro" num="00 / INTRO" title="About this guide." lede="Buddy Assist turns static data into agents you can actually talk to. These guidelines keep the brand feeling like what we build — warm, sharp, and endlessly useful.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Who this is for" body="Anyone producing Buddy Assist communications — designers, writers, partners, vendors, and internal teams." />
            <Card title="What's inside" body="Brand story, logo rules, color, typography, voice, and application references you can reach for today." />
            <Card title="When to ask" body="If the guide doesn't cover it, default to the nearest principle and send us a note. The brand is a living system." />
          </div>
        </Chapter>

        {/* STORY */}
        <Chapter id="story" num="01 / STORY" title="The idea." lede="Data shouldn't sit on a shelf. We build agents that make it curious, responsive, and — for the first time — genuinely helpful.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <Kicker>Mission</Kicker>
              <blockquote className="font-grotesk text-[34px] leading-[1.15] font-normal -tracking-[0.02em] m-0 border-l-[3px] border-green pl-6 py-1">
                We turn dormant data into <em className="not-italic text-green-deep">a buddy that answers.</em><br />
                One agent. One question. One click to insight.
              </blockquote>

              <div className="mt-10">
                <Kicker>Positioning</Kicker>
                <p className="text-[15px] max-w-[46ch] mt-3">
                  Buddy Assist is the agent platform that sits on top of your existing data — spreadsheets, docs, warehouses, product telemetry — and makes it conversational. No dashboards to learn. No queries to write. Just ask your buddy.
                </p>
              </div>
            </div>
            <div>
              <Kicker>Principles</Kicker>
              <div className="border-t border-line mt-3">
                {PRINCIPLES.map((p) => (
                  <div key={p.n} className="grid grid-cols-[36px_1fr] gap-6 py-5.5 border-b border-line items-baseline">
                    <div className="font-mono text-[11px] text-mute-2">{p.n}</div>
                    <div>
                      <h4 className="font-grotesk font-medium text-[18px] m-0 mb-1 -tracking-[0.01em]">{p.h}</h4>
                      <p className="text-[14px] text-mute m-0">{p.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Chapter>

        {/* LOGO */}
        <Chapter id="logo" num="02 / LOGO" title="The logo." lede="The Buddy Assist mark pairs a soft, cut-out 'B' with three sparkles — a nod to the spark of insight an agent provides. The wordmark balances a regular 'buddy' with a bolder 'assist' to signal action.">
          <KickerRow heading="Primary lockup" tag="02.1" />
          <div className="border border-line bg-bg-soft py-20 px-14 grid place-items-center min-h-[320px] mb-6">
            <Image src="/assets/ba-logo-black.png" alt="" width={520} height={140} className="max-w-[68%] h-auto" />
          </div>

          <KickerRow heading="Color variants" tag="02.3" topGap />
          <div className="grid grid-cols-1 md:grid-cols-3 border border-line">
            {[
              { bg: "#FFFFFF", img: "/assets/ba-logo-black.png", primary: "Primary", note: "On light" },
              { bg: "#0A0A0A", img: "/assets/ba-logo-white.png", primary: "Reversed", note: "On ink" },
              { bg: "#2FC463", img: "/assets/ba-logo-white.png", primary: "Brand", note: "On green" },
            ].map((v, i) => (
              <div key={i} className="flex flex-col border-b border-r border-line last:border-r-0">
                <div className="flex-1 grid place-items-center px-8 py-12 min-h-[200px]" style={{ background: v.bg }}>
                  <Image src={v.img} alt="" width={400} height={70} className="max-w-[80%] max-h-[70px] h-auto" />
                </div>
                <div className="border-t border-line px-4 py-3 flex justify-between text-[11px] uppercase tracking-[0.12em] text-mute">
                  <b className="font-medium text-ink">{v.primary}</b>
                  <span>{v.note}</span>
                </div>
              </div>
            ))}
          </div>

          <KickerRow heading="Icon mark" tag="02.4" topGap />
          <p className="text-[12px] text-mute -mt-4 mb-3 max-w-[60ch]">
            Use the icon-only mark for favicons, avatars, app launchers, and tight spaces where the wordmark can't breathe. Minimum size 16px digital / 8mm print.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-line">
            {[
              { bg: "#FFFFFF", img: "/assets/ba-icon-green.png", n: "01", note: "Green / light" },
              { bg: "#2FC463", img: "/assets/ba-icon-white.png", n: "02", note: "White / green" },
              { bg: "#0A0A0A", img: "/assets/ba-icon-green.png", n: "03", note: "Green / ink" },
              { bg: "#0A0A0A", img: "/assets/ba-icon-white.png", n: "04", note: "White / ink" },
            ].map((v) => (
              <div key={v.n} className="flex flex-col border-r border-b border-line last:border-r-0 aspect-square">
                <div className="flex-1 grid place-items-center" style={{ background: v.bg }}>
                  <Image src={v.img} alt="" width={120} height={120} className="w-1/2 h-auto" />
                </div>
                <div className="border-t border-line px-3.5 py-2.5 flex justify-between text-[10px] uppercase tracking-[0.12em] text-mute">
                  <span>{v.n}</span>
                  <span>{v.note}</span>
                </div>
              </div>
            ))}
          </div>
        </Chapter>

        {/* CLEARSPACE */}
        <Chapter id="clearspace" num="03 / CLEARSPACE" title="Room to breathe." lede="Protect the mark with a clearspace equal to the height of the sparkle. Keep it unobstructed — no text, imagery, or other marks inside this zone.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="border border-line bg-bg-soft p-14 grid place-items-center">
              <div className="border border-dashed border-green p-10">
                <Image src="/assets/ba-logo-black.png" alt="" width={260} height={64} className="h-16 w-auto" />
              </div>
            </div>
            <div className="border border-line p-9 flex flex-col gap-4.5">
              <div>
                <Kicker>Minimum clearspace</Kicker>
                <div className="font-grotesk text-[26px] font-medium -tracking-[0.01em] mt-1.5">x = height of the sparkle ✦</div>
              </div>
              <div className="border-t border-line pt-4.5">
                <Kicker>Minimum size — digital</Kicker>
                <div className="font-grotesk text-[22px] font-medium mt-1.5">Wordmark · 120px wide<br />Icon · 16px wide</div>
              </div>
              <div className="border-t border-line pt-4.5">
                <Kicker>Minimum size — print</Kicker>
                <div className="font-grotesk text-[22px] font-medium mt-1.5">Wordmark · 24mm wide<br />Icon · 8mm wide</div>
              </div>
            </div>
          </div>
        </Chapter>

        {/* MISUSE */}
        <Chapter id="misuse" num="04 / MISUSE" title="Don'ts." lede="A few common pitfalls. When in doubt, use the supplied master files as-is and place them on approved brand colors.">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-line">
            {[
              { msg: "Don't stretch or squash the logo.", style: { transform: "scaleX(1.5)" } },
              { msg: "Don't rotate or tilt the mark.", style: { transform: "rotate(-12deg)" } },
              { msg: "Don't crowd the clearspace.", style: { width: "96%" } },
              { msg: "Don't place on non-brand gradients.", bg: "linear-gradient(135deg, #ff7a59, #7a5cff)", invert: true },
              { msg: "Don't reduce opacity or ghost the mark.", style: { opacity: 0.35 } },
              { msg: "Don't apply drop shadows or effects.", style: { filter: "drop-shadow(4px 4px 0 #2FC463)" } },
            ].map((m, i) => (
              <div key={i} className="aspect-[4/3] flex flex-col border-r border-b border-line last:border-r-0 overflow-hidden">
                <div className="flex-1 grid place-items-center bg-bg-soft p-6 relative" style={{ background: m.bg || "var(--bg-soft)" }}>
                  <Image src={m.invert ? "/assets/ba-logo-white.png" : "/assets/ba-logo-black.png"} alt="" width={280} height={50} className="max-w-[74%] max-h-[50px] h-auto" style={m.style} />
                </div>
                <div className="border-t border-line px-4 py-3 bg-paper flex gap-2.5 items-center">
                  <span className="w-4.5 h-4.5 rounded-full bg-[#E53935] text-white text-[11px] font-semibold grid place-items-center">×</span>
                  <span className="text-[12px] text-mute">{m.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </Chapter>

        {/* COLOR */}
        <Chapter id="color" num="05 / COLOR" title="Color." lede="Three colors do most of the work. Ink gives us authority, paper gives us room, and signal green is the spark.">
          <KickerRow heading="Primary palette" tag="05.1" />
          <div className="grid grid-cols-1 md:grid-cols-3 border border-line mb-8">
            {COLORS.map((c) => (
              <div key={c.name} className="flex flex-col border-r border-line last:border-r-0 min-h-[340px]">
                <div className="flex-1 flex items-end p-6 min-h-[200px]" style={{ background: c.bg, color: c.fg, boxShadow: c.name === "Paper" ? "inset 0 0 0 1px #EAEAEA" : undefined }}>
                  <div className="font-grotesk text-[80px] font-medium leading-none -tracking-[0.04em]">
                    {c.pct.replace("%", "")}<small className="text-[20px] font-normal align-baseline">%</small>
                  </div>
                </div>
                <div className="px-6 pt-4 pb-5 border-t border-line bg-paper">
                  <div className="font-grotesk text-[18px] font-medium m-0 mb-2 -tracking-[0.01em]">{c.name}</div>
                  <div className="grid gap-0.5 font-mono text-[11px] text-mute">
                    <div><b className="text-ink font-normal">HEX</b> &nbsp; {c.hex}</div>
                    <div><b className="text-ink font-normal">RGB</b> &nbsp; {c.rgb}</div>
                    <div><b className="text-ink font-normal">CMYK</b> {c.cmyk}</div>
                    <div><b className="text-ink font-normal">PMS</b> &nbsp; {c.pms}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <KickerRow heading="Signal green scale" tag="05.2" topGap />
          <div className="grid grid-cols-3 md:grid-cols-6 border border-line">
            {GREEN_SCALE.map((t) => (
              <div key={t.wt} className="aspect-[1.2] flex flex-col justify-end p-3 font-mono text-[10px]" style={{ background: t.code, color: t.text, borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="font-grotesk text-[15px] font-medium">{t.wt}</span>
                <span className="opacity-70">{t.code}</span>
              </div>
            ))}
          </div>

          <KickerRow heading="Ink & paper scale" tag="05.3" topGap />
          <div className="grid grid-cols-3 md:grid-cols-6 border border-line">
            {NEUTRAL_SCALE.map((t) => (
              <div key={t.wt} className={`aspect-[1.2] flex flex-col justify-end p-3 font-mono text-[10px] ${t.border ? "border" : ""}`} style={{ background: t.code, color: t.text, borderRight: "1px solid rgba(0,0,0,0.06)", borderColor: t.border ? "var(--line)" : undefined }}>
                <span className="font-grotesk text-[15px] font-medium">{t.wt}</span>
                <span className="opacity-70">{t.code}</span>
              </div>
            ))}
          </div>

          <KickerRow heading="Usage ratios" tag="05.4" topGap />
          <p className="text-[12px] text-mute -mt-4 mb-3 max-w-[60ch]">
            Paper leads, ink anchors, green accents. Flip the ratio on bold moments — full-bleed green is reserved for hero surfaces.
          </p>
          <div className="border-t border-line">
            {[
              { l: "Standard", bars: [{ f: 6, c: "#FFFFFF", t: "#0A0A0A", n: "Paper 60%" }, { f: 3, c: "#0A0A0A", t: "#FFFFFF", n: "Ink 30%" }, { f: 1, c: "#2FC463", t: "#0A0A0A", n: "Green 10%" }] },
              { l: "Ink-forward", bars: [{ f: 6, c: "#0A0A0A", t: "#FFFFFF", n: "Ink 60%" }, { f: 3, c: "#FFFFFF", t: "#0A0A0A", n: "Paper 30%" }, { f: 1, c: "#2FC463", t: "#0A0A0A", n: "Green 10%" }] },
              { l: "Hero moments", bars: [{ f: 7, c: "#2FC463", t: "#0A0A0A", n: "Green 70%" }, { f: 2, c: "#0A0A0A", t: "#FFFFFF", n: "Ink 20%" }, { f: 1, c: "#FFFFFF", t: "#0A0A0A", n: "Paper 10%" }] },
            ].map((r) => (
              <div key={r.l} className="grid grid-cols-[120px_1fr] gap-6 py-4.5 border-b border-line items-center">
                <div className="font-grotesk text-sm font-medium">{r.l}</div>
                <div className="h-7 flex border border-ink">
                  {r.bars.map((b, i) => (
                    <span key={i} className="flex items-center justify-center font-mono text-[10px]" style={{ flex: b.f, background: b.c, color: b.t }}>
                      {b.n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <KickerRow heading="Accessible pairings" tag="05.5" topGap />
          <div className="grid grid-cols-2 md:grid-cols-4 border border-line">
            {[
              { bg: "#FFFFFF", fg: "#0A0A0A", ratio: "19.3" },
              { bg: "#0A0A0A", fg: "#FFFFFF", ratio: "19.3" },
              { bg: "#2FC463", fg: "#0A0A0A", ratio: "10.1" },
              { bg: "#0A0A0A", fg: "#2FC463", ratio: "8.2" },
            ].map((a, i) => (
              <div key={i} className="aspect-square p-6 flex flex-col justify-between border-r border-line last:border-r-0" style={{ background: a.bg, color: a.fg }}>
                <div className="font-grotesk font-medium text-[38px] -tracking-[0.02em] leading-none">Ag</div>
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="font-grotesk text-[22px] font-medium">{a.ratio}</span>
                  <span className="bg-green text-ink px-1.5 py-0.5 font-medium tracking-[0.04em]">AAA</span>
                </div>
              </div>
            ))}
          </div>
        </Chapter>

        {/* TYPOGRAPHY */}
        <Chapter id="type" num="06 / TYPOGRAPHY" title="Typography." lede="Space Grotesk handles expression — the headlines, the big moments. Inter handles everything else — the reading, the UI, the fine print.">
          <div className="grid grid-cols-1 md:grid-cols-2 border border-line min-h-[440px]">
            <div className="p-10 flex flex-col border-r border-line">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="font-grotesk text-[22px] font-medium -tracking-[0.01em]">Space Grotesk</div>
                  <p className="text-[14px] text-mute mt-3 max-w-[38ch]">Primary typeface. Used for display, headings, and any expressive moment where the brand speaks first.</p>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">PRIMARY · DISPLAY</div>
              </div>
              <div className="mt-auto font-grotesk font-medium text-[clamp(120px,20vw,320px)] leading-none -tracking-[0.05em] text-ink">Aa</div>
            </div>
            <div className="p-10 flex flex-col">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="font-grotesk text-[22px] font-medium -tracking-[0.01em]">Inter</div>
                  <p className="text-[14px] text-mute mt-3 max-w-[38ch]">Secondary typeface. Used for body copy, UI, technical text, and anything that needs to stay readable at length.</p>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">SECONDARY · TEXT</div>
              </div>
              <div className="mt-auto font-medium text-[clamp(120px,20vw,320px)] leading-none -tracking-[0.05em]" style={{ fontFamily: "var(--font-inter)", color: "var(--green-deep)" }}>Aa</div>
            </div>
          </div>

          <KickerRow heading="Type scale" tag="06.2" topGap />
          <div className="border-t border-line">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="grid grid-cols-[120px_120px_1fr_120px] gap-6 py-5.5 border-b border-line items-baseline">
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">{t.name}</div>
                <div className="font-mono text-[11px] text-mute whitespace-pre-line">{t.spec}</div>
                <div className={`overflow-hidden text-ellipsis ${t.cls}`}>{t.sample}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{t.use}</div>
              </div>
            ))}
          </div>
        </Chapter>

        {/* VOICE */}
        <Chapter id="voice" num="07 / VOICE" title="Voice & tone." lede="We talk like a brilliant colleague who remembers your name. Confident, kind, and clear — never over-engineered.">
          <div className="grid grid-cols-1 md:grid-cols-2 border border-line">
            {VOICE_TRAITS.map((v, i) => (
              <div
                key={i}
                className="p-7 border-r border-b border-line"
                style={{ borderRight: i % 2 === 1 ? "none" : undefined, borderBottom: i >= 2 ? "none" : undefined }}
              >
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-mute mb-3.5">{v.tag}</div>
                <h4 className="font-grotesk font-medium text-[20px] m-0 mb-1.5 -tracking-[0.01em]">{v.h}</h4>
                <p className="text-[14px] text-mute m-0">{v.p}</p>
              </div>
            ))}
          </div>

          <KickerRow heading="Do / Don't" tag="07.2" topGap />
          {COPY_PAIRS.map((c, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 border border-line mb-2">
              <div className="p-5.5 px-6 border-r border-line">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-green" /> Do
                </div>
                <p className="font-grotesk text-[18px] font-normal -tracking-[0.01em] leading-[1.35] m-0">&ldquo;{c.do}&rdquo;</p>
              </div>
              <div className="p-5.5 px-6">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-ink" /> Don&apos;t
                </div>
                <p className="font-grotesk text-[18px] font-normal -tracking-[0.01em] leading-[1.35] m-0 text-mute" style={{ textDecoration: "line-through", textDecorationColor: "rgba(0,0,0,0.2)" }}>&ldquo;{c.dont}&rdquo;</p>
              </div>
            </div>
          ))}
        </Chapter>

        {/* APPLICATIONS */}
        <Chapter id="applications" num="08 / APPLICATIONS" title="In the wild." lede="A few reference applications for how the system comes together across product, marketing, and collateral.">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="aspect-[2/1] col-span-4 bg-ink text-white p-5 flex flex-col justify-between overflow-hidden">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-mute-2">Marketing · Billboard</div>
              <div>
                <div className="font-grotesk text-[36px] md:text-[56px] font-medium leading-[0.95] -tracking-[0.02em]">
                  Your data finally<br />gets a <span className="text-green">buddy</span>.
                </div>
                <p className="text-white/75 text-[13px] mt-3.5 max-w-[32ch]">The agent platform that turns spreadsheets, docs, and warehouses into a conversation.</p>
              </div>
              <div className="flex justify-between items-end">
                <Image src="/assets/ba-logo-white.png" alt="" width={140} height={28} className="h-7 w-auto" />
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-mute-2">buddyassist.io</span>
              </div>
            </div>

            <div className="aspect-square col-span-2 bg-green p-5 flex flex-col justify-between">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink/70">Favicon · App icon</div>
              <div className="flex-1 grid place-items-center">
                <Image src="/assets/ba-icon-white.png" alt="" width={140} height={140} className="w-[55%] h-auto" />
              </div>
              <div className="font-mono text-[11px] text-ink/70">16 · 32 · 64 · 128 · 512 px</div>
            </div>

            <div className="aspect-square col-span-2 border border-line p-5 flex flex-col justify-between">
              <Image src="/assets/ba-icon-green.png" alt="" width={28} height={28} className="w-7 h-7" />
              <div>
                <div className="font-grotesk font-medium text-[18px] -tracking-[0.01em]">Priya Nair</div>
                <div className="text-[12px] text-mute">Solutions Engineer</div>
                <div className="text-[10px] text-mute mt-2 font-mono tracking-[0.08em] uppercase">priya@buddyassist.io</div>
              </div>
            </div>

            <div className="aspect-square col-span-2 bg-ink text-white flex flex-col items-center justify-center gap-4.5">
              <Image src="/assets/ba-logo-white.png" alt="" width={300} height={70} className="w-[70%] h-auto" />
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-mute-2">Agents for your data ✦</span>
            </div>

            <div className="aspect-square col-span-2 bg-bg-soft p-4.5 flex flex-col gap-3">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-mute">Product · Chat</div>
              <div className="bg-paper rounded-2xl rounded-bl-sm px-4 py-3.5 max-w-[78%] text-[13px]" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                What were our top 3 accounts by revenue last quarter?
              </div>
              <div className="bg-ink text-paper rounded-2xl rounded-br-sm px-4 py-3.5 max-w-[78%] text-[13px] self-end">
                Sure — here they are with receipts from <b>sales.xlsx</b> ✦
              </div>
            </div>
          </div>
        </Chapter>

        {/* FOOTER */}
        <footer id="contact" className="bg-ink text-paper px-7 lg:px-[72px] pt-20 pb-10">
          <div className="grid md:grid-cols-2 gap-12 pb-12 border-b border-white/10">
            <div>
              <h3 className="font-grotesk text-[48px] font-normal leading-[1.05] -tracking-[0.025em] m-0 mb-3">
                Need an asset,<br />or a <em className="not-italic text-green">second opinion</em>?
              </h3>
              <p className="text-white/60 max-w-[38ch] m-0">
                Drop us a line — we&apos;ll get you the file, the rationale, or both. If it&apos;s urgent, lead with the deadline.
              </p>
              <a className="inline-flex items-center gap-2.5 px-5.5 py-3.5 bg-green text-ink no-underline font-grotesk font-medium text-[15px] rounded-full mt-4.5 hover:bg-white" href="mailto:hello@buddyassist.io">
                hello@buddyassist.io →
              </a>
            </div>
            <div className="flex flex-col gap-6 items-end justify-between">
              <Image src="/assets/ba-logo-white.png" alt="" width={260} height={56} className="w-[260px] self-end h-auto" />
              <div className="grid grid-cols-2 gap-8 w-full max-w-[440px]">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50 mb-2">Brand</div>
                  <div className="font-grotesk text-[14px] leading-[1.7]">
                    brand@buddyassist.io<br />
                    Asset drive →<br />
                    Request a review →
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50 mb-2">Product</div>
                  <div className="font-grotesk text-[14px] leading-[1.7]">
                    buddyassist.io<br />
                    Changelog →<br />
                    Careers →
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-7 flex justify-between text-[11px] text-white/45 tracking-[0.1em] uppercase flex-wrap gap-3.5">
            <span>© 2026 Buddy Assist, Inc.</span>
            <span>Volume 01 · v1.0 · Apr 2026</span>
            <span>Made by the brand team ✦</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Chapter({ id, num, title, lede, children }: { id: string; num: string; title: string; lede: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-7 lg:px-[72px] py-20 lg:py-24 border-b border-line relative">
      <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-8 items-start mb-12">
        <div className="font-grotesk text-[13px] font-medium text-green-deep tracking-[0.08em] pt-2">§ {num}</div>
        <div>
          <h2 className="font-grotesk text-[48px] md:text-[56px] font-medium leading-none m-0 mb-3.5 -tracking-[0.025em]">{title}</h2>
          <p className="text-[17px] text-mute max-w-[52ch] m-0">{lede}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line p-5">
      <h4 className="font-grotesk font-medium text-[15px] m-0 mb-1.5 -tracking-[0.01em]">{title}</h4>
      <p className="text-[13px] text-mute m-0 leading-[1.55]">{body}</p>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{children}</div>;
}

function KickerRow({ heading, tag, topGap = false }: { heading: string; tag: string; topGap?: boolean }) {
  return (
    <div className={`flex justify-between items-baseline pb-4.5 border-b border-[#141414] mb-7 ${topGap ? "mt-12" : ""}`}>
      <h3 className="font-grotesk font-medium text-[28px] -tracking-[0.02em] m-0">{heading}</h3>
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">{tag}</span>
    </div>
  );
}
