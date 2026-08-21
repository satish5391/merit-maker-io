import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { TriangleAlert as AlertTriangle, ChevronLeft, ChevronRight, Timer, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import { fetchQuestions, fetchTest, fetchStudentAttempts } from "@/lib/mock-test";
import { getStudentName, setStudentName } from "@/lib/student";
import { saveAttemptToHistory } from "@/lib/attempt-history";
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

  const { data: test, isLoading: isLoadingTest } = useQuery({ queryKey: ["test", testId], queryFn: () => fetchTest(testId) });
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });

  // consume auth reactively from context
  const { user } = useAuth();

  // loading / null guards to avoid rendering when test data isn't ready
  if (isLoadingTest || isLoadingQuestions || !test) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading test…</div>;
  }

  const [name, setName] = useState("");
  useEffect(() => {
    const stored = getStudentName();
    if (stored) setName(stored);
  }, []);

  const { data: myAttempts } = useQuery({
    queryKey: ["my-attempts", name.trim()],
    queryFn: () => fetchStudentAttempts(name.trim()),
    enabled: name.trim().length > 0,
  });
  const usedAttempts = (myAttempts ?? []).filter((a) => a.test_id === testId).length;
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sectionSecondsLeft, setSectionSecondsLeft] = useState<number | null>(null);
  const [sectionSubmitted, setSectionSubmitted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);

  // Defensive parse sections
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

  // If no sections defined, fallback to single default section
  const effectiveSections = useMemo(() => {
    if (sections.length > 0) return sections;
    return [
      {
        id: "section-default",
        name: test?.title ?? "Section",
        duration_minutes: test?.duration_minutes ?? 0,
      },
    ];
  }, [sections, test]);

  // Map questions to sections safely
  const sectionQuestionMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of effectiveSections) map[s.id] = [];
    const qs = Array.isArray(questions) ? questions : [];
    for (const qq of qs) {
      const sid = (qq as any).section_id ?? effectiveSections[0].id;
      if (!map[sid]) map[effectiveSections[0].id].push(qq);
      else map[sid].push(qq);
    }
    return map;
  }, [effectiveSections, questions]);

  // ordered questions and section start indices
  const { orderedQuestions, sectionStartIndex } = useMemo(() => {
    const o: any[] = [];
    const starts: number[] = [];
    for (let si = 0; si < effectiveSections.length; si++) {
      starts.push(o.length);
      o.push(...(sectionQuestionMap[effectiveSections[si].id] ?? []));
    }
    return { orderedQuestions: o, sectionStartIndex: starts };
  }, [effectiveSections, sectionQuestionMap]);

  function getSectionStartIndex(index: number) {
    return sectionStartIndex[index] ?? -1;
  }

  // submit callback (after orderedQuestions computed)
  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current || !test || !orderedQuestions) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        let correct = 0;
        let wrong = 0;
        let skipped = 0;
        for (const q of orderedQuestions) {
          const a = answers[q.id];
          if (a === undefined) skipped += 1;
          else if (a === q.correct_index) correct += 1;
          else wrong += 1;
        }
        const score = correct * Number(test.positive_marks) - wrong * Number(test.negative_marks);
        const attempted = correct + wrong;
        const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10;
        const timeTaken = test.duration_minutes * 60 - secondsLeft;

        // resolve user id by checking Supabase session then fallback to context user
        const { data: { session } = {} } = await supabase.auth.getSession();
        const resolvedUserId = session?.user?.id ?? (user ? user.id : null);

        // if the test requires login, stop and prompt auth instead of saving anonymously
        const loginRequired = Boolean((test as any)?.require_login || (test as any)?.login_required);
        if (loginRequired && !resolvedUserId) {
          try {
            const auth = require('@/context/AuthContext');
            const ctx = auth.useAuth ? auth.useAuth() : null;
            ctx?.openAuthModal?.();
          } catch (e) {
            // ignore
          }
          toast.error('Please sign in to submit this test');
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }

       // 1. Defensively resolve current user session
        const currentUserId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id || null;
        const studentIdentifier = user?.email || name.trim() || 'Student';

        const insertPayload = {
          test_id: test.id,
          user_id: currentUserId, // Guarantees authenticated UUID is attached
          student_name: studentIdentifier,
          score: Math.round(score * 100) / 100,
          max_score: orderedQuestions.length * Number(test.positive_marks),
          correct_count: correct,
          wrong_count: wrong,
          skipped_count: skipped,
          accuracy,
          time_taken_seconds: Math.max(0, timeTaken),
          answers,
        };

        const { data, error } = await supabase
          .from("attempts")
          .insert([insertPayload])
          .select()
          .single();

        if (error) {
          console.error("Failed to save attempt to Supabase:", error);
          throw error;
        }

        if (data) {
          saveAttemptToHistory({
            id: data.id,
            test_id: data.test_id,
            score: Number(data.score),
            max_score: Number(data.max_score),
            accuracy: Number(data.accuracy),
            created_at: data.created_at,
            testTitle: test.title,
            category: test.category,
          });
        }
        if (auto) toast.info("Time's up — your test was submitted automatically.");
        navigate({ to: "/result/$attemptId", params: { attemptId: data.id } });
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(e instanceof Error ? e.message : "Could not submit test");
      }
    },
    [answers, name, navigate, orderedQuestions, secondsLeft, test],
  );

useEffect(() => {
    if (!started || isPaused) return;

    const id = setInterval(() => {
      // 1. Handle overall test timer
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          void submit(true);
          return 0;
        }
        return s - 1;
      });

      // 2. Handle section timer if present
      if (sectionSecondsLeft !== null) {
        setSectionSecondsLeft((ss) => {
          if (ss === null) return null;
          if (ss <= 1) {
            // Section expired -> submit section and advance
            const secs = effectiveSections;
            const sec = secs[currentSection];
            if (sec) {
              setSectionSubmitted((m) => ({ ...m, [sec.id]: true }));
              const nextIndex = currentSection + 1;
              if (nextIndex < secs.length) {
                setCurrentSection(nextIndex);
                const next = secs[nextIndex];
                setSectionSecondsLeft(next?.duration_minutes ? next.duration_minutes * 60 : null);
                
                const start = getSectionStartIndex(nextIndex);
                if (start !== -1) setCurrent(start);
              } else {
                void submit(true);
              }
            }
            return 0;
          }
          return ss - 1;
        });
      }
    }, 1000);

    return () => clearInterval(id);
  }, [
    started,
    isPaused,
    sectionSecondsLeft,
    currentSection,
    effectiveSections,
    getSectionStartIndex,
    submit,
  ]);
  useEffect(() => {
    if (!started || !orderedQuestions?.length) return;
    const q = orderedQuestions[current];
    if (!q) return;
    setVisited((v) => ({ ...v, [q.id]: true }));
  }, [current, started, orderedQuestions]);

  // active section and questions derived from computed memos
  const activeSection = effectiveSections[currentSection] ?? effectiveSections[0];
  const activeSectionQuestions = sectionQuestionMap[activeSection?.id ?? effectiveSections[0].id] ?? [];

  if (!test || !questions) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading test…</div>;
  }

  const limitReached =
    test.max_attempts !== null && name.trim().length > 0 && usedAttempts >= test.max_attempts;

  if (!started) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <Badge variant="secondary">{test.subject}</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold">{test.title}</h1>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{orderedQuestions.length} questions · {test.duration_minutes} minutes</li>
            <li>+{test.positive_marks} for each correct answer</li>
            <li>−{test.negative_marks} for each wrong answer</li>
            <li>The test auto-submits when the timer hits zero.</li>
            <li>
              {test.max_attempts === null
                ? "Unlimited attempts allowed."
                : `Attempts: ${usedAttempts}/${test.max_attempts}`}
            </li>
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
            disabled={limitReached}
              onClick={() => {
              if (limitReached) return;
              setStudentName(name.trim());
              setSecondsLeft(test.duration_minutes * 60);
              const sectionalEnabled = !!(test as any)?.sectional_timing;
              if (sectionalEnabled) {
                const first = sections[0];
                setSectionSecondsLeft(first?.duration_minutes ? first.duration_minutes * 60 : null);
              } else {
                setSectionSecondsLeft(null);
              }
              setStarted(true);
            }}
          >
            {limitReached ? "Attempt limit reached" : usedAttempts > 0 ? "Retake test" : "Start test"}
          </Button>
        </div>
      </div>
    );
  }

  const q = orderedQuestions[current]!;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = orderedQuestions.length;
  const warning = secondsLeft <= 120 && secondsLeft > 0; // below 2 minutes
  const critical = secondsLeft <= 60 && secondsLeft > 0; // below 1 minute

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="font-display text-lg font-semibold md:text-xl">{test.title}</h1>
          <p className="text-xs text-muted-foreground">{answeredCount} of {totalQuestions} answered</p>
        </div>

<div className="flex items-center gap-3">
          {/* palette toggle for small screens */}
          <button
            className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm hover:bg-muted"
            onClick={() => setPaletteOpen((s) => !s)}
            aria-expanded={paletteOpen}
            aria-controls="question-palette"
          >
            <Flag className="size-4" />
            <span className="hidden sm:inline">Questions</span>
          </button>

          {/* Pause Test Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(true)}
            className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-300 text-xs font-semibold h-10 px-3"
          >
            Pause Test
          </Button>

          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-lg font-semibold tabular-nums",
              critical
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-card text-foreground",
            )}
            aria-live="polite"
          >
            {critical ? <AlertTriangle className="size-4" /> : <Timer className="size-4" />}
            {formatTime(secondsLeft)}
          </div>
        </div>
      </div>

      {warning && (
        <div className="mt-3 rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="inline-block mr-2 align-middle" /> Less than 2 minutes remaining — finish soon. The test will auto-submit when time runs out.
        </div>
      )}

      <Progress value={(answeredCount / Math.max(1, totalQuestions)) * 100} className="mt-4 h-2" />

      {/* Section tabs */}
      <div className="mt-4 flex gap-2 overflow-auto">
        {sections.map((s, si) => {
          const start = getSectionStartIndex(si);
          const count = (sectionQuestionMap[s.id] ?? []).length;
          const submitted = Boolean(sectionSubmitted[s.id]);
          const disabled = Boolean((test as any)?.sectional_timing) && si !== currentSection && !submitted;
          return (
            <button
              key={s.id}
              onClick={() => {
                // only allow switching when sectional timing is off or moving to current/next allowed
                const sectionalEnabled = !!(test as any)?.sectional_timing;
                if (sectionalEnabled && si !== currentSection) return;
                setCurrentSection(si);
                const gs = getSectionStartIndex(si);
                if (gs !== -1) setCurrent(gs);
              }}
              className={cn("px-3 py-1 rounded-md text-sm font-medium", si === currentSection ? "bg-muted" : "bg-background")}
              disabled={disabled}
            >
              {s.name} · {count}
              {submitted && <span className="ml-2 text-xs text-muted-foreground">(submitted)</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question {current - getSectionStartIndex(currentSection) + 1} of {activeSectionQuestions.length}
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
            {current < totalQuestions - 1 ? (
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

        <aside
          id="question-palette"
          className={cn(
            "rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]",
            "lg:block",
            paletteOpen ? "block" : "hidden",
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Question palette</h3>
            <div className="text-xs text-muted-foreground">{answeredCount}/{totalQuestions}</div>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2 lg:grid-cols-5">
            {activeSectionQuestions.map((item, i) => {
              const isVisited = Boolean(visited[item.id]);
              const isMarked = Boolean(marked[item.id]);
              const isAnswered = answers[item.id] !== undefined;
              const globalIndex = getSectionStartIndex(currentSection) + i;

              // priority: marked+answered -> marked-with-dot, marked -> purple, answered -> green, visited-not-answered -> red, not visited -> gray
              let classes = "aspect-square rounded-md border text-xs font-semibold transition-colors relative";
              if (isMarked && isAnswered) classes += " bg-violet-600 text-white";
              else if (isMarked) classes += " bg-violet-600 text-white";
              else if (isAnswered) classes += " border-transparent bg-success text-success-foreground";
              else if (isVisited) classes += " border-transparent bg-destructive text-destructive-foreground";
              else classes += " border-border bg-background text-muted-foreground";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(globalIndex)}
                  className={cn(classes, globalIndex === current && "ring-2 ring-ring ring-offset-1")}
                  title={`Question ${i + 1}`}
                >
                  {i + 1}
                  {isMarked && isAnswered && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                  )}
                  {isMarked && !isAnswered && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white/30" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <Button className="w-full" variant="outline" onClick={() => submit()} disabled={submitting}>
              Submit test
            </Button>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block h-3 w-3 rounded-sm bg-violet-600" /> Marked for review
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block h-3 w-3 rounded-sm bg-success" /> Answered
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom action bar */}
      <div className="fixed left-0 right-0 bottom-4 z-50 mx-auto max-w-5xl px-4">
        <div className="rounded-xl bg-background/80 backdrop-blur-md border border-border p-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Save & Next (within section when sectional timing enabled)
                  const sectionalEnabled = !!(test as any)?.sectional_timing;
                  const si = currentSection;
                  const start = getSectionStartIndex(si);
                  const end = start + (sectionQuestionMap[sections[si].id]?.length ?? 1) - 1;
                  if (sectionSubmitted[activeSection.id]) return;
                  if (current < (sectionalEnabled ? end : totalQuestions - 1)) setCurrent((c) => c + 1);
                }}
              >
                Save &amp; Next
              </Button>
              <Button
                onClick={() => {
                  // Mark for review & Next (within section)
                  if (sectionSubmitted[activeSection.id]) return;
                  const id = q.id;
                  setMarked((m) => ({ ...m, [id]: true }));
                  const sectionalEnabled = !!(test as any)?.sectional_timing;
                  const si = currentSection;
                  const start = getSectionStartIndex(si);
                  const end = start + (sectionQuestionMap[sections[si].id]?.length ?? 1) - 1;
                  if (current < (sectionalEnabled ? end : totalQuestions - 1)) setCurrent((c) => c + 1);
                }}
                variant="outline"
              >
                Mark for Review &amp; Next
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (sectionSubmitted[activeSection.id]) return;
                  setAnswers((prev) => {
                    const next = { ...prev };
                    delete next[q.id];
                    return next;
                  });
                }}
              >
                Clear Response
              </Button>
              {((test as any)?.sectional_timing) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (sectionSubmitted[activeSection.id]) return;
                    const si = currentSection;
                    const sec = sections[si];
                    setSectionSubmitted((m) => ({ ...m, [sec.id]: true }));
                    const nextIndex = si + 1;
                    if (nextIndex < sections.length) {
                      setCurrentSection(nextIndex);
                      const nextStart = getSectionStartIndex(nextIndex);
                      if (nextStart !== -1) setCurrent(nextStart);
                      const next = sections[nextIndex];
                      setSectionSecondsLeft(next?.duration_minutes ? next.duration_minutes * 60 : null);
                    } else {
                      void submit(false);
                    }
                  }}
                >
Submit Section &amp; Next Section
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const sectionalEnabled = !!(test as any)?.sectional_timing;
                  const si = currentSection;
                  const start = getSectionStartIndex(si);
                  if (sectionalEnabled) setCurrent((c) => Math.max(start, c - 1));
                  else setCurrent((c) => Math.max(0, c - 1));
                }}
              >
                <ChevronLeft className="mr-1 size-4" /> Prev
              </Button>
              <Button
                onClick={() => {
                  const sectionalEnabled = !!(test as any)?.sectional_timing;
                  const si = currentSection;
                  const start = getSectionStartIndex(si);
                  const end = start + (sectionQuestionMap[sections[si].id]?.length ?? 1) - 1;
                  if (sectionalEnabled) {
                    if (current < end) setCurrent((c) => c + 1);
                  } else {
                    if (current < totalQuestions - 1) setCurrent((c) => c + 1);
                    else submit();
                  }
                }}
              >
                {(() => {
                  const sectionalEnabled = !!(test as any)?.sectional_timing;
                  const si = currentSection;
                  const start = getSectionStartIndex(si);
                  const end = start + (sectionQuestionMap[sections[si].id]?.length ?? 1) - 1;
                  if (sectionalEnabled) return <span>Next <ChevronRight className="ml-1 size-4" /></span>;
                  return current < totalQuestions - 1 ? <span>Next <ChevronRight className="ml-1 size-4" /></span> : <span>{submitting ? "Submitting…" : "Submit test"}</span>;
                })()}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pause Overlay Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Test Paused</h3>
            <p className="text-xs text-slate-500 mt-2 mb-5 leading-relaxed">
              Your countdown timer is halted. Questions are hidden until you resume.
            </p>
            <Button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-sm rounded-xl"
            >
              Resume Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}