import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, Clock3, FileWarning, MonitorCheck, Users } from "lucide-react";

export const Route = createFileRoute("/jkp-constable-mock-test")({
  component: JkpConstableMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKP Constable Mock Test | Free Online Test Series | Rankdon",
      },
      {
        name: "description",
        content:
          "Practice the best JKP Constable mock tests based on the latest 2026 JKSSB syllabus. Attempt free online CBT tests, check your state-wide rank, and improve your score.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

function JkpConstableMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <MonitorCheck className="size-4" />
              Latest 2026 JKSSB syllabus
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKP Constable Mock Tests
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Practice the latest JKP Constable mock tests in a realistic online CBT environment.
              Attempt free tests, benchmark your performance across J&amp;K, and build the speed and
              accuracy needed to improve your score.
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
                Access Premium Mock Series
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
              Know the paper
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold">
              2026 JKP Constable Exam Pattern
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Plan your preparation around the official 2026 JKSSB syllabus and practise each
              subject with focused, timed questions.
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Official 2026 JKP Constable syllabus and marks</caption>
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Subject
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[
                  ["General English", "25 Marks"],
                  ["GK & Current Affairs India", "25 Marks"],
                  ["Numerical & Reasoning Ability", "25 Marks"],
                  ["Basic Concepts of Computers", "15 Marks"],
                  ["GK with Special Reference to J&K", "10 Marks"],
                ].map(([subject, marks], index) => (
                  <tr key={subject} className={index % 2 ? "bg-slate-50" : undefined}>
                    <th scope="row" className="px-5 py-4 font-medium text-slate-800">
                      {subject}
                    </th>
                    <td className="px-5 py-4 text-slate-600">{marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl bg-cyan-50 px-5 py-4 text-sm font-semibold text-cyan-950">
            Total: 100 Questions | 100 Marks | Duration: 2 Hours | Negative Marking: 0.25
          </p>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Many Aspirants Struggle to Clear JKP Constable
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<FileWarning className="size-7 text-rose-600" />}
              title="The Negative Marking Drain"
              text="Uncalculated guesses can quietly reduce your score when every wrong answer carries a -0.25 penalty."
            />
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-600" />}
              title="Lack of CBT Simulation"
              text="Practising only from static PDFs does not build the focus and pacing needed for a real timed computer-based test."
            />
            <PainPointCard
              icon={<Users className="size-7 text-rose-600" />}
              title="Zero Peer Benchmarking"
              text="Studying in isolation makes it difficult to know whether your preparation is competitive across the J&K candidate pool."
            />
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            The Rankdon edge
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Rankdon is Your One-Stop Solution
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<MonitorCheck className="size-7 text-cyan-700" />}
              title="Real Exam Environment"
              text="Practise in a timed CBT interface designed to match the focus and flow of the JKSSB exam."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-700" />}
              title="Instant State-Wide Percentile"
              text="See your rank across J&K and understand how your performance compares with other aspirants."
            />
            <ValueCard
              icon={<FileWarning className="size-7 text-cyan-700" />}
              title="Detailed Accuracy Analytics"
              text="Find gaps in math, GK, or computers with clear post-test insights that guide your next revision."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-800">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">FAQs</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            <Faq
              question="Is there negative marking?"
              answer="Yes, 0.25 marks are deducted for each incorrect answer."
            />
            <Faq
              question="Is this the latest 2026 syllabus?"
              answer="Yes, the official 100-mark pattern."
            />
            <Faq question="Can I practice on mobile?" answer="Yes." />
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
              Ready to Secure Your Selection?
            </h2>
          </div>
          <a
            href="/?tab=packages"
            className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-900`}
          >
            Explore All Test Packages
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}

function PainPointCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {icon}
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function ValueCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-6 shadow-sm">
      {icon}
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none font-semibold marker:hidden">{question}</summary>
      <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
    </details>
  );
}
