import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  computeRanking,
  fetchAttempts,
  fetchStudentAttempts,
  fetchTests,
  type Attempt,
} from "@/lib/mock-test";
import { getStudentName, setStudentName } from "@/lib/student";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Attempted Tests — My Mock Test History | TestPrep" },
      {
        name: "description",
        content:
          "See every mock test you have attempted with date, score, accuracy and percentile, and open an in-depth question-wise analysis.",
      },
      { property: "og:title", content: "Attempted Tests — TestPrep" },
      {
        property: "og:description",
        content: "Your mock test history with score, accuracy, percentile and detailed analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [student, setStudent] = useState("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const stored = getStudentName();
    setStudent(stored);
    setNameInput(stored);
  }, []);

  const { data } = useQuery({
    queryKey: ["history", student],
    enabled: student.trim().length > 0,
    queryFn: async () => {
      const mine = await fetchStudentAttempts(student);
      const tests = await fetchTests();
      const byTest = new Map<string, Attempt[]>();
      for (const testId of new Set(mine.map((a) => a.test_id))) {
        byTest.set(testId, await fetchAttempts(testId));
      }
      return mine.map((attempt) => {
        const all = byTest.get(attempt.test_id) ?? [attempt];
        const { rank, total, percentile } = computeRanking(attempt, all);
        return {
          attempt,
          test: tests.find((t) => t.id === attempt.test_id),
          rank,
          total,
          percentile,
        };
      });
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Attempted tests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every test you have submitted, with score, accuracy, percentile and a question-wise
        analysis.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-56 flex-1">
          <Label htmlFor="student">Your name</Label>
          <Input
            id="student"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter the name you used in tests"
            className="mt-1.5"
          />
        </div>
        <Button
          onClick={() => {
            setStudentName(nameInput.trim());
            setStudent(nameInput.trim());
          }}
        >
          Load history
        </Button>
      </div>

      {student.trim().length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Enter your name above to see your attempted tests.
        </p>
      )}

      {data && data.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No attempts yet for “{student}”. <Link to="/" className="text-primary underline">Browse tests</Link>.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data?.map(({ attempt, test, rank, total, percentile }) => (
          <article
            key={attempt.id}
            className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  {test && <Badge>{test.category}</Badge>}
                  {test && <Badge variant="secondary">{test.subject}</Badge>}
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold">
                  {test?.title ?? "Test"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(attempt.created_at).toLocaleString()}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/review/$attemptId" params={{ attemptId: attempt.id }}>
                  <BarChart3 className="mr-1 size-4" /> View detailed analysis
                </Link>
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Score</dt>
                <dd className="font-display text-lg font-bold">
                  {Number(attempt.score)} / {Number(attempt.max_score)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Accuracy</dt>
                <dd className="font-display text-lg font-bold">{Number(attempt.accuracy)}%</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Rank</dt>
                <dd className="font-display text-lg font-bold">
                  {rank} / {total}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Percentile</dt>
                <dd className="font-display text-lg font-bold">{percentile}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
