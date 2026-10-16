import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  FileText,
  Landmark,
  MonitorCheck,
  Scale,
} from "lucide-react";

export const Route = createFileRoute("/jkssb-naib-tehsildar-mock-test")({
  component: JkssbNaibTehsildarMockTestPage,
  head: () => ({
    meta: [
      {
        title: "JKSSB Naib Tehsildar Mock Test | Free CBT & Exam Pattern | Rankdon",
      },
      {
        name: "description",
        content:
          "Prepare for the JKSSB Naib Tehsildar exam with our official 120-mark CBT mock tests. Practice J&K GK, IT, English, and Reasoning based on the latest syllabus.",
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
  ["Knowledge of Information Technology", "18 Marks"],
  ["Mental Ability, Reasoning & Mensuration", "18 Marks"],
];

const painPoints = [
  {
    icon: <Scale className="size-7 text-rose-300" />,
    title: "The 60-Mark GK Trap",
    text: "Failing to score high in the massive Indian and J&K General Knowledge sections can put the cut-off out of reach.",
  },
  {
    icon: <Brain className="size-7 text-rose-300" />,
    title: "Studying the Wrong Math",
    text: "Wasting time on full Quantitative Aptitude when the syllabus only asks for Mensuration and Reasoning costs valuable preparation time.",
  },
  {
    icon: <FileText className="size-7 text-rose-300" />,
    title: "The Urdu Qualification Hurdle",
    text: "Clearing the 120-mark CBT is not enough if you fail the 50-mark descriptive Urdu reading and writing test.",
  },
];

const valueProps = [
  {
    icon: <CheckCircle2 className="size-7 text-cyan-300" />,
    title: "Syllabus-Strict Mocks",
    text: "We removed generic math and focus strictly on Mensuration and logical reasoning, exactly where the syllabus demands.",
  },
  {
    icon: <BookOpenCheck className="size-7 text-cyan-300" />,
    title: "Massive GK Coverage",
    text: "Deep-dive questions cover the J&K Reorganization Act, Indian Economy, current affairs, and the facts that decide your rank.",
  },
  {
    icon: <BarChart3 className="size-7 text-cyan-300" />,
    title: "Live State-Wide Ranking",
    text: "Benchmark your score against thousands of top-tier aspirants and know exactly where you stand before the real exam.",
  },
];

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-white/[0.08]">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
    </article>
  );
}

function JkssbNaibTehsildarMockTestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_15%_80%,_rgba(37,99,235,0.2),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <MonitorCheck className="size-4" />
              Official 120-mark CBT preparation
            </p>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JKSSB Naib Tehsildar Mock Test Series
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Prepare for the Naib Tehsildar exam with realistic CBT mocks built around J&K GK,
              English, IT, reasoning, and the latest official exam pattern.
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
                View Naib Tehsildar Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Know the paper
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold">
              Paper 1 Written CBT (120 Marks)
            </h2>
            <p className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 font-bold text-amber-100">
              Paper 2: 50-Mark Descriptive Urdu Test (Qualifying in nature)
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                JKSSB Naib Tehsildar Paper 1 written CBT exam pattern
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
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-semibold text-cyan-100">
            Paper 1 Total: 120 Questions | 120 Marks | Duration: 2 Hours | Negative Marking: 0.25
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">
            Common hurdles
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Why Aspirants Miss the Naib Tehsildar Cut-off
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painPoints.map((point) => (
              <InfoCard key={point.title} {...point} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Prepare with an edge
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">
            Secure Your Seat in the Revenue Department
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {valueProps.map((point) => (
              <InfoCard key={point.title} {...point} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">FAQs</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Naib Tehsildar Exam FAQs</h2>
          </div>
          <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] px-6">
            <details className="group py-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                What is the pattern for the Naib Tehsildar exam?
                <span className="text-cyan-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                It consists of a 120-mark objective Paper 1 and a 50-mark descriptive Urdu Paper
                2.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                Is the Urdu test mandatory?
                <span className="text-cyan-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Yes, it is a qualifying test. You must clear the reading and writing sections to be
                considered for the final merit list.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                Is there negative marking?
                <span className="text-cyan-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Yes, 0.25 marks are deducted per wrong answer in Paper 1.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 rounded-3xl bg-cyan-400 px-7 py-10 text-slate-950 shadow-2xl shadow-cyan-500/10 sm:flex-row sm:items-center sm:px-10">
          <div>
            <Landmark className="mb-4 size-8" />
            <h2 className="font-display text-3xl font-bold">Ready to Clear the Naib Tehsildar Exam?</h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-800/80">
              Turn your preparation into a rank with focused mocks, detailed analysis, and a
              syllabus-first strategy.
            </p>
          </div>
          <a
            href="/?tab=packages"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 focus:ring-offset-cyan-400"
          >
            Explore Premium Packages
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
