import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Calculator,
  Clock3,
  FileCheck2,
  MonitorCheck,
} from "lucide-react";

export const Route = createFileRoute("/jkssb-jkpsi-mock-test")({
  component: JkssbJkpsiMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB JKPSI Mock Test | J&K Police Sub-Inspector Free CBT | Rankdon",
      },
      {
        name: "description",
        content:
          "Attempt the best JKPSI mock tests based on the official 200-mark syllabus. Practice Reasoning, Math, English, and J&K GK with our state-wide CBT test series.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const examPattern = [
  ["General Intelligence & Reasoning", "40 Marks"],
  ["General Awareness", "40 Marks"],
  ["Quantitative Aptitude", "30 Marks"],
  ["English Comprehension", "30 Marks"],
  ["Mathematical Abilities", "30 Marks"],
  ["Computer Proficiency", "30 Marks"],
];

function JkssbJkpsiMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <MonitorCheck className="size-4" />
              Official 200-mark JKSSB JKPSI syllabus
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB JKPSI Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare for the J&amp;K Police Sub-Inspector exam with realistic CBT mock tests.
              Practise Reasoning, Math, English, Computer Proficiency, and J&amp;K General Awareness
              while building the accuracy needed for a top merit-list rank.
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
                View JKPSI Packages
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
          <h2 className="mt-3 font-display text-3xl font-bold">Official JKPSI Exam Pattern</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Organise your preparation around the complete 200-mark JKSSB syllabus and use timed
            sectional practice to improve speed across every subject.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Official JKSSB JKPSI syllabus and marks</caption>
              <thead className="bg-cyan-400 text-slate-950">
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
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-bold text-cyan-100">
            Total: 100 Questions | 200 Marks | Duration: 2 Hours | Negative Marking: 0.50 Marks
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Aspirants Miss the Sub-Inspector Cut-off
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<FileCheck2 className="size-7 text-rose-300" />}
              title="The 0.50 Negative Marking Penalty"
              text="Wild guessing destroys scores because every wrong answer costs a massive 0.50 marks."
            />
            <PainPointCard
              icon={<Calculator className="size-7 text-rose-300" />}
              title="The Math & Reasoning Bottleneck"
              text="Struggling to solve 50 logic and quant questions under strict time limits can leave easy marks untouched."
            />
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-300" />}
              title="Lack of Real CBT Practice"
              text="Without digital test practice, it is harder to adapt to the CBT interface on the final day."
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
            Clear the Physical &amp; Written JKPSI Merit List with Rankdon
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<Brain className="size-7 text-cyan-300" />}
              title="Detailed Quant & Reasoning Solutions"
              text="Get step-by-step breakdowns for every complex math problem so you can learn the fastest reliable method."
            />
            <ValueCard
              icon={<MonitorCheck className="size-7 text-cyan-300" />}
              title="Exact JKSSB CBT Interface"
              text="Practise on the exact digital layout and timed flow you will see on exam day."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-300" />}
              title="Live State-Wide Rank"
              text="See if your score qualifies against thousands of other SI candidates in J&K."
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
              question="What are the total marks for the JKPSI exam?"
              answer="The exam consists of 100 questions carrying 2 marks each, totaling 200 marks."
            />
            <Faq
              question="Is there negative marking?"
              answer="Yes, 0.50 marks are deducted for every incorrect answer."
            />
            <Faq
              question="Do you provide detailed solutions?"
              answer="Yes, every premium mock includes step-by-step explanations."
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
              Ready to Wear the Uniform? Secure Your Rank Today
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
