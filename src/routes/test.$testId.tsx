import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuestions, fetchTest } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/test/$testId")({
  head: () => ({
    meta: [
      { title: "Attempt Mock Test — Timed Exam | TestPrep" },
      {
        name: "description",
        content:
          "Attempt a timed mock test with a live countdown, question palette and automatic submission when time runs out.",
      },
      { property: "og:title", content: "Attempt Mock Test — TestPrep" },
      {
        property: "og:description",
        content: "Timed mock test with countdown, question palette and auto-submit.",
      },
    ],
  }),
  component: TestPage,
});

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TestPage() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();

  const { data: test } = useQuery({ queryKey: ["test", testId], queryFn: () => fetchTest(testId) });
  const { data: questions } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });

  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current || !test || !questions) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        let correct = 0;
        let wrong = 0;
        let skipped = 0;
        for (const q of questions) {
          const a = answers[q.id];
          if (a === undefined) skipped += 1;
          else if (a === q.correct_index) correct += 1;
          else wrong += 1;
        }
        const score = correct * Number(test.positive_marks) - wrong * Number(test.negative_marks);
        const attempted = correct + wrong;
        const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10;
        const timeTaken = test.duration_minutes * 60 - secondsLeft;

        const { data, error } = await supabase
          .from("attempts")
          .insert({
            test_id: test.id,
            student_name: name.trim() || "Guest",
            score: Math.round(score * 100) / 100,
            max_score: questions.length * Number(test.positive_marks),
            correct_count: correct,
            wrong_count: wrong,
            skipped_count: skipped,
            accuracy,
            time_taken_seconds: Math.max(0, timeTaken),
          })
          .select()
          .single();
        if (error) throw error;

        if (auto) toast.info("Time's up — your test was submitted automatically.");
        navigate({ to: "/result/$attemptId", params: { attemptId: data.id } });
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(e instanceof Error ? e.message : "Could not submit test");
      }
    },
    [answers, name, navigate, questions, secondsLeft, test],
  );

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          void submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, submit]);

  if (!test || !questions) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading test…</div>;
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <Badge variant="secondary">{test.subject}</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold">{test.title}</h1>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{questions.length} questions · {test.duration_minutes} minutes</li>
            <li>+{test.positive_marks} for each correct answer</li>
            <li>−{test.negative_marks} for each wrong answer</li>
            <li>The test auto-submits when the timer hits zero.</li>
          </ul>
          <div className="mt-6">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1.5"
            />
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              setSecondsLeft(test.duration_minutes * 60);
              setStarted(true);
            }}
          >
            Start test
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[current]!;
  const answeredCount = Object.keys(answers).length;
  const low = secondsLeft <= 60;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold md:text-xl">{test.title}</h1>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-lg font-semibold tabular-nums",
            low
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border bg-card text-foreground",
          )}
          aria-live="polite"
        >
          {low ? <AlertTriangle className="size-4" /> : <Timer className="size-4" />}
          {formatTime(secondsLeft)}
        </div>
      </div>

      <Progress value={(answeredCount / questions.length) * 100} className="mt-4 h-2" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question {current + 1} of {questions.length}
          </p>
          <h2 className="mt-2 text-base font-medium md:text-lg">{q.body}</h2>

          <div className="mt-5 space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
              >
                <ChevronLeft className="mr-1 size-4" /> Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setAnswers((prev) => {
                    const next = { ...prev };
                    delete next[q.id];
                    return next;
                  })
                }
              >
                Clear
              </Button>
            </div>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button onClick={() => submit()} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit test"}
              </Button>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold">Question palette</h3>
          <div className="mt-3 grid grid-cols-6 gap-2 lg:grid-cols-5">
            {questions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(i)}
                className={cn(
                  "aspect-square rounded-md border text-xs font-semibold transition-colors",
                  i === current && "ring-2 ring-ring ring-offset-1",
                  answers[item.id] !== undefined
                    ? "border-transparent bg-success text-success-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() => submit()}
            disabled={submitting}
          >
            Submit test
          </Button>
        </aside>
      </div>
    </div>
  );
}
