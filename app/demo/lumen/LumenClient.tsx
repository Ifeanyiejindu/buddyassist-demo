"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat, mdInline } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";
import type {
  LumCourse,
  LumProgress,
  LumRecommendation,
} from "@/lib/demoApi";

interface LumenClientProps {
  /** The "logged-in" student's display name. */
  studentName: string;
  /** Active enrollments + progress for that student. */
  progress: LumProgress | null;
  /** Catalog so the sidebar can resolve enrolled courseIds → titles. */
  courses: LumCourse[];
  /** What Buddy recommends next for this student. */
  recommendations: LumRecommendation[];
}

const STARTERS = [
  { lbl: "Calc · explain", q: "Walk me through ∫ x·e^x dx slowly", full: "I keep getting stuck on integration by parts. Can you walk me through one slowly: ∫ x·e^x dx" },
  { lbl: "Practice", q: "Quiz me — 5 IBP problems", full: "Quiz me on 5 random integration by parts problems, increasing difficulty. Don't show solutions until I attempt." },
  { lbl: "Plan", q: "10-day AP Calc BC study plan", full: "Write me a study plan for the next 10 days before my AP Calc BC exam, 1hr/day, focus on weak areas: series and parametric." },
  { lbl: "Reframe", q: "Explain IBP like a peer", full: "Pretend you're a peer in my class. Explain why the formula ∫u dv = uv − ∫v du works in plain words." },
  { lbl: "Cross-subject", q: "Grade my history essay", full: "Grade my essay on Reconstruction — I'll paste it. Use AP rubric." },
  { lbl: "Spanish", q: "Subjuntivo after 'aunque'", full: "In Spanish, what's the rule for using subjuntivo after 'aunque'? Give me 3 examples." },
];

export default function LumenClient({
  studentName,
  progress,
  courses,
  recommendations,
}: LumenClientProps) {
  const firstName = studentName.split(" ")[0] || "there";
  // Resolve courseId → title using the catalog so the sidebar shows
  // proper names instead of opaque LUM-CALC-2 strings.
  const courseById = new Map(courses.map((c) => [c.courseId, c]));

  // Active enrollments (in-progress courses).
  const enrolled = (progress?.progress || []).map((p) => ({
    ...p,
    title: courseById.get(p.courseId)?.title || p.courseId,
    subject: courseById.get(p.courseId)?.subject || "",
  }));

  // Sidebar "in progress" list — pick the first as the currently-active.
  const sidebarCourses = enrolled.length > 0 ? enrolled : courses.slice(0, 4).map((c) => ({
    courseId: c.courseId,
    title: c.title,
    subject: c.subject,
    status: "available",
    lessonsCompleted: 0,
    totalLessons: c.lessonCount,
    progressPct: 0,
  }));

  // Build the system prompt server-data-aware so the tutor references
  // the student's real enrolled courses (not Mira's AP Calc BC).
  const enrolledLine = enrolled.length
    ? enrolled.map((c) => `${c.title} (${c.progressPct}% done)`).join(", ")
    : courses
        .slice(0, 4)
        .map((c) => c.title)
        .join(", ");
  const completedLine = (progress?.completedCourses || [])
    .map((id) => courseById.get(id)?.title)
    .filter(Boolean)
    .join(", ");
  const SYSTEM_PROMPT = `You are Lumen, an AI tutor for ${studentName}.
${enrolled.length ? `Currently enrolled: ${enrolledLine}.` : `Browsing the catalog: ${enrolledLine}.`}
${completedLine ? `Already completed: ${completedLine}.` : ""}
You are in TUTOR MODE: Socratic. You don't dump answers — you ask one short question to find where the student's stuck, then guide step-by-step. Praise effort, not intelligence. Encourage trying before showing.
For math, write expressions in plain text (e.g. "∫ x·e^x dx", "u = x, dv = e^x dx") rather than LaTeX. For other subjects, ground claims in real source material.
If asked for "just the answer", you may give it — but follow up with one quick check question.
Tone: warm, curious, never condescending. Use the student's name occasionally. Keep replies tight (3-5 short paragraphs).
Format: NO bullet markdown. Numbered steps are okay if walking through math. End with a question that moves the lesson forward.`;

  const [turns, setTurns] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const streamRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("lumen") }));

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [turns, typing]);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(200, ta.scrollHeight) + "px";
  }

  async function send(text: string) {
    const v = text.trim();
    if (!v || chat.current.busy) return;
    setTurns((t) => [...t, { role: "user", text: v }]);
    setInput("");
    requestAnimationFrame(autosize);
    setTyping(true);
    let botIdx = -1;
    await chat.current.send(v, {
      onToken: (full) => {
        setTyping(false);
        setTurns((t) => {
          if (botIdx === -1) {
            const next = [...t, { role: "bot" as const, text: full }];
            botIdx = next.length - 1;
            return next;
          }
          const next = [...t];
          next[botIdx] = { ...next[botIdx], text: full };
          return next;
        });
      },
    });
  }

  const showEmpty = turns.length === 0 && !typing;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-screen overflow-hidden"
      style={{
        ["--ink" as string]: "#1A1530",
        ["--paper" as string]: "#fff",
        ["--bg" as string]: "#F7F4FB",
        ["--line" as string]: "#E2DAEC",
        ["--mute" as string]: "#6E667E",
        ["--plum" as string]: "#5B3FB5",
        ["--plum-d" as string]: "#3F2A8A",
        ["--peach" as string]: "#F4A261",
        ["--good" as string]: "#1F8A5B",
        background: "#F7F4FB",
        color: "#1A1530",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex bg-white border-r border-[#E2DAEC] py-4.5 px-3.5 flex-col gap-2 overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 py-1.5 font-semibold text-[22px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          <div
            className="w-[30px] h-[30px] rounded-full grid place-items-center text-white text-sm"
            style={{ background: "#5B3FB5", fontFamily: "var(--font-geist), sans-serif" }}
          >
            L
          </div>
          Lumen
        </div>
        <button
          type="button"
          className="my-2 mx-1 px-3.5 py-2.5 text-white rounded-lg text-[13px] flex items-center gap-2 cursor-pointer font-medium border-0"
          style={{ background: "#1A1530" }}
        >
          ＋ New chat
        </button>

        <div className="text-[10px] tracking-[0.14em] uppercase text-[#6E667E] px-2.5 pt-2 pb-1 font-semibold">
          {enrolled.length ? "My courses" : "Course catalog"}
        </div>
        <nav className="flex flex-col">
          {sidebarCourses.map((c, i) => (
            <Link
              key={c.courseId}
              href={`/demo/lumen/course/${c.courseId}`}
              className={`px-3 py-2 rounded-md text-[13px] cursor-pointer flex flex-col gap-1 no-underline ${
                i === 0 ? "font-medium" : "hover:bg-[#F7F4FB]"
              }`}
              style={{
                background: i === 0 ? "rgba(91,63,181,0.1)" : undefined,
                color: i === 0 ? "#3F2A8A" : "#1A1530",
              }}
            >
              <span>○ {c.title}</span>
              {c.totalLessons > 0 && (
                <div className="flex items-center gap-1.5 text-[10.5px] text-[#6E667E]">
                  <div className="flex-1 h-1 rounded overflow-hidden" style={{ background: "#E2DAEC" }}>
                    <div
                      className="h-full"
                      style={{ width: `${c.progressPct}%`, background: "#5B3FB5" }}
                    />
                  </div>
                  <span>
                    {c.lessonsCompleted}/{c.totalLessons}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </nav>

        {recommendations.length > 0 && (
          <>
            <div className="text-[10px] tracking-[0.14em] uppercase text-[#6E667E] px-2.5 pt-2 pb-1 font-semibold">
              Recommended next
            </div>
            <nav className="flex flex-col">
              {recommendations.slice(0, 4).map((r) => (
                <Link
                  key={r.courseId}
                  href={`/demo/lumen/course/${r.courseId}`}
                  className="px-3 py-2 rounded-md text-[13px] text-[#1A1530] hover:bg-[#F7F4FB] cursor-pointer flex flex-col gap-0.5 no-underline"
                >
                  <span>{r.title}</span>
                  <span className="text-[10.5px] text-[#6E667E]">{r.reason}</span>
                </Link>
              ))}
            </nav>
          </>
        )}

        <div className="mt-auto pt-2.5 px-2.5 border-t border-[#E2DAEC] flex items-center gap-2.5 text-[12.5px]">
          <div className="w-[30px] h-[30px] rounded-full" style={{ background: "linear-gradient(135deg, #F4A261, #E76F51)" }} />
          <div>
            <div className="font-semibold">{studentName}</div>
            <div className="text-[#6E667E] text-[10.5px]">
              {progress?.completedCourses?.length
                ? `${progress.completedCourses.length} completed`
                : "Lumen student"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col overflow-hidden bg-white">
        <div className="px-7 py-3.5 border-b border-[#E2DAEC] flex items-center gap-3.5 flex-wrap">
          <h2 className="m-0 font-semibold text-[15px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            {sidebarCourses[0]?.title || "Lumen"} · Tutor session
          </h2>
          <div className="text-xs text-[#6E667E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1F8A5B" }} />
            Tutor mode · Socratic, no answer-dumping
          </div>
          <div className="ml-auto flex gap-2 items-center">
            {sidebarCourses[0]?.subject && (
              <span className="px-2.5 py-1 rounded-full text-xs text-[#6E667E]" style={{ background: "#F7F4FB" }}>
                Subject: <b className="text-[#1A1530]">{sidebarCourses[0].subject}</b>
              </span>
            )}
            {sidebarCourses[0] && sidebarCourses[0].totalLessons > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs text-[#6E667E]" style={{ background: "#F7F4FB" }}>
                Lesson{" "}
                <b className="text-[#1A1530]">
                  {Math.max(1, sidebarCourses[0].lessonsCompleted + 1)} of {sidebarCourses[0].totalLessons}
                </b>
              </span>
            )}
          </div>
        </div>

        <div ref={streamRef} className="flex-1 overflow-y-auto py-8 flex flex-col">
          {showEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center px-7 max-w-[780px] mx-auto w-full py-6">
              <div
                className="w-22 h-22 rounded-full grid place-items-center text-white"
                style={{
                  background: "radial-gradient(circle, #5B3FB5, #3F2A8A)",
                  boxShadow: "0 20px 50px rgba(91,63,181,0.4)",
                  width: 88,
                  height: 88,
                }}
              >
                <span className="text-white font-semibold text-[36px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>L</span>
              </div>
              <h1
                className="font-semibold text-center -tracking-[0.02em] mt-6 mb-2"
                style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 38 }}
              >
                How can I help you study, Mira?
              </h1>
              <p className="text-[#6E667E] text-[15px] text-center max-w-[460px] m-0">
                I&apos;m Lumen — your tutor. I&apos;ll teach you, not just hand you answers. Pick a starter or ask anything.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-8 w-full">
                {STARTERS.map((s) => (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => send(s.full)}
                    className="text-left px-4.5 py-4 border border-[#E2DAEC] rounded-xl bg-white cursor-pointer flex flex-col gap-1 hover:border-[#5B3FB5] hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-[10px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#5B3FB5" }}>
                      {s.lbl}
                    </span>
                    <span className="text-sm font-medium -tracking-[0.005em] text-[#1A1530]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                      {s.q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[780px] mx-auto w-full px-7 flex flex-col gap-8">
              {turns.map((t, i) => (
                <div key={i} className="grid grid-cols-[36px_1fr] gap-4">
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center text-white font-semibold text-sm"
                    style={{
                      background:
                        t.role === "user" ? "linear-gradient(135deg, #F4A261, #E76F51)" : "#5B3FB5",
                    }}
                  >
                    {t.role === "user" ? "M" : "L"}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] mb-1.5" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                      {t.role === "user" ? "Mira" : "Lumen"}
                    </div>
                    <div className="text-[15px] leading-[1.65] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: mdInline(t.text) }} />
                    {t.role === "bot" && (
                      <div className="flex gap-1.5 mt-2.5">
                        {["👍 Helpful", "👎 Not quite", "↻ Try again", "📋 Copy"].map((b) => (
                          <button
                            key={b}
                            type="button"
                            className="px-2 py-1 rounded-md bg-transparent border border-[#E2DAEC] text-[11px] text-[#6E667E] cursor-pointer hover:bg-[#F7F4FB]"
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="grid grid-cols-[36px_1fr] gap-4">
                  <div className="w-9 h-9 rounded-[10px] grid place-items-center text-white font-semibold text-sm" style={{ background: "#5B3FB5" }}>
                    L
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] mb-1.5" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
                      Lumen
                    </div>
                    <div className="inline-flex gap-1 py-1.5">
                      <span className="typing-dot" style={{ background: "#6E667E" }} />
                      <span className="typing-dot" style={{ background: "#6E667E", animationDelay: ".15s" }} />
                      <span className="typing-dot" style={{ background: "#6E667E", animationDelay: ".3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#E2DAEC] px-7 pt-4.5 pb-5.5 bg-white">
          <div className="max-w-[780px] mx-auto bg-white border border-[#E2DAEC] rounded-[14px] p-3.5 px-4.5 flex flex-col gap-2 focus-within:border-[#5B3FB5]" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autosize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask Lumen anything…"
              className="border-0 outline-none text-[15px] resize-none min-h-[44px] max-h-[200px] w-full bg-transparent"
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span
                  className="px-2.5 py-1 rounded-full text-[11.5px] cursor-pointer inline-flex items-center gap-1.5"
                  style={{ background: "rgba(91,63,181,0.1)", color: "#3F2A8A", border: "1px solid rgba(91,63,181,0.2)" }}
                >
                  ⊞ Tutor mode
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[11.5px] cursor-pointer inline-flex items-center gap-1.5 text-[#6E667E]"
                  style={{ background: "#F7F4FB", border: "1px solid transparent" }}
                >
                  ⌘ Show steps
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[11.5px] cursor-pointer inline-flex items-center gap-1.5 text-[#6E667E]"
                  style={{ background: "#F7F4FB", border: "1px solid transparent" }}
                >
                  📎 Upload
                </span>
              </div>
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="ml-auto text-white border-0 w-9 h-9 rounded-[10px] cursor-pointer text-sm disabled:opacity-40"
                style={{ background: "#5B3FB5" }}
              >
                →
              </button>
            </div>
          </div>
          <div className="max-w-[780px] mx-auto mt-2 text-center text-[11.5px] text-[#6E667E]">
            <b style={{ color: "#5B3FB5" }}>Powered by Buddy Assist</b>
          </div>
        </div>
      </main>

      <IndustrySwitcher currentSlug="lumen" />
    </div>
  );
}
