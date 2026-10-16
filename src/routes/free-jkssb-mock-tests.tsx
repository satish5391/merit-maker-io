import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, Target, Trophy } from "lucide-react";

export const Route = createFileRoute("/free-jkssb-mock-tests")({
  component: FreeJkssbMockTestsPage,
  head: () => ({
    meta: [
      {
        title: "Free JKSSB Mock Tests: JKP Constable, FAA & JKPSI | Rankdon",
      },
      {
        name: "description",
        content:
          "Attempt free JKSSB mock tests based on the latest syllabus. Practice for JKP Constable, Finance Accounts Assistant, and JKPSI exams to boost your rank.",
      },
    ],
  }),
});

function FreeJkssbMockTestsPage() {
  return (
    <main className="overflow-hidden bg-slate-950 text-white">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_42%),radial-gradient(circle_at_20%_70%,_rgba(59,130,246,0.16),_transparent_36%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <Target className="size-4" />
              JKSSB exam preparation
            </div>
            <h1 className="mt-7 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Free JKSSB Mock Tests for a Smarter Rank
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare with focused mock tests for JKP Constable, Finance Accounts Assistant (FAA),
              and JKPSI exams. Practice in a realistic, timed format and turn every attempt into a
              clearer path to selection.
            </p>
            <a
              href="/?tab=free"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Start Practicing Now
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Practice that compounds
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <BookOpenCheck className="size-6 text-cyan-300" />
                <h2 className="mt-3 font-display text-lg font-semibold">Syllabus-focused papers</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Cover the topics that matter for your JKSSB target exam.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <Trophy className="size-6 text-amber-300" />
                <h2 className="mt-3 font-display text-lg font-semibold">Measure your progress</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Use instant scorecards to identify gaps and improve consistently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-800">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:py-20">
          <p className="text-lg leading-8 text-slate-600">
            JKSSB exams reward both accuracy and speed. The JKP Constable, FAA, and JKPSI exam
            patterns typically combine objective questions with a strict time limit, so knowing the
            syllabus is only the first step. Regular mock tests help you build the pace and
            decision-making needed to perform confidently on exam day.
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Rankdon&apos;s free JKSSB mock tests are designed around broad syllabus coverage, from
            general knowledge and current affairs to reasoning, quantitative aptitude, English, and
            role-specific topics. Practising across these areas helps you find weak sections before
            they cost you marks in the real examination.
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            With Rankdon, every attempt is a useful checkpoint: complete a timed paper, review your
            score, and use the feedback to plan your next revision session. Start with free practice
            today to sharpen accuracy, strengthen exam strategy, and move closer to a higher JKSSB
            rank.
          </p>
        </div>
      </section>
    </main>
  );
}
