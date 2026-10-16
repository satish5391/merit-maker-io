import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  FileWarning,
  HeartPulse,
  MonitorCheck,
} from "lucide-react";

export const Route = createFileRoute("/jkssb-female-supervisor-mock-test")({
  component: JkssbFemaleSupervisorMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB Female Supervisor Mock Test | Social Welfare CBT | Rankdon",
      },
      {
        name: "description",
        content:
          "Attempt the best JKSSB Female Supervisor mock tests based on the latest Mission Poshan syllabus. Practice the 60-mark Specialization section, J&K GK, and Science.",
      },
    ],
  }),
});

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const examPattern = [
  ["General Awareness with J&K reference", "20 Marks"],
  ["General English", "10 Marks"],
  ["Intelligence & Reasoning", "10 Marks"],
  ["General Science", "10 Marks"],
  ["Computer", "10 Marks"],
  ["Specialization - Sociology/Child Development", "60 Marks"],
];

function JkssbFemaleSupervisorMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <HeartPulse className="size-4" />
              Latest Mission Poshan syllabus preparation
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB Female Supervisor Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare for the JKSSB Female Supervisor exam with realistic CBT mock tests. Master the
              60-mark Sociology and Child Development specialization section alongside J&amp;K GK,
              Science, English, and Computer practice.
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
                View Supervisor Packages
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
          <h2 className="mt-3 font-display text-3xl font-bold">Female Supervisor Exam Pattern</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Organise your preparation around the complete 120-mark syllabus and give extra attention
            to the specialization section that carries half of the paper.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">JKSSB Female Supervisor syllabus and marks</caption>
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
            Why Candidates Struggle with the Supervisor Syllabus
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PainPointCard
              icon={<BookOpenCheck className="size-7 text-rose-300" />}
              title="The 60-Mark Specialization Hurdle"
              text="Finding reliable, exam-level questions for Sociology, Nutrition, and POSHAN Abhiyan can make the biggest section harder than it needs to be."
            />
            <PainPointCard
              icon={<FileWarning className="size-7 text-rose-300" />}
              title="Theory-Based Negative Marking"
              text="Confusing sociology theories and government scheme dates can lead to avoidable errors and lost 0.25 marks."
            />
            <PainPointCard
              icon={<Clock3 className="size-7 text-rose-300" />}
              title="Time Management Across 6 Sections"
              text="Balancing Math, Science, and English alongside core specialization subjects requires deliberate timed practice."
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
            Master the Mission Poshan Syllabus with Rankdon
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon={<BookOpenCheck className="size-7 text-cyan-300" />}
              title="Dedicated Specialization Mocks"
              text="Master all 6 units of the Sociology and Child Development syllabus with focused, exam-level practice."
            />
            <ValueCard
              icon={<MonitorCheck className="size-7 text-cyan-300" />}
              title="Complete 120-Mark CBT Interface"
              text="Practise the exact pattern under a strict 2-hour digital timer and build reliable exam pacing."
            />
            <ValueCard
              icon={<BarChart3 className="size-7 text-cyan-300" />}
              title="Live State-Wide Ranking"
              text="See your exact rank among thousands of female aspirants across J&K and measure your progress."
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
              question="What is the weightage of the Specialization section?"
              answer="It carries 60 marks, exactly 50% of the entire paper."
            />
            <Faq
              question="Are these tests based on the latest Mission Poshan syllabus?"
              answer="Yes, our mocks include detailed questions on POSHAN Abhiyan, Anganwadi Services, and Human Rights."
            />
            <Faq
              question="Is there negative marking?"
              answer="Yes, 0.25 marks are deducted per wrong answer."
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
              Ready to Secure Your Selection in the Social Welfare Department?
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
