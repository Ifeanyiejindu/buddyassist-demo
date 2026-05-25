import { fetchKeystoneListings } from "@/lib/demoApi";
import KeystoneClient from "./KeystoneClient";

/**
 * Keystone demo storefront — server component.
 *
 * Pulls live active listings from the Keystone API on every request,
 * passes them to the client. The cards on the right rail are now real
 * properties with real prices, real neighborhoods, real specs — and
 * each one links to a server-rendered detail page with viewing slots
 * and neighborhood context.
 */
export default async function KeystoneDemoPage() {
  const listings = await fetchKeystoneListings();
  return <KeystoneClient listings={listings} />;
}
