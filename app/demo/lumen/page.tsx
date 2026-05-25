import {
  fetchLumenCourses,
  fetchLumenProgress,
  fetchLumenRecommendations,
} from "@/lib/demoApi";
import LumenClient from "./LumenClient";

/**
 * Lumen demo storefront — server component.
 *
 * Treats Avery Donovan (ST-01) as the "logged-in" student — she's the
 * richest seeded record (1 active enrollment in Calculus II, 2 completed
 * courses, plus recommendations). The sidebar's My Courses list, the
 * progress bars, the Recommended-next list, and the system prompt all
 * pull from the live Lumen API.
 */
const DEMO_STUDENT_ID = "ST-01";
const DEMO_STUDENT_NAME = "Avery Donovan";

export default async function LumenDemoPage() {
  const [progress, courses, recommendations] = await Promise.all([
    fetchLumenProgress(DEMO_STUDENT_ID),
    fetchLumenCourses(),
    fetchLumenRecommendations(DEMO_STUDENT_ID),
  ]);

  return (
    <LumenClient
      studentName={DEMO_STUDENT_NAME}
      progress={progress}
      courses={courses}
      recommendations={recommendations}
    />
  );
}
