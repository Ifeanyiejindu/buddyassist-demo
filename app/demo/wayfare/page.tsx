import {
  fetchWayfareDestinations,
  fetchWayfarePackages,
  fetchWayfareStays,
} from "@/lib/demoApi";
import WayfareClient from "./WayfareClient";

/**
 * Wayfare demo storefront — server component.
 *
 * Pulls real destinations + packages from the live Wayfare API on every
 * request (the same backend our connector orchestrator hits when the
 * chat does tool calls). That way the page, sidebar, and the AI all
 * talk about the SAME real trips — never hardcoded mock data.
 *
 * The featured destination drives the top stays the sidebar shows and
 * the headline in the top bar. Defaults to the destination of the
 * cheapest package so the most accessible trip is forward.
 */
export default async function WayfareDemoPage() {
  const [destinations, packages] = await Promise.all([
    fetchWayfareDestinations(),
    fetchWayfarePackages(),
  ]);

  // Pick the cheapest available package's destination as the feature.
  // Falls back to the first destination if no packages came back.
  const cheapestAvailable = packages
    .filter((p) => p.seatsLeft > 0)
    .sort((a, b) => a.priceFromUsd - b.priceFromUsd)[0];
  const featuredCode =
    cheapestAvailable?.destinationCode ||
    packages[0]?.destinationCode ||
    destinations[0]?.code ||
    "LIS";

  // Fetch stays for the featured destination only — sidebar lists 3-4.
  const stays = await fetchWayfareStays(featuredCode);

  return (
    <WayfareClient
      destinations={destinations}
      packages={packages}
      stays={stays}
      featuredCode={featuredCode}
    />
  );
}
