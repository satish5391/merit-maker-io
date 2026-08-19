import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { fetchAttempt, fetchAttempts, fetchTest } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const Route = createFileRoute("/result/$attemptId")({
  head: () => ({
    meta: [
      { title: "Your Scorecard — Rank, Percentile & Analysis | TestPrep" },
      {
        name: "description",
        content:
          "See your mock test scorecard: score, accuracy, rank, percentile and a comparison graph against other students.",
      },
      { property: "og:title", content: "Your Mock Test Scorecard — TestPrep" },
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

  const { data } = useQuery({
    queryKey: ["result", attemptId],
    queryFn: async () => {
      const attempt = await fetchAttempt(attemptId);
      const [test, attempts] = await Promise.all([
        fetchTest(attempt.test_id),
        fetchAttempts(attempt.test_id),
      ]);
      return { attempt, test, attempts };
    },
  });

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading scorecard…</div>
    );
  }

  const { attempt, test, attempts } = data;
  const sorted = [...attempts].sort((a, b) => Number(b.score) - Number(a.score));
  const rank = sorted.findIndex((a) => a.id === attempt.id) + 1;
  const total = sorted.length;
  const below = sorted.filter((a) => Number(a.score) < Number(attempt.score)).length;
  const percentile = total > 1 ? Math.round((below / (total - 1)) * 1000) / 10 : 100;
  const topScore = Number(sorted[0]?.score ?? 0);
  const average =
    total > 0 ? Math.round((attempts.reduce((s, a) => s + Number(a.score), 0) / total) * 100) / 100 : 0;

  const chartData = {
    labels: sorted.map((a) => (a.id === attempt.id ? `${a.student_name} (you)` : a.student_name)),
    datasets: [
      {
        label: "Score",
        data: sorted.map((a) => Number(a.score)),
        backgroundColor: sorted.map((a) =>
          a.id === attempt.id ? "rgba(59, 90, 220, 0.95)" : "rgba(148, 163, 184, 0.6)",
        ),
        borderRadius: 6,
      },
    ],
  };

  const stats = [
    { label: "Score", value: `${Number(attempt.score)} / ${Number(attempt.max_score)}` },
    { label: "Accuracy", value: `${Number(attempt.accuracy)}%` },
    { label: "Rank", value: `${rank} of ${total}` },
    { label: "Percentile", value: `${percentile}` },
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-success">Correct</p>
          <p className="font-display text-xl font-bold">{attempt.correct_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-destructive">Wrong</p>
          <p className="font-display text-xl font-bold">{attempt.wrong_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Skipped</p>
          <p className="font-display text-xl font-bold">{attempt.skipped_count}</p>
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
          <Link to="/test/$testId" params={{ testId: test.id }}>
            Retake test
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to tests</Link>
        </Button>
      </div>
    </div>
  );
}
