import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock3, Radio, Timer } from "lucide-react";
import { fetchTests, type Test } from "@/lib/mock-test";
import { getAttemptHistory, getCompletedTests } from "@/lib/attempt-history";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isSupabaseUserId } from "@/lib/utils";

export const Route = createFileRoute("/live-tests")({
  component: LiveTestsPage,
  head: () => ({ meta: [{ title: "Live Tests — Rankdon" }] }),
});

function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function LiveTestCard({
  test,
  now,
  upcoming,
  submittedAttemptId,
}: {
  test: Test;
  now: number;
  upcoming?: boolean;
  submittedAttemptId?: string;
}) {
  const [reminded, setReminded] = useState(false);
  const end = test.end_time ? new Date(test.end_time).getTime() : 0;
  const start = test.start_time ? new Date(test.start_time).getTime() : 0;

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{test.category}</Badge>
            <Badge variant="secondary">{test.subject}</Badge>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">{test.title}</h2>
        </div>
        <Radio className={upcoming ? "size-5 text-amber-500" : "size-5 text-emerald-500"} />
      </div>
      {upcoming ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Starts on {new Date(start).toLocaleString()}
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-2 font-mono text-lg font-semibold text-emerald-700">
          <Timer className="size-4" />
          Ends in {formatCountdown(end - now)}
        </div>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        {test.duration_minutes} minutes ·{" "}
        {test.max_attempts === null ? "Unlimited attempts" : `${test.max_attempts ?? 1} attempt`}
      </p>
      {upcoming ? (
        <Button
          variant={reminded ? "secondary" : "outline"}
          className="mt-5 gap-2"
          onClick={() => {
            setReminded(true);
            window.localStorage.setItem(`live-reminder-${test.id}`, "true");
          }}
        >
          <Bell className="size-4" />
          {reminded ? "Reminder set" : "Remind Me"}
        </Button>
      ) : submittedAttemptId ? (
        <Button asChild variant="secondary" className="mt-5">
          <Link to="/result/$attemptId" params={{ attemptId: submittedAttemptId }}>
            View Summary
          </Link>
        </Button>
      ) : (
        <Button asChild className="mt-5">
          <Link to="/test/$testId" params={{ testId: test.id }}>
            Start Test
          </Link>
        </Button>
      )}
    </article>
  );
}

function LiveTestsPage() {
  const { user } = useAuth();
  const supabaseUserId = isSupabaseUserId(user?.id) ? user.id : null;
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["live-tests"],
    queryFn: fetchTests,
  });
  const { data: submittedAttempts = [] } = useQuery({
    queryKey: ["live-test-submissions", supabaseUserId],
    enabled: Boolean(supabaseUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id, test_id, created_at, status")
        .eq("user_id", supabaseUserId!)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [localCompleted, setLocalCompleted] = useState<Record<string, string>>({});
  useEffect(() => setLocalCompleted(getCompletedTests()), []);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const liveTests = useMemo(
    () => tests.filter((test) => test.is_live && test.start_time && test.end_time),
    [tests],
  );
  const submittedByTest = useMemo(() => {
    const result = { ...localCompleted };
    for (const attempt of submittedAttempts)
      if (!result[attempt.test_id]) result[attempt.test_id] = attempt.id;
    if (!user?.id)
      for (const attempt of getAttemptHistory())
        if (!result[attempt.testId]) result[attempt.testId] = attempt.attemptId;
    return result;
  }, [localCompleted, submittedAttempts, user?.id]);
  const active = liveTests.filter(
    (test) =>
      new Date(test.start_time!).getTime() <= now &&
      new Date(test.end_time!).getTime() > now &&
      !submittedByTest[test.id],
  );
  const upcoming = liveTests.filter(
    (test) => new Date(test.start_time!).getTime() > now && !submittedByTest[test.id],
  );
  const completed = liveTests.filter(
    (test) => new Date(test.end_time!).getTime() <= now || Boolean(submittedByTest[test.id]),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600">
            <span className="size-2 animate-pulse rounded-full bg-rose-500" /> Live Tests
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Compete while the clock is running
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join scheduled tests, submit within the live window, and see full analysis after results
            are declared.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Browse all tests</Link>
        </Button>
      </div>
      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading live tests...</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Radio className="size-5 text-emerald-600" />
              <h2 className="font-display text-xl font-semibold">Active Now</h2>
              <Badge variant="secondary">{active.length}</Badge>
            </div>
            {active.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {active.map((test) => (
                  <LiveTestCard key={test.id} test={test} now={now} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Radio className="size-5" />}
                text="No live tests are running right now."
              />
            )}
          </section>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="size-5 text-amber-600" />
              <h2 className="font-display text-xl font-semibold">Upcoming</h2>
              <Badge variant="secondary">{upcoming.length}</Badge>
            </div>
            {upcoming.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((test) => (
                  <LiveTestCard key={test.id} test={test} now={now} upcoming />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock3 className="size-5" />}
                text="No upcoming live tests are scheduled."
              />
            )}
          </section>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-slate-500" />
              <h2 className="font-display text-xl font-semibold">Completed</h2>
              <Badge variant="secondary">{completed.length}</Badge>
            </div>
            {completed.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {completed.map((test) => (
                  <article key={test.id} className="rounded-xl border border-border bg-card p-5">
                    <Badge variant="secondary">
                      {submittedByTest[test.id] ? "Submitted" : "Results pending or declared"}
                    </Badge>
                    <h2 className="mt-3 font-display text-xl font-semibold">{test.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Live window ended {new Date(test.end_time!).toLocaleString()}. Results are
                      available according to the declaration schedule.
                    </p>
                    {submittedByTest[test.id] ? (
                      <Button asChild variant="outline" className="mt-5">
                        <Link
                          to="/result/$attemptId"
                          params={{ attemptId: submittedByTest[test.id] }}
                        >
                          View Summary
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="mt-5">
                        <Link to="/">Return to dashboard</Link>
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="size-5" />}
                text="Your completed live tests will appear here."
              />
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}
