import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const Route = createFileRoute("/all-exams")({
  component: AllExamsDirectory,
  head: () => ({
    meta: [
      { title: "All Mock Tests & Exam Directory | Rankdon" },
      {
        name: "description",
        content:
          "Browse our complete directory of JKSSB, JKP, and state exam mock tests.",
      },
    ],
  }),
});

const examCategories = [
  {
    title: "JKSSB Exams",
    description: "Focused practice for Jammu and Kashmir Services Selection Board exams.",
    icon: BookOpenCheck,
    links: [
      { label: "JKSSB JKPSI Mock Test", to: "/jkssb-jkpsi-mock-test" },
      { label: "JKSSB FAA Mock Test", to: "/jkssb-faa-mock-test" },
      { label: "JKSSB Patwari Mock Test", to: "/jkssb-patwari-mock-test" },
      { label: "JKSSB Naib Tehsildar Mock Test", to: "/jkssb-naib-tehsildar-mock-test" },
    ],
  },
  {
    title: "Police Exams",
    description: "Build speed and accuracy for competitive police recruitment exams.",
    icon: ShieldCheck,
    links: [{ label: "JKP Constable Mock Test", to: "/jkp-constable-mock-test" }],
  },
  {
    title: "Free Tests",
    description: "Start with accessible practice sets and find your next target exam.",
    icon: Sparkles,
    links: [{ label: "Free JKSSB Mock Tests", to: "/free-jkssb-mock-tests" }],
  },
] as const;

function AllExamsDirectory() {
  return (
    <>
      <Helmet>
        <title>All Mock Tests &amp; Exam Directory | Rankdon</title>
        <meta
          name="description"
          content="Browse our complete directory of JKSSB, JKP, and state exam mock tests."
        />
      </Helmet>
      <main className="min-h-full bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_40%),radial-gradient(circle_at_15%_70%,_rgba(37,99,235,0.16),_transparent_38%)]" />
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            <Sparkles className="size-4" />
            Rankdon exam directory
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Find the right mock test for your exam
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Browse every Rankdon exam practice route in one place and choose focused preparation
            for your next J&amp;K government exam.
          </p>
        </div>
      </section>

      <section className="bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {examCategories.map(({ title, description, icon: Icon, links }) => (
              <section
                key={title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <Icon className="size-7 text-cyan-600" />
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-2 min-h-14 text-sm leading-6 text-slate-600">{description}</p>
                <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                  {links.map(({ label, to }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="group flex items-start justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <span>{label}</span>
                        <ArrowUpRight className="mt-0.5 size-4 shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
