import {
  fetchHelixTickets,
  fetchHelixSla,
  fetchHelixTicket,
} from "@/lib/demoApi";
import HelixClient from "./HelixClient";

/**
 * Helix demo storefront — server component.
 *
 * The Helix backend doesn't expose a "list all tickets" endpoint (real
 * helpdesks page these), so for the demo we fan-out fetch the seeded
 * numbers. The most-urgent active ticket becomes the focused one in the
 * main panel with its SLA card.
 */
const SEEDED_TICKETS = ["HX-2041", "HX-2032", "HX-2018", "HX-2009", "HX-2050"];
// Most demo-impactful active ticket: API 429 errors from Dana Kerr.
const FEATURED_TICKET = "HX-2041";

export default async function HelixDemoPage() {
  const [tickets, active, activeSla] = await Promise.all([
    fetchHelixTickets(SEEDED_TICKETS),
    fetchHelixTicket(FEATURED_TICKET),
    fetchHelixSla(FEATURED_TICKET),
  ]);

  return <HelixClient tickets={tickets} active={active} activeSla={activeSla} />;
}
