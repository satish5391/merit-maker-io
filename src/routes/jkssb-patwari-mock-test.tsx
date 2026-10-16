import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, Clock3, Globe2, Languages, MonitorCheck } from "lucide-react";

export const Route = createFileRoute("/jkssb-patwari-mock-test")({
  component: JkssbPatwariMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB Patwari Mock Test | Urdu Test & CBT Practice | Rankdon",
      },
      {
        name: "description",
        content:
          "Prepare for the JKSSB Patwari exam with our official 120-mark CBT mock tests. Practice J&K GK, Reasoning, and English, and get tips to clear the 50-mark Urdu qualifying test.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const examPattern = [
  ["General Knowledge & Current Affairs", "36 Marks"],
  ["GK with special reference to J&K UT", "24 Marks"],
  ["General English", "24 Marks"],
  ["Knowledge of Computers", "18 Marks"],
  ["Mental Ability & Reasoning", "18 Marks"],
];

function JkssbPatwariMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <MonitorCheck className="size-4" />
              Official 120-mark Patwari CBT preparation
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB Patwari Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare for the JKSSB Patwari selection process with realistic CBT mock tests, focused
              J&amp;K General Knowledge practice, and a clear strategy for the qualifying Urdu test.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/?tab=free"
                className={`${buttonClass} bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 focus:ring-cyan-200`}
              >
                Attempt Free CBT Mock
                <ArrowRight className="size-4" />
              </a>
              <a
                href="/?tab=packages"
                className={`${buttonClass} border border-white/20 bg-white/10 text-white hover:bg-white/15 focus:ring-white/70`}
              >
                View Patwari Packages
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
          <h2 className="mt-3 font-display text-3xl font-bold">JKSSB Patwari Exam Pattern</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Prepare for both stages of the Patwari selection process: first clear the qualifying
            Urdu assessment, then maximise your score in the main written CBT.
          </p>
          <p className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm font-bold text-amber-100">
            Phase 1: 50-Mark Descriptive Urdu Test (Qualifying in nature)
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Phase 2 JKSSB Patwari written CBT syllabus and marks
              </caption>
              <thead className="bg-cyan-400 text-slate-950">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">
                    Phase 2 Written CBT Subject
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
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-bold text-cyan-100">
            Phase 2 Total: 120 Questions | 120 Marks | Duration: 2 Hours | Negative Marking: 0.25
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Aspirants Fail the Patwari Selection Process
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<Languages className="size-7 text-rose-300" />}
              title="The Urdu Qualification Barrier"
              text="Scoring high in the CBT means nothing if you fail the 50-mark reading and writing Urdu test."
            />
            <PainPointCard
              icon={<Globe2 className="size-7 text-rose-300" />}
              title="The 60-Mark GK Heavyweight"
              text="Underestimating the combined weightage of India GK and J&K GK can quickly damage your final merit position."
            />
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-300" />}
              title="Reasoning Time Sinks"
              text="Wasting too much time on complex mental ability questions leaves less time for accurate scoring sections."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            The Rankdon edge
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold">
            Clear the Patwari Merit List with Rankdon
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<MonitorCheck className="size-7 text-cyan-300" />}
              title="Complete 120-Mark CBT Simulation"
              text="Practise under the exact 2-hour digital timer and build the stamina needed for the full written exam."
            />
            <ValueCard
              icon={<Globe2 className="size-7 text-cyan-300" />}
              title="Heavy J&K GK Focus"
              text="Master local history, geography, and culture to secure those 24 marks in the J&K-specific section."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-300" />}
              title="Live State-Wide Ranking"
              text="See your exact rank among thousands of Revenue Department aspirants across J&K."
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
              question="Is the Urdu test mandatory for JKSSB Patwari?"
              answer="Yes, it is a 50-mark qualifying descriptive test with Reading and Writing sections."
            />
            <Faq
              question="What is the pattern for the main written exam?"
              answer="It is a 120-mark objective CBT covering GK, English, Computers, and Reasoning."
            />
            <Faq
              question="Is there negative marking?"
              answer="Yes, 0.25 marks are deducted per wrong answer in the CBT."
            />
          </div>
        </div>
      </section>

      <section className="bg-cyan-500 text-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 sm:px-8 lg:flex-row lg:items-center lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-950/70">
              Your next attempt starts here
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              Ready to Join the Revenue Department?
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
