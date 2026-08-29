import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { fetchAttempt, fetchAttemptScores, fetchTest, countQuestions } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isSupabaseUserId } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

function ResultPage() {
  const { attemptId } = Route.useParams();

  // Hooks: fetch attempt first, then dependent queries
  const {
    data: attempt,
    isLoading: isLoadingAttempt,
    isError: isErrorAttempt,
  } = useQuery({ queryKey: ["attempt", attemptId], queryFn: () => fetchAttempt(attemptId) });

  const {
    data: test,
    isLoading: isLoadingTest,
    isError: isErrorTest,
  } = useQuery({ queryKey: ["test", attempt?.test_id], queryFn: () => fetchTest(String(attempt!.test_id)), enabled: Boolean(attempt?.test_id) });

  // Fetch only lightweight attempt scores for ranking/percentile
  const { data: attemptScores, isLoading: isLoadingAttemptScores } = useQuery({
    queryKey: ["attemptScores", attempt?.test_id],
    queryFn: () => fetchAttemptScores(String(attempt!.test_id)),
    enabled: Boolean(attempt?.test_id),
  });

  // Fetch total question count only (lightweight)
  const { data: totalQuestions, isLoading: isLoadingQuestionCount } = useQuery({
    queryKey: ["questionCount", attempt?.test_id],
    queryFn: () => countQuestions(String(attempt!.test_id)),
    enabled: Boolean(attempt?.test_id),
  });

  const { user } = useAuth();
  const supabaseUserId = isSupabaseUserId(user?.id) ? user.id : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!test?.is_live || !test.result_declaration_time) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [test?.is_live, test?.result_declaration_time]);
  const allowedAttempts = test?.max_attempts ?? 1;
  const { data: userAttemptCount = 0 } = useQuery({
    queryKey: ["user-test-attempt-count", supabaseUserId, attempt?.test_id],
    queryFn: async () => {
      if (!supabaseUserId || !attempt?.test_id) return 0;
      const { data, error } = await supabase
        .from("attempts")
        .select("id")
        .eq("user_id", supabaseUserId)
        .eq("test_id", attempt.test_id);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: Boolean(supabaseUserId && attempt?.test_id),
  });

  // Defensive sections parsing (hooks must be at top)
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

  const effectiveSections = useMemo(() => {
    if (sections.length > 0) return sections;
    return [
      { id: "section-default", name: test?.title ?? "Section", duration_minutes: test?.duration_minutes ?? 0 },
    ];
  }, [sections, test]);

  // Loading / error guards
  if (isLoadingAttempt) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading scorecard…</div>;
  }

  if (isErrorAttempt || (!isLoadingAttempt && !attempt)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Attempt not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">We couldn't find the requested attempt.</p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/attempted-tests">Back to Attempts</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // While attempt exists, show skeleton if dependent data is loading
  if (attempt && (isLoadingTest || isLoadingAttemptScores || isLoadingQuestionCount)) {
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

  const resultsPending = Boolean(test?.is_live && test.result_declaration_time && new Date(test.result_declaration_time).getTime() > now);
  if (resultsPending && test) {
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
        <p className="mt-1 text-sm text-muted-foreground">{test.title} · {attempt.student_name}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
          <div className="mx-auto flex size-52 items-center justify-center rounded-full" style={{ background: `conic-gradient(#16a34a 0 ${correctRatio}%, #dc2626 ${correctRatio}% ${correctRatio + incorrectRatio}%, #cbd5e1 ${correctRatio + incorrectRatio}% 100%)` }}>
            <div className="flex size-36 flex-col items-center justify-center rounded-full bg-card text-center"><span className="font-display text-3xl font-bold">{correct}</span><span className="text-xs text-muted-foreground">correct</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Total Attempted Questions</p><p className="mt-1 font-display text-2xl font-bold">{correct + incorrect}</p></div>
            <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Total Correct Questions</p><p className="mt-1 font-display text-2xl font-bold text-emerald-700">{correct}</p></div>
            <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Total Incorrect Questions</p><p className="mt-1 font-display text-2xl font-bold text-rose-700">{incorrect}</p></div>
            <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Unattempted Questions</p><p className="mt-1 font-display text-2xl font-bold text-slate-600">{unattempted}</p></div>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-semibold">Detailed solutions, rank, and percentile analysis will be declared on: {new Date(test.result_declaration_time).toLocaleString()}.</p><p className="mt-2 text-amber-900/80">Your submission has been recorded. Please return after the declaration time to view the complete analysis.</p></div>
        <Button asChild variant="outline" className="mt-6"><Link to="/live-tests">Back to Live Tests</Link></Button>
      </div>
    );
  }

  const safeAttempts = Array.isArray(attemptScores) ? attemptScores : [];
  const sorted = [...safeAttempts].sort((a, b) => Number(b.score) - Number(a.score));
  const rank = sorted.findIndex((a) => a.id === attempt.id) + 1;
  const total = sorted.length;
  const below = sorted.filter((a) => Number(a.score) < Number(attempt.score)).length;
  const percentile = total > 1 ? Math.round((below / (total - 1)) * 1000) / 10 : 100;
  const topScore = Number(sorted[0]?.score ?? 0);
  const average =
    total > 0 ? Math.round((safeAttempts.reduce((s, a) => s + Number(a.score), 0) / total) * 100) / 100 : 0;

  const chartData = {
    labels: sorted.map((a) => (a.id === attempt.id ? `${a.student_name} (you)` : a.student_name)),
    datasets: [
      {
        label: "Score",
        data: sorted.map((a) => Number(a.score)),
        backgroundColor: sorted.map((a) => (a.id === attempt.id ? "rgba(59, 90, 220, 0.95)" : "rgba(148, 163, 184, 0.6)")),
        borderRadius: 6,
      },
    ],
  };

  const stats = [
    { label: "Score", value: `${Number(attempt.score ?? 0)} / ${Number(attempt.max_score ?? 0)}` },
    { label: "Accuracy", value: `${Number(attempt.accuracy ?? 0)}%` },
    { label: "Rank", value: `${isNaN(rank) || rank <= 0 ? 0 : rank} of ${total}` },
    { label: "Percentile", value: `${isNaN(percentile) ? 0 : percentile}` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Badge variant="secondary">{test.subject}</Badge>
      <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">Scorecard — {test.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {attempt.student_name} · finished in {Math.floor(attempt.time_taken_seconds / 60)}m{" "}
        {attempt.time_taken_seconds % 60}s
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Light summary: total questions and CTA to detailed review (avoids fetching full questions) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Total questions</p>
          <p className="mt-2 font-display text-xl font-bold">{typeof totalQuestions === "number" ? totalQuestions : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Test info</p>
          <p className="mt-2 text-sm">Duration: {test?.duration_minutes ?? "—"} minutes</p>
          <p className="mt-1 text-sm">Scoring: +{test?.positive_marks ?? 0} / −{test?.negative_marks ?? 0}</p>
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

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">How you compare</h2>
          <p className="text-sm text-muted-foreground">
            Topper {topScore} · Average {average}
          </p>
        </div>
        <div className="mt-4 h-72">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, title: { display: true, text: "Score" } } },
            }}
          />
        </div>
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">
            You scored better than {below} of {Math.max(total - 1, 0)} other students.
          </p>
          <Progress value={percentile} className="mt-2 h-2" />
        </div>
      </div>

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
          <Button variant="secondary" disabled title={`Attempt Limit Reached (${userAttemptCount}/${allowedAttempts})`}>
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
