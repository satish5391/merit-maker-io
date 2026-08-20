import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChartBar as BarChart3 } from "lucide-react";
import { getAttemptHistory, type AttemptSummary } from "@/lib/attempt-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/attempted-tests")({
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
  component: AttemptedTestsPage,
});

function AttemptedTestsPage() {
  const [history, setHistory] = useState<AttemptSummary[]>([]);

  useEffect(() => {
    setHistory(getAttemptHistory());
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Attempted tests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every test you have submitted on this device, with score, accuracy and a detailed analysis.
      </p>

      {history.length === 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You haven't attempted any tests yet.{" "}
            <Link to="/" className="text-primary underline">
              Browse available tests
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {history.map((item) => (
          <article
            key={item.attemptId}
            className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>{item.category}</Badge>
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold leading-snug">
                  {item.testTitle}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.submittedAt).toLocaleString()}
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/review/$attemptId" params={{ attemptId: item.attemptId }}>
                  <BarChart3 className="mr-1 size-4" /> View Analysis
                </Link>
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Score</dt>
                <dd className="font-display text-lg font-bold">
                  {item.score} / {item.maxScore}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Accuracy</dt>
                <dd className="font-display text-lg font-bold">{item.accuracy}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
