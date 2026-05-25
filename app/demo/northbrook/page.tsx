import {
  fetchNorthbrookProviders,
  fetchNorthbrookPatient,
} from "@/lib/demoApi";
import NorthbrookClient from "./NorthbrookClient";

/**
 * Northbrook demo storefront — server component.
 *
 * Treats Priya Anand (PT-1003) as the featured patient — she has
 * interesting borderline labs (A1C 6.1%, BP 138/86) which makes for
 * a meaningful clinical conversation. Pulls the live provider roster
 * + her upcoming appointments so the care team grid and the
 * appointments rail reflect real Northbrook records.
 *
 * Voice — to be wired separately via Buddy's own WebSocket gateway
 * (LiveKit stays internal). The page already imports VoiceChat so
 * that integration plugs in without restructuring this surface.
 */
const FEATURED_PATIENT_ID = "PT-1003";

export default async function NorthbrookDemoPage() {
  const [providers, patientData] = await Promise.all([
    fetchNorthbrookProviders(),
    fetchNorthbrookPatient(FEATURED_PATIENT_ID),
  ]);

  return (
    <NorthbrookClient
      providers={providers}
      featuredPatientName={patientData.patient?.name || ""}
      upcomingAppointments={patientData.upcomingAppointments}
    />
  );
}
