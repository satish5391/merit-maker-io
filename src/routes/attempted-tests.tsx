import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTests } from "@/lib/mock-test";
import {
  FileText,
  Star,
  Trophy,
  ShoppingBag,
  BookOpen,
  History as HistoryIcon,
  Radio,
} from "lucide-react";
import { type AttemptSummary } from "@/lib/attempt-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/attempted-tests")({
  component: AttemptedTestsPage,
  head: () => ({
    meta: [
      { title: "Attempted Tests — My Mock Test History | Rankdon" },
      {
        name: "description",
        content:
          "See every mock test you have attempted with date, score and accuracy, and open a detailed analysis.",
      },
      { property: "og:title", content: "Attempted Tests — Rankdon" },
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
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: () => fetchTests() });

  const { data: history = [] } = useQuery<AttemptSummary[]>({
    queryKey: ["user-attempt-history", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading attempts from database:", error);
        throw error;
      }

      const remoteHistory = (data ?? []).map((row: any) => {
        const testObj = row.tests || (tests ?? []).find((t) => t.id === row.test_id);
        const correct = Number(row.correct_count ?? row.correct_answers ?? 0);
        const wrong = Number(row.wrong_count ?? row.wrong_answers ?? 0);
        const totalAnswered = correct + wrong;
        const fallbackAccuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
        const maxScore = Number(row.max_score ?? testObj?.total_marks ?? testObj?.max_score ?? 100);

        return {
          attemptId: String(row.id),
          testId: String(row.test_id),
          testTitle: testObj?.title || row.test_title || "Mock Test",
          category: testObj?.category || "General",
          score: Number(row.score ?? 0),
          maxScore: maxScore,
          accuracy: Number(row.accuracy ?? fallbackAccuracy),
          submittedAt: row.created_at || new Date().toISOString(),
        } as AttemptSummary;
      });
      return remoteHistory;
    },
  });

  // All Hooks declared at top level unconditionally
  const categories = useMemo(
    () => [
      "All Categories",
      ...Array.from(new Set(history.map((item) => item.category).filter(Boolean))).sort(),
    ],
    [history],
  );

  const attemptsWithTests = useMemo(
    () => history.map((item) => ({ item, test: tests?.find((test) => test.id === item.testId) })),
    [history, tests],
  );

  const metrics = useMemo(() => {
    const total = history.length;
    const accuracy = total
      ? history.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / total
      : 0;
    const averageScore = total
      ? history.reduce(
          (sum, item) =>
            sum +
            (Number(item.maxScore) > 0 ? (Number(item.score) / Number(item.maxScore)) * 100 : 0),
          0,
        ) / total
      : 0;
    const cleared = attemptsWithTests.filter(({ item, test }) => {
      const cutoff = Number((test as any)?.cutoff_score ?? (test as any)?.cutoff ?? 0);
      return Number(item.score) >= cutoff;
    }).length;
    return { total, accuracy, averageScore, cutoffRate: total ? (cleared / total) * 100 : 0 };
  }, [attemptsWithTests, history]);

  const filteredAttempts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return attemptsWithTests
      .filter(({ item }) => categoryFilter === "All Categories" || item.category === categoryFilter)
      .filter(({ item }) => !query || item.testTitle.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortOrder === "oldest")
          return new Date(a.item.submittedAt).getTime() - new Date(b.item.submittedAt).getTime();
        if (sortOrder === "highest")
          return (
            Number(b.item.score) / Math.max(1, Number(b.item.maxScore)) -
            Number(a.item.score) / Math.max(1, Number(a.item.maxScore))
          );
        if (sortOrder === "lowest")
          return (
            Number(a.item.score) / Math.max(1, Number(a.item.maxScore)) -
            Number(b.item.score) / Math.max(1, Number(b.item.maxScore))
          );
        return new Date(b.item.submittedAt).getTime() - new Date(a.item.submittedAt).getTime();
      });
  }, [attemptsWithTests, categoryFilter, search, sortOrder]);

  const trendData = useMemo(
    () =>
      [...history]
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
        .map((item, index) => ({
          name: `${index + 1}`,
          score: Math.round((Number(item.score) / Math.max(1, Number(item.maxScore))) * 1000) / 10,
        })),
    [history],
  );

  return (
    <main className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Sidebar: hidden on mobile, visible on desktop */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#1e232a] text-slate-300 p-4 border-r border-slate-800 h-full overflow-y-auto flex-col gap-1">
        <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-1 tracking-wider">
          TESTS
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          <Link
            to="/"
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <FileText className="size-4" />
            <span>All Tests</span>
          </Link>

          <Link
            to="/"
            search={{ tab: "free" }}
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <Star className="size-4" />
            <span>Free Mock Tests</span>
          </Link>

          <Link
            to="/live-tests"
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <span className="relative">
              <Radio className="size-4 text-rose-400" />
              <span className="absolute -right-1 -top-1 size-1.5 animate-pulse rounded-full bg-emerald-400 ring-2 ring-[#1e232a]" />
            </span>
            <span>Live Tests</span>
          </Link>

          <Link
            to="/"
            search={{ tab: "packages" }}
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <Trophy className="size-4" />
            <span>Test Series &amp; Combos</span>
          </Link>

          <Link
            to="/"
            search={{ tab: "enrolled" }}
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <ShoppingBag className="size-4" />
            <span>My Enrolled / Purchased</span>
          </Link>
        </nav>

        <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-1 tracking-wider mt-4">
          STUDY MATERIAL
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          <Link
            to="/attempted-tests"
            className="bg-[#2b323c] text-cyan-400 font-semibold border-l-2 border-cyan-400 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm"
          >
            <HistoryIcon className="size-4" />
            <span>Attempted Tests</span>
          </Link>

          <Link
            to="/notes"
            className="hover:bg-[#2b323c] hover:text-white transition-colors duration-150 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm font-medium"
          >
            <BookOpen className="size-4" />
            <span>Study Notes</span>
            <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              NEW
            </span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 md:p-8 min-w-0">
        {!user ? (
          <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <h1 className="font-display text-2xl font-bold">Please log in to view your attempted tests</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to access your cloud-saved test history across devices.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <h1 className="font-display text-2xl font-bold md:text-3xl">Attempted tests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every test you have submitted with this account, with score, accuracy and a detailed
              analysis.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Total Tests Attempted", metrics.total.toString()],
                ["Overall Accuracy", `${metrics.accuracy.toFixed(1)}%`],
                ["Avg Score %", `${metrics.averageScore.toFixed(1)}%`],
                ["Cutoff Cleared Rate", `${metrics.cutoffRate.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            {trendData.length > 0 && (
              <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">Score progress</h2>
                  <span className="text-xs text-muted-foreground">Score percentage over time</span>
                </div>
                <div className="mt-4 h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, "Score"]}
                        labelFormatter={(label) => `Attempt ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0891b2"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
              <input
                aria-label="Search attempts by test title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by test title"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
              </select>
            </div>

            {history.length === 0 && (
              <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven't attempted any tests yet on this account.{" "}
                  <Link to="/" className="text-primary underline">
                    Browse available tests
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {filteredAttempts.map(({ item, test }) => {
                const score = Math.max(0, Number(item.score ?? 0));
                const maxScore = Math.max(
                  1,
                  Number(item.maxScore ?? (test as any)?.max_score ?? 100),
                );
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
                    <div
                      aria-hidden
                      className={
                        "absolute inset-y-0 left-0 z-0 " +
                        (isCleared ? "bg-emerald-50" : "bg-rose-50")
                      }
                      style={{ width: `${fillRatio}%` }}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-stretch relative z-10">
                      <div className="p-4 sm:p-5 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 sm:min-w-[160px] bg-transparent border-b sm:border-b-0 sm:border-r border-border/40">
                        <div className="text-xs text-muted-foreground">Score</div>
                        <div
                          className={
                            "font-display text-2xl font-bold " +
                            (isCleared ? "text-emerald-700" : "text-rose-600")
                          }
                        >
                          {score}
                        </div>
                        <div className="text-xs text-muted-foreground">/ {maxScore}</div>
                      </div>
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{item.category}</Badge>
                        </div>
                        <h2 className="mt-2 font-display text-lg font-semibold leading-snug">
                          {item.testTitle}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.submittedAt).toLocaleString()}
                        </p>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-xs uppercase text-muted-foreground">Accuracy</dt>
                            <dd className="font-display text-lg font-bold">{item.accuracy}%</dd>
                          </div>
                          <div className="sm:col-span-2 text-right flex items-center justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/review/$attemptId" params={{ attemptId: item.attemptId }}>
                                Solution
                              </Link>
                            </Button>
                            <Button asChild size="sm">
                              <Link to="/result/$attemptId" params={{ attemptId: item.attemptId }}>
                                Analysis
                              </Link>
                            </Button>
                          </div>
                        </dl>

                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <div>Attempted on {new Date(item.submittedAt).toLocaleString()}</div>
                          <div>
                            <Link
                              to="/test/$testId"
                              params={{ testId: item.testId }}
                              className="text-primary underline"
                            >
                              Reattempt →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-0 bottom-0 h-1 w-full bg-card overflow-visible">
                      <div
                        aria-hidden
                        className={"h-1 " + (isCleared ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${fillRatio}%` }}
                      />

                      <div
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
        )}
      </div>
    </main>
  );
}