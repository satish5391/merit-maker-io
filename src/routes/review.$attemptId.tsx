import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Lightbulb, MinusCircle, XCircle } from "lucide-react";
import { fetchAttempt, fetchQuestions, fetchTest } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review/$attemptId")({
  head: () => ({
    meta: [
      { title: "Detailed Analysis — Question-wise Review | TestPrep" },
      {
        name: "description",
        content:
          "Review every question of your attempt: your selected option, the correct answer and the full solution explanation.",
      },
      { property: "og:title", content: "Detailed Test Analysis — TestPrep" },
      {
        property: "og:description",
        content: "Question-wise review with correct answers and solution explanations.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { attemptId } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["review", attemptId],
    queryFn: async () => {
      const attempt = await fetchAttempt(attemptId);
      const [test, questions] = await Promise.all([
        fetchTest(attempt.test_id),
        fetchQuestions(attempt.test_id),
      ]);
      return { attempt, test, questions };
    },
  });

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading analysis…</div>
    );
  }

  const { attempt, test, questions } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap gap-2">
        <Badge>{test.category}</Badge>
        <Badge variant="secondary">{test.subject}</Badge>
      </div>
      <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">
        Detailed analysis — {test.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {attempt.student_name} · {new Date(attempt.created_at).toLocaleString()} ·{" "}
        {Number(attempt.score)}/{Number(attempt.max_score)} marks · {Number(attempt.accuracy)}%
        accuracy
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1 text-success">
          <CheckCircle2 className="size-4" /> {attempt.correct_count} correct
        </span>
        <span className="inline-flex items-center gap-1 text-destructive">
          <XCircle className="size-4" /> {attempt.wrong_count} wrong
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MinusCircle className="size-4" /> {attempt.skipped_count} skipped
        </span>
      </div>

      <div className="mt-8 space-y-5">
        {questions.map((q, qi) => {
          const selected = attempt.answers[q.id];
          const skipped = selected === undefined;
          const isCorrect = selected === q.correct_index;
          return (
            <article
              key={q.id}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question {qi + 1}
                </p>
                <Badge
                  variant={skipped ? "secondary" : isCorrect ? "default" : "destructive"}
                  className={cn(!skipped && isCorrect && "bg-success text-success-foreground")}
                >
                  {skipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                </Badge>
              </div>
              <h2 className="mt-2 text-base font-medium">{q.body}</h2>

              <ul className="mt-4 space-y-2">
                {q.options.map((opt, oi) => {
                  const isAnswer = oi === q.correct_index;
                  const isPicked = oi === selected;
                  const wrongPick = isPicked && !isAnswer;
                  return (
                    <li
                      key={oi}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-sm",
                        isAnswer && "border-success bg-success/10",
                        wrongPick && "border-destructive bg-destructive/10",
                        !isAnswer && !wrongPick && "border-border bg-background",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          isAnswer && "border-transparent bg-success text-success-foreground",
                          wrongPick &&
                            "border-transparent bg-destructive text-destructive-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isPicked && (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isAnswer ? "text-success" : "text-destructive",
                          )}
                        >
                          Your answer
                        </span>
                      )}
                      {isAnswer && !isPicked && (
                        <span className="text-xs font-medium text-success">Correct answer</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="solution" className="border-none">
                  <AccordionTrigger className="rounded-lg bg-muted px-3 py-2 text-sm font-medium hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-primary" /> Solution &amp; explanation
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-3 text-sm leading-relaxed text-muted-foreground">
                    {q.explanation?.trim()
                      ? q.explanation
                      : "No explanation was added for this question."}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/result/$attemptId" params={{ attemptId: attempt.id }}>
            Back to scorecard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/history">My history</Link>
        </Button>
      </div>
    </div>
  );
}
