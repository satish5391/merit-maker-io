import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Calculator,
  ChartNoAxesCombined,
  Clock3,
  FileWarning,
} from "lucide-react";

export const Route = createFileRoute("/jkssb-faa-mock-test")({
  component: JkssbFaaMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB FAA Mock Test | Finance Accounts Assistant Free CBT | Rankdon",
      },
      {
        name: "description",
        content:
          "Attempt free JKSSB Finance Accounts Assistant (FAA) mock tests. Master Accountancy, Bookkeeping, and J&K UT GK with our latest 2026 CBT pattern test series.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const examPattern = [
  ["General Knowledge with special reference to J&K UT", "30 Marks"],
  ["Accountancy and Book Keeping", "30 Marks"],
  ["General English", "10 Marks"],
  ["Statistics", "10 Marks"],
  ["Mathematics", "10 Marks"],
  ["General Economics", "10 Marks"],
  ["General Science", "10 Marks"],
  ["Knowledge of Computers", "10 Marks"],
];

function JkssbFaaMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <ChartNoAxesCombined className="size-4" />
              Latest 2026 FAA CBT pattern
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB FAA Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Attempt free JKSSB Finance Accounts Assistant mock tests and prepare with a focused
              plan for Accountancy, Bookkeeping, J&amp;K UT GK, and every scoring section in the
              latest 2026 pattern.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/?tab=free"
                className={`${buttonClass} bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 focus:ring-cyan-200`}
              >
                Attempt Free Mock
                <ArrowRight className="size-4" />
              </a>
              <a
                href="/?tab=packages"
                className={`${buttonClass} border border-white/20 bg-white/10 text-white hover:bg-white/15 focus:ring-white/70`}
              >
                View FAA Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Know the paper
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold">Official 2026 FAA Exam Pattern</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Build your preparation around the complete 120-mark JKSSB Finance Accounts Assistant
            syllabus and use sectional practice to improve accuracy where it matters most.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Official 2026 JKSSB FAA syllabus and marks</caption>
              <thead className="bg-cyan-400 text-left text-slate-950">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">
                    Subject
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950">
                {examPattern.map(([subject, marks], index) => (
                  <tr key={subject} className={index % 2 ? "bg-white/[0.03]" : undefined}>
                    <th scope="row" className="px-5 py-4 font-medium text-slate-200">
                      {subject}
                    </th>
                    <td className="px-5 py-4 text-slate-400">{marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-semibold text-cyan-100">
            Total: 120 Questions | 120 Marks | Duration: 2 Hours | Negative Marking: 0.25
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Aspirants Fail to Clear the FAA Cut-off
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<Calculator className="size-7 text-rose-300" />}
              title="The Accountancy Trap"
              text="Partnership and BRS numericals become difficult when you have to solve them accurately under time pressure."
            />
            <PainPointCard
              icon={<BookOpenCheck className="size-7 text-rose-300" />}
              title="Ignoring the 10-Mark Sections"
              text="Leaving Economics, Math, and Statistics underprepared can cost the rank-deciding marks that separate candidates."
            />
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-300" />}
              title="Poor Time Management"
              text="Failing to navigate eight vast sections in just 120 minutes can turn good preparation into an incomplete paper."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            The Rankdon edge
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Master the FAA Syllabus with Rankdon
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<BookOpenCheck className="size-7 text-cyan-300" />}
              title="Targeted Sectional Mocks"
              text="Practise exactly where you are weak, whether it is Accountancy, Bookkeeping, General Science, or another section."
            />
            <ValueCard
              icon={<Calculator className="size-7 text-cyan-300" />}
              title="Detailed Numerical Solutions"
              text="Learn from step-by-step explanations for Math and Statistics instead of repeating the same calculation mistakes."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-300" />}
              title="Live State-Wide Rank"
              text="Benchmark your score against thousands of J&K candidates and see how your preparation is progressing."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">FAQs</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            <Faq
              question="What is the weightage for Accountancy in JKSSB FAA?"
              answer="30 Marks, along with 30 Marks for J&K GK."
            />
            <Faq question="Are there negative marks?" answer="Yes, 0.25 per wrong answer." />
            <Faq
              question="Can I access sectional tests for Statistics and Economics?"
              answer="Yes, our premium packages include dedicated sectional tests."
            />
          </div>
        </div>
      </section>

      <section className="bg-cyan-500 text-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 sm:px-8 lg:flex-row lg:items-center lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-950/70">
              Your final merit list starts with your next attempt
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              Secure Your Rank in the Final FAA Merit List
            </h2>
          </div>
          <a
            href="/?tab=packages"
            className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-900`}
          >
            Explore Premium Packages
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}

function PainPointCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-xl">
      {icon}
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}

function ValueCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-6 shadow-xl">
      {icon}
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-sm">
      <summary className="cursor-pointer list-none font-semibold marker:hidden">{question}</summary>
      <p className="mt-3 text-sm leading-6 text-slate-400">{answer}</p>
    </details>
  );
}
