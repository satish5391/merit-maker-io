import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock, FileText, Plus, Repeat, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTests, fetchStudentAttempts, type Test } from "@/lib/mock-test";
import { getStudentName } from "@/lib/student";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TestPrep — Free Online Mock Tests & Instant Scorecards" },
      {
        name: "description",
        content:
          "Attempt timed mock tests with negative marking and get an instant scorecard with score, accuracy, rank and percentile.",
      },
      { property: "og:title", content: "TestPrep — Free Online Mock Tests" },
      {
        property: "og:description",
        content: "Timed mock tests with instant rank, percentile and performance comparison.",
      },
    ],
  }),
  component: Home,
});

type TestWithStats = Test & { questionCount: number; attemptCount: number };

async function fetchTestsWithStats(): Promise<TestWithStats[]> {
  const tests = await fetchTests();
  const [{ data: qs }, { data: as }] = await Promise.all([
    supabase.from("questions").select("test_id"),
    supabase.from("attempts").select("test_id"),
  ]);
  return tests.map((t) => ({
    ...t,
    questionCount: (qs ?? []).filter((q) => q.test_id === t.id).length,
    attemptCount: (as ?? []).filter((a) => a.test_id === t.id).length,
  }));
}

function Home() {
  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests-with-stats"],
    queryFn: fetchTestsWithStats,
  });

  const [student, setStudent] = useState("");
  useEffect(() => setStudent(getStudentName()), []);

  const { data: myAttempts } = useQuery({
    queryKey: ["my-attempts", student],
    queryFn: () => fetchStudentAttempts(student),
    enabled: student.length > 0,
  });

  return (
    <div>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <Badge className="mb-4 bg-white/15 text-primary-foreground hover:bg-white/20">
            Practice like the real exam
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary-foreground md:text-5xl">
            Mock tests with real ranks, not just right answers
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
            Timed papers, negative marking, auto-submit and an instant scorecard with accuracy,
            rank, percentile and a comparison graph against every other student.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <a href="#tests">Browse tests</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
            >
              <Link to="/admin">
                <Plus className="mr-1 size-4" /> Admin dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="tests" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-xl font-semibold md:text-2xl">Available mock tests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a paper and start whenever you're ready. The timer starts on the first question.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {isLoading &&
            [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}

          {tests?.map((t) => {
            const used = (myAttempts ?? []).filter((a) => a.test_id === t.id).length;
            const limitReached = t.max_attempts !== null && used >= t.max_attempts;
            return (
            <article
              key={t.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <Badge variant="secondary" className="w-fit">
                {t.subject}
              </Badge>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{t.title}</h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" /> {t.duration_minutes} min
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4" /> {t.questionCount} questions
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="size-4" /> +{t.positive_marks} / −{t.negative_marks}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4" /> {t.attemptCount} attempts
                </div>
              </dl>
              <div className="mt-3">
                <Badge variant={limitReached ? "destructive" : "outline"} className="w-fit">
                  <Repeat className="mr-1 size-3" />
                  Attempts: {used}/{t.max_attempts === null ? "∞" : t.max_attempts}
                </Badge>
              </div>

              {limitReached ? (
                <Button className="mt-5 w-full" disabled>
                  Attempt limit reached
                </Button>
              ) : (
                <Button asChild className="mt-5 w-full" disabled={t.questionCount === 0}>
                  <Link to="/test/$testId" params={{ testId: t.id }}>
                    {t.questionCount === 0
                      ? "No questions yet"
                      : used > 0
                        ? "Retake test"
                        : "Take test"}
                  </Link>
                </Button>
              )}
            </article>
            );
          })}

          {tests && tests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tests yet — create one from the admin dashboard.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
