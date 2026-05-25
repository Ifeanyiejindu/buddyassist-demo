import {
  fetchPulseAlerts,
  fetchPulseCampaigns,
  fetchPulseRoas,
} from "@/lib/demoApi";
import PulseClient from "./PulseClient";

/**
 * Pulse demo storefront — server component.
 *
 * Treats Bloom Skincare (CL-01) as the "active workspace" — it's the
 * richest seeded client (3 campaigns across Meta/Google/TikTok). Pulls
 * the client's campaigns, ROAS rollup, and WoW alerts in parallel; the
 * KPIs, top-campaign table, and anomalies section all derive from
 * those — no Northwood Co. fiction.
 */
const DEMO_CLIENT_ID = "CL-01";
const DEMO_CLIENT_NAME = "Bloom Skincare";

export default async function PulseDemoPage() {
  const [campaigns, roas, alerts] = await Promise.all([
    fetchPulseCampaigns({ clientId: DEMO_CLIENT_ID }),
    fetchPulseRoas(DEMO_CLIENT_ID),
    fetchPulseAlerts(DEMO_CLIENT_ID),
  ]);

  return (
    <PulseClient
      clientName={DEMO_CLIENT_NAME}
      campaigns={campaigns}
      roas={roas}
      alerts={alerts}
    />
  );
}
