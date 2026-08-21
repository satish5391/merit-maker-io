import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTests } from "@/lib/mock-test";
import { FileText, Star, Trophy, ShoppingBag, BookOpen, History as HistoryIcon } from "lucide-react";
import { getAttemptHistory, type AttemptSummary } from "@/lib/attempt-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/attempted-tests")({
  component: AttemptedTestsPage,
  head: () => ({
    meta: [
      { title: "Attempted Tests — My Mock Test History | TestPrep" },
      {
        name: "description",
        content:
          "See every mock test you have attempted with date, score and accuracy, and open a detailed analysis.",
      },
      { property: "og:title", content: "Attempted Tests — TestPrep" },
      {
        property: "og:description",
        content: "Your mock test history with score, accuracy and detailed analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AttemptedTestsPage() {
  // Hooks: must stay at top
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: () => fetchTests() });

  useEffect(() => {
    setHistory(getAttemptHistory());
  }, []);

  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 md:w-64 flex-shrink-0 bg-[#1e232a] text-slate-300 p-4 border-r border-slate-800 h-full overflow-y-auto flex flex-col gap-1">
        <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-1 tracking-wider">TESTS</div>
        <nav className="mt-2 flex flex-col gap-1">
          <a href="/" className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium">
            <FileText className="size-4" />
            <span>All Tests</span>
          </a>

          <a href="/?tab=free" className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium">
            <Star className="size-4" />
            <span>Free Mock Tests</span>
          </a>

          <a href="/?tab=packages" className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium">
            <Trophy className="size-4" />
            <span>Test Series &amp; Combos</span>
          </a>

          <a href="/?tab=enrolled" className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium">
            <ShoppingBag className="size-4" />
            <span>My Enrolled / Purchased</span>
          </a>
        </nav>

        <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-1 tracking-wider mt-4">STUDY MATERIAL</div>
        <nav className="mt-2 flex flex-col gap-1">
          <a href="/attempted-tests" className="bg-[#2b323c] text-cyan-400 font-semibold border-l-2 border-cyan-400 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm">
            <HistoryIcon className="size-4" />
            <span>Attempted Tests</span>
          </a>

          <a className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium">
            <BookOpen className="size-4" />
            <span>Study Notes</span>
            <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] p-6 md:p-8 min-w-0">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Attempted tests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every test you have submitted on this device, with score, accuracy and a detailed analysis.
          </p>

          {history.length === 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't attempted any tests yet. {" "}
                <Link to="/" className="text-primary underline">
                  Browse available tests
                </Link>{" "}
                to get started.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {history.map((item) => {
              const test = tests?.find((t) => t.id === item.testId);
              const score = Math.max(0, Number(item.score ?? 0));
              const maxScore = Math.max(1, Number(item.maxScore ?? (test as any)?.max_score ?? 100));
              const lowerCutoff = Number((test as any)?.cutoff ?? Math.round(maxScore * 0.4));
              const upperCutoff = (test as any)?.cutoff_max
                ? Number((test as any).cutoff_max)
                : Math.round(lowerCutoff * 1.15) || lowerCutoff + 1;
              const cutoffRatio = Math.min(100, Math.max(0, (lowerCutoff / maxScore) * 100));
              const isCleared = score >= lowerCutoff;

              const fillRatio = Math.min(100, Math.max(0, (score / maxScore) * 100));

              return (
                <article
                  key={item.attemptId}
                  className="relative rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-visible"
                >
                  {/* proportional background fill */}
                  <div
                    aria-hidden
                    className={"absolute inset-y-0 left-0 z-0 " + (isCleared ? "bg-emerald-50" : "bg-rose-50")}
                    style={{ width: `${fillRatio}%` }}
                  />

                  <div className="flex items-stretch relative z-10">
                    <div className="p-5 flex flex-col items-center justify-center min-w-[160px] bg-transparent">
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className={"mt-1 font-display text-2xl font-bold " + (isCleared ? "text-emerald-700" : "text-rose-600")}>{score}</div>
                      <div className="text-xs text-muted-foreground">/ {maxScore}</div>
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{item.category}</Badge>
                      </div>
                      <h2 className="mt-2 font-display text-lg font-semibold leading-snug">{item.testTitle}</h2>
                      <p className="text-xs text-muted-foreground">{new Date(item.submittedAt).toLocaleString()}</p>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase text-muted-foreground">Accuracy</dt>
                          <dd className="font-display text-lg font-bold">{item.accuracy}%</dd>
                        </div>
                        <div className="sm:col-span-2 text-right flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/review/$attemptId" params={{ attemptId: item.attemptId }}>Solution</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link to="/result/$attemptId" params={{ attemptId: item.attemptId }}>Analysis</Link>
                          </Button>
                        </div>
                      </dl>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <div>Attempted on {new Date(item.submittedAt).toLocaleString()}</div>
                        <div>
                          <Link to="/test/$testId" params={{ testId: item.testId }} className="text-primary underline">Reattempt →</Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* bottom progress bar and cutoff notch */}
                  <div className="absolute left-0 bottom-0 h-1 w-full bg-card overflow-visible">
                    <div
                      aria-hidden
                      className={"h-1 " + (isCleared ? "bg-emerald-500" : "bg-rose-500")}
                      style={{ width: `${fillRatio}%` }}
                    />

                    <div
                      // notch: light yellow rectangular tick sitting over the bottom line
                      className="w-2 h-4 -top-1 bg-yellow-200 border border-yellow-300 rounded-sm shadow-sm cursor-pointer z-30 group/cutoff absolute -translate-x-1/2"
                      style={{ left: `${cutoffRatio}%` }}
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover/cutoff:opacity-100 transition-opacity pointer-events-none">
                        <div className="whitespace-nowrap rounded px-2 py-1 bg-slate-900 text-white text-xs shadow-lg">
                          Cutoff : {lowerCutoff} - {upperCutoff}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
