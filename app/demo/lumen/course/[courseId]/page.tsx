import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchLumenCourse,
  fetchLumenCourses,
  fetchLumenLessons,
  fetchLumenProgress,
} from "@/lib/demoApi";

/**
 * Lumen course detail page.
 *
 * Reached from the sidebar's course list. Shows the course header
 * (subject, level, prerequisites), the ordered lesson list with
 * durations, and a "Recommended next" rail of related courses in the
 * same subject. Progress markers reflect the seeded student's real
 * completed lessons.
 */
const DEMO_STUDENT_ID = "ST-01";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function LumenCoursePage({ params }: PageProps) {
  const { courseId } = await params;

  const [course, lessons, progress, allCourses] = await Promise.all([
    fetchLumenCourse(courseId),
    fetchLumenLessons(courseId),
    fetchLumenProgress(DEMO_STUDENT_ID),
    fetchLumenCourses(),
  ]);

  if (!course) return notFound();

  // Match the student's progress on this course (if any) so we can
  // show a "completed" marker on the lessons they've already done.
  const myProgress = progress?.progress?.find((p) => p.courseId === courseId);
  const completedCount = myProgress?.lessonsCompleted || 0;
  const completed = progress?.completedCourses?.includes(courseId);

  // Same-subject related courses for the bottom strip.
  const related = allCourses
    .filter((c) => c.subject === course.subject && c.courseId !== course.courseId)
    .slice(0, 4);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F7F4FB",
        color: "#1A1530",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="px-6 sm:px-10 py-4 border-b border-[#E2DAEC] bg-white flex items-center gap-4">
        <Link
          href="/demo/lumen"
          className="text-[13px] text-[#6E667E] no-underline hover:text-[#1A1530] inline-flex items-center gap-1.5"
        >
          ← Lumen
        </Link>
        <span className="text-[12px] text-[#6E667E]">/</span>
        <span className="text-[13px] text-[#1A1530]">{course.subject}</span>
        <span className="text-[12px] text-[#6E667E]">/</span>
        <span className="text-[13px] text-[#1A1530]">{course.title}</span>
      </header>

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-10 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] tracking-[0.12em] uppercase text-[#6E667E] font-medium">
            <span>{course.subject}</span>
            <span>·</span>
            <span className="capitalize">{course.level}</span>
            {completed && (
              <>
                <span>·</span>
                <span className="text-[#1F8A5B]">Completed</span>
              </>
            )}
          </div>
          <h1
            className="font-semibold m-0 leading-none -tracking-[0.02em] mt-3"
            style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "clamp(32px,4.5vw,48px)" }}
          >
            {course.title}
          </h1>
          {course.description && (
            <p className="text-[16px] leading-[1.55] text-[#3A3245] max-w-[60ch] mt-4 m-0">
              {course.description}
            </p>
          )}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="mt-5 text-[13px] text-[#6E667E]">
              <b className="text-[#1A1530] mr-2">Prerequisites:</b>
              {course.prerequisites.join(", ")}
            </div>
          )}
        </div>
        <aside className="bg-white border border-[#E2DAEC] rounded-[14px] p-5 flex flex-col gap-3">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#6E667E]">
            Course overview
          </div>
          <div className="text-[28px] font-semibold" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            {course.lessonCount} <span className="text-[13px] font-normal text-[#6E667E]">lessons</span>
          </div>
          {myProgress ? (
            <div>
              <div className="flex justify-between text-[12px] text-[#6E667E] mb-1.5">
                <span>Your progress</span>
                <span>
                  {completedCount} / {course.lessonCount}
                </span>
              </div>
              <div className="h-2 rounded overflow-hidden" style={{ background: "#F7F4FB" }}>
                <div className="h-full" style={{ width: `${myProgress.progressPct}%`, background: "#5B3FB5" }} />
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-[#6E667E]">
              {course.enrolledCount ?? 0} of {course.seats ?? "—"} seats filled
            </div>
          )}
        </aside>
      </section>

      {/* Lessons */}
      {lessons.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-10">
          <h2 className="m-0 mb-4 font-semibold text-[20px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            Lessons
          </h2>
          <ol className="m-0 p-0 list-none flex flex-col gap-2">
            {lessons.map((l) => {
              const done = l.order <= completedCount;
              return (
                <li
                  key={l.lessonId}
                  className="px-4 py-3 bg-white border border-[#E2DAEC] rounded-[12px] flex items-center gap-4"
                >
                  <span
                    className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-medium"
                    style={{
                      background: done ? "#1F8A5B" : "#F7F4FB",
                      color: done ? "white" : "#6E667E",
                      border: done ? "none" : "1px solid #E2DAEC",
                    }}
                  >
                    {done ? "✓" : l.order}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-[14.5px]">{l.title}</div>
                    <div className="text-[11.5px] text-[#6E667E]">{l.durationMin} min</div>
                  </div>
                  {l.quiz && (
                    <span className="text-[10.5px] px-2 py-0.5 rounded text-[#5B3FB5] bg-[#5B3FB5]/10 font-medium">
                      QUIZ
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Related courses */}
      {related.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
          <h2 className="m-0 mb-4 font-semibold text-[18px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            More in {course.subject}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((c) => (
              <Link
                key={c.courseId}
                href={`/demo/lumen/course/${c.courseId}`}
                className="bg-white border border-[#E2DAEC] rounded-[12px] p-4 no-underline text-inherit hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(91,63,181,0.08)] transition-all flex flex-col gap-1"
              >
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#6E667E] capitalize">
                  {c.level}
                </div>
                <div className="font-medium text-[14.5px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                  {c.title}
                </div>
                <div className="text-[11.5px] text-[#6E667E] mt-auto">
                  {c.lessonCount} lessons
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
