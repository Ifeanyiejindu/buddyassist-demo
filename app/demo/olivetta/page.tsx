import {
  fetchOlivettaMenu,
  fetchOlivettaSpecials,
  fetchOlivettaAvailability,
} from "@/lib/demoApi";
import OlivettaClient from "./OlivettaClient";

/**
 * Olivetta demo storefront — server component.
 *
 * Pulls the live menu, tonight's chef specials, and tonight's
 * reservation availability from the same Olivetta backend that
 * Buddy's orchestrator hits during a chat. The dish cards, the
 * "Tonight" availability strip, and Renata's responses all
 * reference the SAME real menu items — never hardcoded copy.
 */

/** Format today's date as the API expects (YYYY-MM-DD, restaurant local time). */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function OlivettaDemoPage() {
  const [menu, specials, availability] = await Promise.all([
    fetchOlivettaMenu(),
    fetchOlivettaSpecials(),
    // Default party of 2 — the most common reservation size. The page's
    // "Tonight" strip is informational; the chat handles bespoke parties.
    fetchOlivettaAvailability(todayIso(), 2),
  ]);

  return <OlivettaClient menu={menu} specials={specials} availability={availability} />;
}
