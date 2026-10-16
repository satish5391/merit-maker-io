import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, Clock3, Globe2, Keyboard, MonitorCheck } from "lucide-react";

export const Route = createFileRoute("/jkssb-junior-assistant-mock-test")({
  component: JkssbJuniorAssistantMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB Junior Assistant Mock Test | Free CBT Practice | Rankdon",
      },
      {
        name: "description",
        content:
          "Attempt free JKSSB Junior Assistant mock tests based on the official 80-mark CBT syllabus. Practice English, J&K GK, Reasoning, and Computers under a strict 80-minute timer.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const examPattern = [
  ["General English", "20 Marks"],
  ["General Awareness w.r.t J&K UT", "20 Marks"],
  ["Numerical & Reasoning Ability", "20 Marks"],
  ["Basic Concepts of Computers", "20 Marks"],
];

function JkssbJuniorAssistantMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <MonitorCheck className="size-4" />
              Official 80-mark JKSSB CBT syllabus
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB Junior Assistant Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare for the JKSSB Junior Assistant exam with realistic CBT mock tests. Practise
              English, J&amp;K General Knowledge, Reasoning, and Computers while building the speed
              needed to complete 80 questions in 80 minutes.
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
                View Junior Assistant Packages
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
          <h2 className="mt-3 font-display text-3xl font-bold">
            Official Junior Assistant Exam Pattern
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Build your preparation around the complete 80-mark syllabus and use timed practice to
            improve accuracy across every section.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Official JKSSB Junior Assistant syllabus and marks
              </caption>
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
            Total: 80 Questions | 80 Marks | Duration: 80 Minutes | Negative Marking: 0.25
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Candidates Fail the Junior Assistant CBT
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-300" />}
              title="The 80-Minute Speed Crunch"
              text="Struggling to read and solve 80 questions in exactly 80 minutes can leave scoring questions unanswered."
            />
            <PainPointCard
              icon={<Keyboard className="size-7 text-rose-300" />}
              title="The Typing Trap"
              text="Clearing the typing test is only one step; weak CBT performance can still prevent you from securing the final merit cut-off."
            />
            <PainPointCard
              icon={<Globe2 className="size-7 text-rose-300" />}
              title="Underestimating J&K GK"
              text="Losing the crucial 25% weightage given strictly to local geography and history can cost your final rank."
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
            Dominate the 80-Mark CBT with Rankdon
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<MonitorCheck className="size-7 text-cyan-300" />}
              title="High-Speed Exam Interface"
              text="Train your brain to solve questions under the exact 80-minute countdown and improve your pacing."
            />
            <ValueCard
              icon={<Globe2 className="size-7 text-cyan-300" />}
              title="Targeted J&K GK Mocks"
              text="Master local history, economy, and Reorganisation Act questions through focused sectional practice."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-300" />}
              title="Live State-Wide Percentile"
              text="See where you stand against thousands of other typing-qualified candidates across J&K."
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
              question="What is the written exam pattern for Junior Assistant?"
              answer="It is an 80-mark CBT with 80 questions to be solved in 80 minutes."
            />
            <Faq
              question="Is there negative marking?"
              answer="Yes, 0.25 marks are deducted per incorrect answer."
            />
            <Faq
              question="Do you cover the latest computer syllabus?"
              answer="Yes, our mocks include extensive questions on MS Office, Internet, and Operating Systems."
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
              Ready to Clear the Final Merit List?
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
