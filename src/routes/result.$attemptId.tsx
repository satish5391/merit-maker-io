import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calculator,
  FileText,
  Layers,
  Medal,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAttempt, fetchTest, fetchQuestions, type Attempt, countQuestions } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isSupabaseUserId } from "@/lib/utils";

export const Route = createFileRoute("/result/$attemptId")({
  head: () => ({
    meta: [
      { title: "Your Scorecard — Rank, Percentile & Analysis | Rankdon" },
      {
        name: "description",
        content:
          "See your mock test scorecard: score, accuracy, rank, percentile and a comparison graph against other students.",
      },
      { property: "og:title", content: "Your Mock Test Scorecard — Rankdon" },
      {
        property: "og:description",
        content: "Score, accuracy, rank, percentile and a comparison graph against other students.",
      },
    ],
  }),
  component: ResultPage,
});

type AnalysisMetric = {
  score: number;
  accuracy: number;
  correct: number;
  wrong: number;
  time: number;
  total: number;
};

function parseAnswers(value: unknown): Record<string, number> {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, number>;
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, number>)
    : {};
}

function getMetric(
  attempt: Attempt,
  scopedQuestions: any[],
  positiveMarks: number,
  negativeMarks: number,
): AnalysisMetric {
  const answers = parseAnswers(attempt.answers);
  let correct = 0;
  let wrong = 0;
  for (const question of scopedQuestions) {
    const answer = answers[question.id];
    if (answer === undefined) continue;
    if (answer === question.correct_index) correct += 1;
    else wrong += 1;
  }
  const total = scopedQuestions.length;
  const attempted = correct + wrong;
  return {
    score: correct * positiveMarks - wrong * negativeMarks,
    accuracy: attempted ? (correct / attempted) * 100 : 0,
    correct,
    wrong,
    time: Number(attempt.time_taken_seconds ?? 0),
    total,
  };
}

function averageMetric(metrics: AnalysisMetric[]): AnalysisMetric {
  if (!metrics.length) return { score: 0, accuracy: 0, correct: 0, wrong: 0, time: 0, total: 0 };
  return metrics.reduce(
    (sum, metric) => ({
      score: sum.score + metric.score,
      accuracy: sum.accuracy + metric.accuracy,
      correct: sum.correct + metric.correct,
      wrong: sum.wrong + metric.wrong,
      time: sum.time + metric.time,
      total: sum.total + metric.total,
    }),
    { score: 0, accuracy: 0, correct: 0, wrong: 0, time: 0, total: 0 },
  );
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}m ${String(safe % 60).padStart(2, "0")}s`;
}

function ResultPage() {
  const { attemptId } = Route.useParams();

  // 1. Fetch Attempt
  const {
    data: attempt,
    isLoading: isLoadingAttempt,
    isError: isErrorAttempt,
  } = useQuery({ queryKey: ["attempt", attemptId], queryFn: () => fetchAttempt(attemptId) });

  // 2. Fetch Test
  const {
    data: test,
    isLoading: isLoadingTest,
    isError: isErrorTest,
  } = useQuery({
    queryKey: ["test", attempt?.test_id],
    queryFn: () => fetchTest(String(attempt!.test_id)),
    enabled: Boolean(attempt?.test_id),
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["result-questions", attempt?.test_id],
    queryFn: () => fetchQuestions(String(attempt!.test_id)),
    enabled: Boolean(attempt?.test_id),
  });

  const { data: totalQuestions, isLoading: isLoadingQuestionCount } = useQuery({
    queryKey: ["questionCount", attempt?.test_id],
    queryFn: () => countQuestions(String(attempt!.test_id)),
    enabled: Boolean(attempt?.test_id),
  });

  const { data: allAttempts = [], isLoading: isLoadingAllAttempts } = useQuery<Attempt[]>({
    queryKey: ["test-attempts-analysis", attempt?.test_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("attempts")
        .select("id, user_id, student_name, score, max_score, accuracy, time_taken_seconds, created_at, answers, correct_count, wrong_count, skipped_count, status, profiles(full_name)")
        .eq("test_id", attempt!.test_id)
        .order("score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attempt[];
    },
    enabled: Boolean(attempt?.test_id),
  });

  const { data: topRankers = [], isLoading: isLoadingTopRankers } = useQuery({
    queryKey: ["top-rankers", attempt?.test_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("attempts")
        .select("id, user_id, student_name, score, max_score, accuracy, time_taken_seconds, profiles(full_name)")
        .eq("test_id", attempt!.test_id)
        .order("score", { ascending: false })
        .order("time_taken_seconds", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(attempt?.test_id),
  });

  const { user } = useAuth();
  const supabaseUserId = user?.id && isSupabaseUserId(user.id) ? user.id : null;
  const [now, setNow] = useState(() => Date.now());
  const [analysisSection, setAnalysisSection] = useState("overall");

  useEffect(() => {
    if (!test?.is_live || !test.result_declaration_time) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [test?.is_live, test?.result_declaration_time]);

  const { data: userAttemptCount = 0 } = useQuery({
    queryKey: ["user-test-attempt-count", supabaseUserId, attempt?.test_id],
    queryFn: async () => {
      if (!supabaseUserId || !attempt?.test_id) return 0;
      const { data, error } = await (supabase as any)
        .from("attempts")
        .select("id")
        .eq("user_id", supabaseUserId)
        .eq("test_id", attempt.test_id);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: Boolean(supabaseUserId && attempt?.test_id),
  });

  // Defensive sections parsing
  const rawSections = (test as any)?.sections;
  const sections = useMemo(() => {
    if (!rawSections) return [] as any[];
    if (typeof rawSections === "string") {
      try {
        const parsed = JSON.parse(rawSections);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(rawSections) ? rawSections : [];
  }, [rawSections]);

  const analysisSections = useMemo(
    () => [{ id: "overall", name: "Overall" }, ...sections.map((section: any) => ({ id: section.id, name: section.name }))],
    [sections],
  );

  const sortedAttempts = useMemo(
    () => {
      const currentAttempt = attempt;
      const validAttempts = (allAttempts ?? []).filter((row) => (row as any).status !== "in_progress");
      const attemptsWithBaseline = validAttempts.length > 0 ? validAttempts : currentAttempt ? [currentAttempt] : [];
      if (currentAttempt && !attemptsWithBaseline.some((row) => row.id === currentAttempt.id)) {
        attemptsWithBaseline.push(currentAttempt);
      }
      return attemptsWithBaseline.sort(
        (a, b) => Number(b.score) - Number(a.score) || Number(a.time_taken_seconds) - Number(b.time_taken_seconds),
      );
    },
    [allAttempts, attempt],
  );

  const analysis = useMemo(() => {
    const completed = sortedAttempts;
    const maxScore = Number(attempt?.max_score ?? 0);
    const scores = completed.map((row) => Number(row.score ?? 0));
    const sortedScores = [...scores].sort((a, b) => a - b);
    const median = sortedScores.length
      ? sortedScores.length % 2
        ? sortedScores[Math.floor(sortedScores.length / 2)]
        : (Number(sortedScores[sortedScores.length / 2 - 1] ?? 0) + Number(sortedScores[sortedScores.length / 2] ?? 0)) / 2
      : 0;
      const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const bucketSize = 5;
    const bucketCount = Math.max(1, Math.ceil((maxScore || 5) / bucketSize));
    const distribution = Array.from({ length: bucketCount }, (_, index) => {
      const start = index * bucketSize;
      const end = Math.min(start + bucketSize, maxScore || start + bucketSize);
      return {
        range: `${start} to ${end}`,
        start,
        count: scores.filter((score) => score >= start && (index === bucketCount - 1 ? score <= end : score < end)).length,
      };
    });
    const questionScope = analysisSection === "overall"
      ? questions
      : questions.filter((question: any) => question.section_id === analysisSection);
    const positiveMarks = Number(test?.positive_marks ?? 0);
    const negativeMarks = Number(test?.negative_marks ?? 0);
    const attemptMetrics = completed.map((row) => getMetric(row, questionScope, positiveMarks, negativeMarks));
    const userMetric = attempt ? getMetric(attempt, questionScope, positiveMarks, negativeMarks) : averageMetric([]);
    const topperMetric = attemptMetrics[completed.findIndex((row) => row.id === sortedAttempts[0]?.id)] ?? userMetric;
    const averageTotals = averageMetric(attemptMetrics);
    const averageMetricValue = attemptMetrics.length
      ? Object.fromEntries(Object.entries(averageTotals).map(([key, value]) => [key, value / attemptMetrics.length])) as AnalysisMetric
      : averageTotals;
    return {
      completed,
      maxScore,
      average,
      median,
      topScore: Math.max(...scores, 0),
      distribution,
      userMetric,
      topperMetric,
      averageMetric: averageMetricValue,
    };
  }, [analysisSection, attempt, questions, sections, sortedAttempts, test]);


  // Loading state
  if (
    isLoadingAttempt ||
    isLoadingTest ||
    isLoadingQuestions ||
    isLoadingQuestionCount ||
    isLoadingAllAttempts ||
    isLoadingTopRankers
  ) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse mx-auto max-w-3xl">
          <div className="h-6 w-48 rounded bg-muted mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Error guard: Ensures attempt and test are non-null below this line
  if (isErrorAttempt || isErrorTest || !attempt || !test) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Attempt not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find the requested attempt or test data.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/attempted-tests">Back to Attempts</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allowedAttempts = test.max_attempts ?? 1;
  const resultsPending = Boolean(
    test.is_live &&
      test.result_declaration_time &&
      new Date(String(test.result_declaration_time)).getTime() > now,
  );

  if (resultsPending) {
    const correct = Number(attempt.correct_count ?? 0);
    const incorrect = Number(attempt.wrong_count ?? 0);
    const unattempted = Number(attempt.skipped_count ?? 0);
    const total = Math.max(1, correct + incorrect + unattempted);
    const correctRatio = (correct / total) * 100;
    const incorrectRatio = (incorrect / total) * 100;

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Badge variant="secondary">Live test submitted</Badge>
        <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">Submission received</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {test.title} · {getAttemptDisplayName(attempt)}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
          <div
            className="mx-auto flex size-52 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#16a34a 0 ${correctRatio}%, #dc2626 ${correctRatio}% ${correctRatio + incorrectRatio}%, #cbd5e1 ${correctRatio + incorrectRatio}% 100%)`,
            }}
          >
            <div className="flex size-36 flex-col items-center justify-center rounded-full bg-card text-center">
              <span className="font-display text-3xl font-bold">{correct}</span>
              <span className="text-xs text-muted-foreground">correct</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Total Attempted Questions</p>
              <p className="mt-1 font-display text-2xl font-bold">{correct + incorrect}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Total Correct Questions</p>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-700">{correct}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Total Incorrect Questions</p>
              <p className="mt-1 font-display text-2xl font-bold text-rose-700">{incorrect}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Unattempted Questions</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-600">{unattempted}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">
            Detailed solutions, rank, and percentile analysis will be declared on:{" "}
            {test.result_declaration_time
              ? new Date(String(test.result_declaration_time)).toLocaleString()
              : "Date TBA"}
            .
          </p>
          <p className="mt-2 text-amber-900/80">
            Your submission has been recorded. Please return after the declaration time to view the
            complete analysis.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/live-tests">Back to Live Tests</Link>
        </Button>
      </div>
    );
  }

  const rank = sortedAttempts.findIndex((a) => a.id === attempt.id) + 1;
  const total = analysis.completed.length;
  const below = sortedAttempts.filter((a) => Number(a.score) < Number(attempt.score)).length;
  const percentile = total > 1 ? Math.round((below / (total - 1)) * 1000) / 10 : 100;
  const topScore = analysis.topScore;
  const average = Math.round(analysis.average * 100) / 100;
  const selectedComparison: { label: string; metric: AnalysisMetric; color: string }[] = [
    { label: "You", metric: analysis.userMetric, color: "bg-violet-600" },
    { label: "Topper", metric: analysis.topperMetric, color: "bg-slate-700" },
    { label: "Avg", metric: analysis.averageMetric, color: "bg-slate-400" },
  ];

  const comparisonRows: [string, (metric: AnalysisMetric) => string][] = [
    ["Score", (metric) => `${metric.score.toFixed(1)} / ${metric.total * Number(test.positive_marks ?? 0)}`],
    ["Accuracy", (metric) => `${metric.accuracy.toFixed(1)}%`],
    ["Correct", (metric) => `${metric.correct} / ${metric.total}`],
    ["Wrong", (metric) => `${metric.wrong} / ${metric.total}`],
    ["Time", (metric) => `${formatClock(metric.time)} / ${formatClock(Number(test.duration_minutes ?? 0) * 60)}`],
  ];

  const userBucket = String(
    analysis.distribution.find(
      (bucket) => attempt.score >= bucket.start && attempt.score <= bucket.start + 5,
    )?.range ?? "0 to 5",
  );
  const median = Number(analysis.median || 0);
  const displayTopRankers = (topRankers ?? []).length > 0
    ? topRankers
    : sortedAttempts.slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Badge variant="secondary">{test.subject}</Badge>
      <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">
        Scorecard — {test.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {getAttemptDisplayName(allAttempts.find((row) => row.id === attempt.id) ?? attempt)} · finished in {Math.floor(Number(attempt.time_taken_seconds ?? 0) / 60)}m{" "}
        {Number(attempt.time_taken_seconds ?? 0) % 60}s
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Rank", value: `${Math.max(0, rank)} / ${total}`, icon: Medal, tone: "bg-rose-100 text-rose-700" },
          { label: "Score", value: `${Number(attempt.score ?? 0)} / ${Number(attempt.max_score ?? 0)}`, icon: Trophy, tone: "bg-violet-100 text-violet-700" },
          { label: "Attempted", value: `${Number(attempt.correct_count ?? 0) + Number(attempt.wrong_count ?? 0)} / ${totalQuestions ?? 0}`, icon: FileText, tone: "bg-sky-100 text-sky-700" },
          { label: "Accuracy", value: `${Number(attempt.accuracy ?? 0)}%`, icon: Target, tone: "bg-emerald-100 text-emerald-700" },
          { label: "Percentile", value: `${Number(percentile).toFixed(1)}%`, icon: Users, tone: "bg-indigo-100 text-indigo-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className={`flex size-10 items-center justify-center rounded-full ${item.tone}`}><Icon className="size-5" /></div>
              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-xl font-bold">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Total questions</p>
          <p className="mt-2 font-display text-xl font-bold">
            {typeof totalQuestions === "number" ? totalQuestions : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Test info</p>
          <p className="mt-2 text-sm">Duration: {test.duration_minutes ?? "—"} minutes</p>
          <p className="mt-1 text-sm">
            Scoring: +{test.positive_marks ?? 0} / −{test.negative_marks ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-success">Correct</p>
          <p className="font-display text-xl font-bold">{attempt.correct_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-destructive">Wrong</p>
          <p className="font-display text-xl font-bold">{attempt.wrong_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Skipped</p>
          <p className="font-display text-xl font-bold">{attempt.skipped_count ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Marks Distribution</h2>
              <p className="mt-1 text-sm text-muted-foreground">How scores are distributed across completed attempts.</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Average: <strong className="text-foreground">{average.toFixed(2)}</strong></div>
              <div>Median: <strong className="text-foreground">{median.toFixed(2)}</strong></div>
              <div>Topper: <strong className="text-foreground">{topScore}</strong></div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {analysisSections.map((section) => (
              (() => {
                const Icon = section.id === "overall" ? Layers : getSectionIcon(section.name);
                return (
              <button
                key={section.id}
                type="button"
                onClick={() => setAnalysisSection(section.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${analysisSection === section.id ? "border-blue-500 bg-blue-600 text-white shadow-sm ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="size-4" />
                {section.name}
              </button>
                );
              })()
            ))}
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.distribution} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} label={{ value: "Students", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} students`, "Attempts"]} labelFormatter={(label) => `Score range: ${label}`} />
                <ReferenceLine x={userBucket} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: `You are here: ${attempt.score}`, position: "top", fill: "#7c3aed", fontSize: 11 }} />
                <ReferenceLine y={Math.max(...analysis.distribution.map((bucket) => bucket.count), 0)} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Topper: ${topScore}`, position: "insideTopRight", fill: "#b45309", fontSize: 11 }} />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: "#7c3aed" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">You scored better than {below} of {Math.max(total - 1, 0)} other students.</p>
          <Progress value={percentile} className="mt-2 h-2" />
        </section>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-semibold">Top Rankers</h2>
          <div className="mt-4 space-y-3">
            {displayTopRankers.map((ranker: any, index: number) => {
              const name = getAttemptDisplayName(ranker);
              const initials = name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={ranker.id} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-muted-foreground">{index + 1}.</span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">{ranker.score}/{ranker.max_score}</span>
                </div>
              );
            })}
            {!displayTopRankers.length && <p className="text-sm text-muted-foreground">No completed attempts yet.</p>}
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Compare with Topper</h2>
            <p className="mt-1 text-sm text-muted-foreground">{analysisSections.find((section) => section.id === analysisSection)?.name ?? "Overall"} performance</p>
          </div>
          <span className="text-sm text-muted-foreground">{total} completed attempts</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Metric</th>{selectedComparison.map((row) => <th key={row.label} className="px-3 py-3">{row.label}</th>)}</tr></thead>
            <tbody>
              {comparisonRows.map(([label, format], index) => (
                <tr key={label} className="border-b last:border-0"><td className="px-3 py-3 font-medium text-muted-foreground">{label}</td>{selectedComparison.map((row) => <td key={row.label} className="px-3 py-3"><span className={`inline-flex rounded-md px-2 py-1 font-semibold ${index === 0 ? `${row.color} text-white` : index === 2 ? "bg-emerald-100 text-emerald-700" : index === 3 ? "bg-rose-100 text-rose-700" : index === 4 ? "bg-amber-100 text-amber-700" : "text-foreground"}`}>{format(row.metric)}</span>{index === 1 && <div className="mt-1 h-1.5 w-28 rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, row.metric.accuracy)}%` }} /></div>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/review/$attemptId" params={{ attemptId }}>
            View Detailed Solutions &amp; Analysis
          </Link>
        </Button>
        {userAttemptCount < allowedAttempts ? (
          <Button asChild>
            <Link to="/test/$testId" params={{ testId: test.id }}>
              Re-attempt Test
            </Link>
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled
            title={`Attempt Limit Reached (${userAttemptCount}/${allowedAttempts})`}
          >
            Attempt Limit Reached ({userAttemptCount}/{allowedAttempts})
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">Back to All Tests</Link>
        </Button>
      </div>
    </div>
  );
}

function cleanDisplayName(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const localPart = text.includes("@") ? (text.split("@")[0] ?? "") : text;
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function getAttemptDisplayName(row: any) {
  return cleanDisplayName(row?.profiles?.full_name || row?.student_name || row?.email) || "Student";
}

function getSectionIcon(name: string) {
  const value = name.toLowerCase();
  if (value.includes("math")) return Calculator;
  if (value.includes("knowledge") || value.includes("gk") || value.includes("english")) return BookOpen;
  return Layers;
}