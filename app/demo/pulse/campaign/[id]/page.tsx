import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPulseCampaign, fetchPulsePacing } from "@/lib/demoApi";

/**
 * Pulse campaign detail page.
 *
 * Reached from the top-campaigns table on the workspace dashboard. Shows
 * the campaign header (channel, status, budget), a pacing banner with
 * real variance vs expected, and the audience breakdown table — all live
 * from the Pulse API. No fictional KPIs.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

const CHANNEL_BG: Record<string, string> = {
  Meta: "linear-gradient(135deg, #5B5EF0, #3F2A8A)",
  Google: "linear-gradient(135deg, #10B981, #047857)",
  TikTok: "linear-gradient(135deg, #E55C5C, #B91C1C)",
  LinkedIn: "linear-gradient(135deg, #F4A261, #C2410C)",
};

export default async function PulseCampaignPage({ params }: PageProps) {
  const { id } = await params;

  const [campaign, pacing] = await Promise.all([
    fetchPulseCampaign(id),
    fetchPulsePacing(id),
  ]);

  if (!campaign) return notFound();

  const pacePct = campaign.budgetUsd > 0 ? (campaign.spentUsd / campaign.budgetUsd) * 100 : 0;
  const overpacing = pacing?.status === "overpacing";
  const underpacing = pacing?.status === "underpacing";

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F4F5F7",
        color: "#0B0F14",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="px-6 sm:px-10 py-4 border-b border-[#E6E8EC] bg-white flex items-center gap-4">
        <Link
          href="/demo/pulse"
          className="text-[13px] text-[#6A7280] no-underline hover:text-[#0B0F14] inline-flex items-center gap-1.5"
        >
          ← Pulse
        </Link>
        <span className="text-[12px] text-[#6A7280]">/</span>
        <span className="text-[13px] text-[#0B0F14]">{campaign.channel}</span>
        <span className="text-[12px] text-[#6A7280]">/</span>
        <span className="text-[13px] text-[#0B0F14]">{campaign.campaignId}</span>
      </header>

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-10 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.1em] text-[#6A7280] mb-2">
            <span
              className="inline-block w-6 h-6 rounded-md"
              style={{ background: CHANNEL_BG[campaign.channel] || "#7A8AC4" }}
              aria-hidden
            />
            <span>{campaign.channel}</span>
            <span>·</span>
            <span className="capitalize">{campaign.status}</span>
            <span>·</span>
            <span>day {campaign.daysElapsed} of {campaign.cycleDays}</span>
          </div>
          <h1
            className="font-semibold m-0 leading-tight -tracking-[0.02em]"
            style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "clamp(28px,3.6vw,40px)" }}
          >
            {campaign.name}
          </h1>
          <div className="text-[13px] text-[#6A7280] mt-1.5">
            Started {new Date(campaign.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Budget card */}
        <aside className="bg-white border border-[#E6E8EC] rounded-[12px] p-5 flex flex-col gap-3">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#6A7280]">Budget</div>
          <div className="flex justify-between items-baseline">
            <div className="font-semibold text-[28px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              {fmtUsd(campaign.spentUsd)}
            </div>
            <div className="text-[12px] text-[#6A7280]">of {fmtUsd(campaign.budgetUsd)}</div>
          </div>
          <div className="h-2 rounded overflow-hidden" style={{ background: "#F4F5F7" }}>
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, pacePct)}%`,
                background: overpacing ? "#E55C5C" : pacePct > 90 ? "#F59E0B" : "#10B981",
              }}
            />
          </div>
          <div className="text-[11.5px] text-[#6A7280]">
            {Math.round(pacePct)}% paced ({Math.round((campaign.daysElapsed / campaign.cycleDays) * 100)}% of cycle elapsed)
          </div>
        </aside>
      </section>

      {/* Pacing banner */}
      {pacing && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-8">
          <div
            className="rounded-[12px] p-4 flex items-center gap-4"
            style={{
              background: overpacing ? "#FEE2E2" : underpacing ? "#FEF3C7" : "#ECFDF5",
              color: overpacing ? "#7F1D1D" : underpacing ? "#78350F" : "#065F46",
              border: `1px solid ${overpacing ? "#FCA5A5" : underpacing ? "#FCD34D" : "#A7F3D0"}`,
            }}
          >
            <div className="text-[20px]">{overpacing ? "▲" : underpacing ? "▼" : "✓"}</div>
            <div className="flex-1">
              <div className="font-semibold text-[14px] capitalize">{pacing.status.replace("-", " ")}</div>
              <div className="text-[12.5px] mt-0.5">
                Expected {fmtUsd(pacing.expectedSpend)} by day {pacing.daysElapsed} · variance{" "}
                <b>{pacing.variance >= 0 ? "+" : ""}{fmtUsd(pacing.variance)}</b> · projected end-cycle spend{" "}
                <b>{fmtUsd(pacing.projectedEndSpend)}</b>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Audiences */}
      {campaign.audiences && campaign.audiences.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
          <h2 className="m-0 mb-4 font-semibold text-[18px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            Audiences
          </h2>
          <div className="bg-white border border-[#E6E8EC] rounded-[12px] overflow-hidden">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.1em] text-[#6A7280] bg-[#F4F5F7]">
                  <th className="py-2.5 px-4 font-medium">Audience</th>
                  <th className="py-2.5 px-4 font-medium text-right">Impressions</th>
                  <th className="py-2.5 px-4 font-medium text-right">Conversions</th>
                  <th className="py-2.5 px-4 font-medium text-right">CPA</th>
                </tr>
              </thead>
              <tbody>
                {campaign.audiences.map((a, i) => (
                  <tr key={i} className={i < (campaign.audiences?.length || 0) - 1 ? "border-b border-[#E6E8EC]" : ""}>
                    <td className="py-2.5 px-4 font-medium">{a.name}</td>
                    <td className="py-2.5 px-4 text-right" style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {fmtNum(a.impressions)}
                    </td>
                    <td className="py-2.5 px-4 text-right" style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {fmtNum(a.conversions)}
                    </td>
                    <td
                      className="py-2.5 px-4 text-right font-medium"
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        color: a.cpa < 15 ? "#10B981" : a.cpa < 25 ? "#0B0F14" : "#E55C5C",
                      }}
                    >
                      ${a.cpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
