import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  TriangleAlert as AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Timer,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { fetchQuestions, fetchTest } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, isSupabaseUserId } from "@/lib/utils";
import { clearTestSession } from "@/lib/test-session";

export const Route = createFileRoute("/test/$testId")({
  head: () => ({
    meta: [
      { title: "Attempt Mock Test — Timed Exam | Rankdon" },
      {
        name: "description",
        content:
          "Attempt a timed mock test with a live countdown, question palette and automatic submission when time runs out.",
      },
      { property: "og:title", content: "Attempt Mock Test — Rankdon" },
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

function formatDuration(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const maxViolations = 3;

function TestPage() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile: userProfile } = useAuth();
  const supabaseUserId = isSupabaseUserId(user?.id) ? user.id : null;

  const { data: databaseProfile } = useQuery({
    queryKey: ["profile-access", supabaseUserId],
    enabled: Boolean(supabaseUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("has_free_pass, free_pass_expires_at")
        .eq("id", supabaseUserId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const hasFreePass = Boolean(
    (databaseProfile?.has_free_pass ?? userProfile?.has_free_pass) &&
      (!(databaseProfile?.free_pass_expires_at ?? userProfile?.free_pass_expires_at) ||
        new Date(
          databaseProfile?.free_pass_expires_at ?? userProfile?.free_pass_expires_at!,
        ).getTime() > Date.now()),
  );

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => fetchTest(testId),
  });

  const { data: questions } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });

  const [name, setName] = useState("");
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
  const [isPaused, setIsPaused] = useState(false);
  const [sectionAlertOpen, setSectionAlertOpen] = useState(false);
  const [sectionSummaryOpen, setSectionSummaryOpen] = useState(false);
  const [finalSummaryOpen, setFinalSummaryOpen] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const submittedRef = useRef(false);
  const violationsCountRef = useRef(0);

  const resetTestState = useCallback(() => {
    setAnswers({});
    setMarked({});
    setVisited({});
    setCurrent(0);
    setCurrentSection(0);
    setSectionSubmitted({});
    setIsPaused(false);
    setSectionSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (name.trim()) return;
    const defaultName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      (userProfile as any)?.full_name ||
      userProfile?.name ||
      (user?.email ? user.email.split("@")[0] : "") ||
      "";
    if (defaultName) setName(defaultName);
  }, [name, user?.email, user?.user_metadata, userProfile]);

  const { data: userAttempts = [], isLoading: isLoadingUserAttempts } = useQuery({
    queryKey: ["test-user-attempts", supabaseUserId, testId],
    queryFn: async () => {
      if (!supabaseUserId) return [];
      const { data, error } = await supabase
        .from("attempts")
        .select("*")
        .eq("user_id", supabaseUserId)
        .eq("test_id", testId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(supabaseUserId && testId),
  });

  const { data: packageAccess, isLoading: isLoadingPackageAccess } = useQuery({
    queryKey: ["package-access", user?.id, testId],
    queryFn: async () => {
      if (hasFreePass) return true;
      if (!supabaseUserId || !testId) return false;
      const [
        { data: purchases, error: purchasesError },
        { data: packageLinks, error: linksError },
      ] = await Promise.all([
        supabase
          .from("user_purchases")
          .select("item_id")
          .eq("user_id", supabaseUserId)
          .eq("item_type", "package")
          .eq("payment_status", "completed"),
        supabase.from("package_tests").select("package_id").eq("test_id", testId),
      ]);
      if (purchasesError) throw purchasesError;
      if (linksError) throw linksError;
      const purchasedPackageIds = new Set((purchases ?? []).map((purchase) => purchase.item_id));
      return (packageLinks ?? []).some((link) => purchasedPackageIds.has(link.package_id));
    },
    enabled: Boolean(supabaseUserId && test?.access_type === "package_only" && testId),
  });

  const effectiveAttemptCount = user ? userAttempts.length : 0;
  const maxAllowedAttempts = test?.max_attempts || 1;
  const completedDatabaseAttempt = userAttempts.find(
    (attempt) => (attempt as any).status !== "in_progress",
  );
  const completedAttemptId = completedDatabaseAttempt?.id;
  const isCheckingCompletedAttempt = isLoadingUserAttempts;
  const isLive = Boolean((test as any)?.is_live);

  useEffect(() => {
    if (isLive && !isCheckingCompletedAttempt && completedAttemptId) {
      void navigate({ to: "/live-tests", replace: true });
    }
  }, [completedAttemptId, isCheckingCompletedAttempt, isLive, navigate, testId, user?.id]);

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
      {
        id: "section-default",
        name: test?.title ?? "Section",
        duration_minutes: test?.duration_minutes ?? 0,
      },
    ];
  }, [sections, test]);

  const sectionQuestionMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of effectiveSections) map[s.id] = [];
    const qs = Array.isArray(questions) ? questions : [];
    for (const qq of qs) {
      const fallbackSectionId = effectiveSections[0]?.id ?? "section-default";
      const sid = (qq as any).section_id ?? fallbackSectionId;
      if (!map[sid]) map[fallbackSectionId]?.push(qq);
      else map[sid].push(qq);
    }
    return map;
  }, [effectiveSections, questions]);

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
        const timeTaken = (test.duration_minutes ?? 0) * 60 - secondsLeft;

        if (!user?.id || !isSupabaseUserId(user.id)) {
          toast.error("Please sign in to submit this test");
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }

        const studentIdentifier = user?.email || name.trim() || "Student";
        const integrityStatus: "clean" | "flagged" =
          violationsCountRef.current > 0 ? "flagged" : "clean";
        const insertPayload = {
          test_id: test.id,
          user_id: user.id,
          student_name: studentIdentifier || (user as any)?.full_name || "Student",
          score: Math.round(score * 100) / 100,
          max_score: orderedQuestions.length * Number(test.positive_marks),
          correct_count: correct,
          wrong_count: wrong,
          skipped_count: skipped,
          accuracy,
          time_taken_seconds: Math.max(0, timeTaken),
          answers,
          tab_switches_count: violationsCountRef.current,
          integrity_status: integrityStatus,
          status: "completed" as const,
        };

        const { data: remoteAttempt, error } = await (supabase as any)
          .from("attempts")
          .insert([insertPayload])
          .select("id")
          .single();
        if (error || !remoteAttempt?.id) throw error ?? new Error("Could not save attempt.");
        if (auto) toast.info("Time's up — your test was submitted automatically.");
        setStarted(false);
        setIsPaused(false);
        clearTestSession(testId, user.id);
        navigate({ to: "/result/$attemptId", params: { attemptId: String(remoteAttempt.id) } });
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(e instanceof Error ? e.message : "Could not submit test");
      }
    },
    [answers, name, navigate, orderedQuestions, secondsLeft, test, testId, user],
  );

  const sectionalTimingEnabled =
    !isLive && Boolean((test as any)?.sectional_timing || (test as any)?.has_sectional_timing);

  useEffect(() => {
    if (!started || (!isLive && isPaused)) return;

    const id = setInterval(() => {
      const tick = (remaining: number) => {
        if (remaining <= 1) {
          clearInterval(id);
          if (sectionalTimingEnabled && sectionSecondsLeft !== null) {
            const nextSection = currentSection + 1;
            const expiredSection = effectiveSections[currentSection];
            if (expiredSection)
              setSectionSubmitted((submitted) => ({ ...submitted, [expiredSection.id]: true }));
            if (nextSection < effectiveSections.length) {
              setCurrentSection(nextSection);
              setCurrent(getSectionStartIndex(nextSection));
              const next = effectiveSections[nextSection];
              setSectionSecondsLeft(
                Number(next?.duration_minutes ?? next?.duration ?? 0) * 60 || null,
              );
            } else {
              void submit(true);
            }
          } else {
            void submit(true);
          }
          return 0;
        }
        return remaining - 1;
      };
      if (sectionalTimingEnabled && sectionSecondsLeft !== null) {
        setSectionSecondsLeft((remaining: number | null) =>
          remaining === null ? null : tick(remaining),
        );
      } else {
        setSecondsLeft(tick);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [
    started,
    isPaused,
    isLive,
    sectionalTimingEnabled,
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

  useEffect(() => {
    if (!started) return;
    const maxIndex = Math.max((orderedQuestions?.length ?? 0) - 1, 0);
    if (current < 0 || current > maxIndex) {
      setCurrent(Math.max(0, Math.min(current, maxIndex)));
    }
  }, [started, current, orderedQuestions?.length]);

  const activeSection = effectiveSections[currentSection] ?? effectiveSections[0];
  const activeSectionQuestions =
    sectionQuestionMap[activeSection?.id ?? effectiveSections[0].id] ?? [];

  useEffect(() => {
    if (!started) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (!isLive) setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isLive, started]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const fullscreen = document.fullscreenElement !== null;
      setIsFullscreen(fullscreen);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!started) return;

    let visibilityHandled = false;
    const handleViolation = () => {
      if (!document.hidden || visibilityHandled || submittedRef.current) return;
      visibilityHandled = true;
      const nextCount = violationsCountRef.current + 1;
      violationsCountRef.current = nextCount;
      setViolationsCount(nextCount);

      if (nextCount >= maxViolations) {
        window.alert("Your exam has been automatically submitted due to multiple tab-switch violations.");
        void submit(true);
      } else {
        toast.warning(
          `Warning: Tab switching is strictly prohibited! (${nextCount}/${maxViolations} warnings used)`,
        );
      }
    };
    const handleReturn = () => {
      if (!document.hidden) visibilityHandled = false;
    };

    document.addEventListener("visibilitychange", handleViolation);
    window.addEventListener("blur", handleViolation);
    window.addEventListener("focus", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", handleViolation);
      window.removeEventListener("blur", handleViolation);
      window.removeEventListener("focus", handleReturn);
    };
  }, [started, submit]);

  if (!test || !questions || questions.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading test…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to attempt this test</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your attempts are saved securely to your account and available across devices.
        </p>
      </div>
    );
  }

  if (isLive && (isCheckingCompletedAttempt || completedAttemptId)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Checking live-test eligibility...
      </div>
    );
  }

  if (
    test.access_type === "package_only" &&
    !hasFreePass &&
    (isLoadingPackageAccess || !packageAccess)
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <Badge variant="secondary">PACKAGE ONLY</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold">Package access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This test is exclusive to a package bundle. Please purchase the series to access this
            test.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">View Test Series &amp; Combos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const liveStart = test.start_time ? new Date(test.start_time).getTime() : null;
  const liveEnd = test.end_time ? new Date(test.end_time).getTime() : null;
  if (
    isLive &&
    ((liveStart !== null && Date.now() < liveStart) || (liveEnd !== null && Date.now() >= liveEnd))
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <Badge variant="secondary">LIVE TEST</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold">This live window is not open</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Return to Live Tests to see the schedule and availability.
          </p>
          <Button asChild className="mt-6">
            <Link to="/live-tests">View Live Tests</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = current >= 0 && current < (orderedQuestions?.length || 0) ? current : 0;
  const currentQuestion = orderedQuestions?.[currentIndex] ?? questions?.[currentIndex] ?? null;
  const currentQuestionId = currentQuestion?.id ?? questions?.[currentIndex]?.id ?? null;

  const limitReached = effectiveAttemptCount >= maxAllowedAttempts;

  if (!started) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <Badge variant="secondary">{test.subject}</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold">{test.title}</h1>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              {orderedQuestions.length} questions · {test.duration_minutes} minutes
            </li>
            <li>+{test.positive_marks} for each correct answer</li>
            <li>−{test.negative_marks} for each wrong answer</li>
            <li>The test auto-submits when the timer hits zero.</li>
            <li>
              {test.max_attempts === null
                ? "Unlimited attempts allowed."
                : `Attempts: ${effectiveAttemptCount}/${test.max_attempts || 1}`}
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
              disabled={Boolean(user?.email)}
            />
          </div>

          {limitReached && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              You have exhausted all allowed attempts ({test.max_attempts ?? 1}/
              {test.max_attempts ?? 1}) for this test.
            </div>
          )}

          {!limitReached && (
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={async () => {
                if (!document.fullscreenElement) {
                  try {
                    await document.documentElement.requestFullscreen();
                  } catch {
                    toast.error("Fullscreen is required to begin the test.");
                    return;
                  }
                }
                clearTestSession(testId, user?.id);
                clearTestSession(testId, null);
                resetTestState();
                setSecondsLeft(Number(test.duration_minutes ?? 0) * 60);
                const sectionalEnabled = sectionalTimingEnabled;
                if (sectionalEnabled) {
                  const first = sections[0];
                  const firstDuration = Number(first?.duration_minutes ?? first?.duration ?? 0);
                  setSectionSecondsLeft(firstDuration > 0 ? firstDuration * 60 : null);
                } else {
                  setSectionSecondsLeft(null);
                }
                setStarted(true);
              }}
            >
              Enter Fullscreen to Begin Test
            </Button>
          )}

          {limitReached && (
            <div className="mt-4 flex flex-col gap-3">
              <Button className="w-full" size="lg" disabled>
                Start test
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Back to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">
        Loading questions or no questions available for this test.
      </div>
    );
  }

  const questionId = currentQuestionId ?? currentQuestion?.id ?? null;
  const q = currentQuestion;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = orderedQuestions.length;
  const displayedSeconds =
    sectionalTimingEnabled && sectionSecondsLeft !== null ? sectionSecondsLeft : secondsLeft;
  const warning = displayedSeconds <= 120 && displayedSeconds > 0;
  const critical = displayedSeconds <= 60 && displayedSeconds > 0;
  const activeSectionStart = getSectionStartIndex(currentSection);
  const activeSectionEnd = activeSectionStart + activeSectionQuestions.length - 1;
  const isLastQuestionOfSection = current === activeSectionEnd;
  const isLastSection = currentSection === effectiveSections.length - 1;
  const activeSectionAttemptedCount = activeSectionQuestions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const activeSectionMarkedCount = activeSectionQuestions.filter(
    (question) => marked[question.id],
  ).length;
  const totalMarkedCount = orderedQuestions.filter((question) => marked[question.id]).length;
  const totalAnsweredCount = orderedQuestions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  const openFinalSummary = () => setFinalSummaryOpen(true);
  const confirmSectionSubmit = () => {
    setSectionSummaryOpen(false);
    if (isLastSection) {
      openFinalSummary();
      return;
    }
    const nextSection = currentSection + 1;
    setSectionSubmitted((submitted) => ({ ...submitted, [activeSection.id]: true }));
    setCurrentSection(nextSection);
    setCurrent(getSectionStartIndex(nextSection));
    const next = effectiveSections[nextSection];
    setSectionSecondsLeft(Number(next?.duration_minutes ?? next?.duration ?? 0) * 60 || null);
  };

  return (
    <div
      className="mx-auto max-w-5xl select-none px-4 py-6"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onPaste={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Link
            to="/"
            aria-label="Rankdon home"
            className="mb-2 inline-flex transition-transform duration-200 hover:scale-105"
          >
            <img src="/logo.png" alt="Rankdon Logo" className="w-auto max-h-12 object-contain" />
          </Link>
          <h1 className="font-display text-lg font-semibold md:text-xl">{test.title}</h1>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm hover:bg-muted"
            onClick={() => setPaletteOpen((s) => !s)}
            aria-expanded={paletteOpen}
            aria-controls="question-palette"
          >
            <Flag className="size-4" />
            <span className="hidden sm:inline">Questions</span>
          </button>

          {!isLive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(true)}
              className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-300 text-xs font-semibold h-10 px-3"
            >
              Pause Test
            </Button>
          )}

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
            {formatTime(displayedSeconds)}
          </div>
        </div>
      </div>

      {warning && (
        <div className="mt-3 rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="inline-block mr-2 align-middle" /> Less than 2 minutes remaining
          — finish soon. The test will auto-submit when time runs out.
        </div>
      )}

      <Progress value={(answeredCount / Math.max(1, totalQuestions)) * 100} className="mt-4 h-2" />

      <div className="mt-4 flex gap-2 overflow-auto">
        {sections.map((s, si) => {
          const count = (sectionQuestionMap[s.id] ?? []).length;
          const submitted = Boolean(sectionSubmitted[s.id]);
          const disabled = sectionalTimingEnabled && si !== currentSection;
          return (
            <button
              key={s.id}
              onClick={() => {
                if (sectionalTimingEnabled && si !== currentSection) return;
                setCurrentSection(si);
                const gs = getSectionStartIndex(si);
                if (gs !== -1) setCurrent(gs);
              }}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium",
                si === currentSection ? "bg-muted" : "bg-background",
              )}
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
            Question {current - getSectionStartIndex(currentSection) + 1} of{" "}
            {activeSectionQuestions.length}
          </p>
          <h2 className="mt-2 text-base font-medium md:text-lg">{q.body}</h2>

          <div className="mt-5 space-y-3">
            {(Array.isArray(q.options) ? q.options : []).map((opt: string, i: number) => {
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
            <div className="text-xs text-muted-foreground">
              {answeredCount}/{totalQuestions}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2 lg:grid-cols-5">
            {activeSectionQuestions.map((item, i) => {
              const itemId = item?.id ?? null;
              const isVisited = itemId ? Boolean(visited[itemId]) : false;
              const isMarked = itemId ? Boolean(marked[itemId]) : false;
              const isAnswered = itemId ? answers[itemId] !== undefined : false;
              const globalIndex = getSectionStartIndex(currentSection) + i;

              let classes =
                "aspect-square rounded-md border text-xs font-semibold transition-colors relative";
              if (isMarked && isAnswered) classes += " bg-violet-600 text-white";
              else if (isMarked) classes += " bg-violet-600 text-white";
              else if (isAnswered)
                classes += " border-transparent bg-success text-success-foreground";
              else if (isVisited)
                classes += " border-transparent bg-destructive text-destructive-foreground";
              else classes += " border-border bg-background text-muted-foreground";

              return (
                <button
                  key={itemId ?? `question-${i}`}
                  type="button"
                  onClick={() => setCurrent(globalIndex)}
                  className={cn(
                    classes,
                    globalIndex === current && "ring-2 ring-ring ring-offset-1",
                  )}
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

      <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-5xl px-4">
        <div className="rounded-xl border border-border bg-background/80 p-3 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={Boolean(sectionSubmitted[activeSection?.id ?? ""])}
                onClick={() =>
                  setAnswers((prev) => {
                    const next = { ...prev };
                    if (questionId) delete next[questionId];
                    return next;
                  })
                }
              >
                Clear Response
              </Button>
              <Button
                variant="outline"
                disabled={Boolean(sectionSubmitted[activeSection?.id ?? ""])}
                onClick={() => {
                  if (!questionId) return;
                  setMarked((previous) => ({ ...previous, [questionId]: !previous[questionId] }));
                }}
              >
                {questionId && marked[questionId] ? "Unmark" : "Mark for Review"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={
                  current <= activeSectionStart ||
                  Boolean(sectionSubmitted[activeSection?.id ?? ""])
                }
                onClick={() => {
                  if (current > activeSectionStart) setCurrent((value) => value - 1);
                  else if (!sectionalTimingEnabled && currentSection > 0) {
                    const previousSection = currentSection - 1;
                    const previousStart = getSectionStartIndex(previousSection);
                    const previousCount =
                      sectionQuestionMap[effectiveSections[previousSection].id]?.length ?? 0;
                    setCurrentSection(previousSection);
                    setCurrent(previousStart + Math.max(previousCount - 1, 0));
                  }
                }}
              >
                <ChevronLeft className="mr-1 size-4" /> Previous Question
              </Button>
              {sectionalTimingEnabled && (
                <Button
                  variant="secondary"
                  disabled={Boolean(sectionSubmitted[activeSection?.id ?? ""])}
                  onClick={() => (isLastSection ? openFinalSummary() : setSectionSummaryOpen(true))}
                >
                  {isLastSection ? "Submit Test" : "Submit Section"}
                </Button>
              )}
              <Button
                disabled={Boolean(sectionSubmitted[activeSection?.id ?? ""])}
                onClick={() => {
                  if (!isLastQuestionOfSection) {
                    setCurrent((value) => value + 1);
                  } else if (sectionalTimingEnabled && !isLastSection) {
                    setSectionAlertOpen(true);
                  } else if (
                    !sectionalTimingEnabled &&
                    currentSection < effectiveSections.length - 1
                  ) {
                    const nextSection = currentSection + 1;
                    setCurrentSection(nextSection);
                    setCurrent(getSectionStartIndex(nextSection));
                  } else {
                    sectionalTimingEnabled
                      ? isLastSection
                        ? openFinalSummary()
                        : setSectionSummaryOpen(true)
                      : openFinalSummary();
                  }
                }}
              >
                {sectionalTimingEnabled && isLastSection && isLastQuestionOfSection
                  ? submitting
                    ? "Submitting..."
                    : "Submit Test"
                  : sectionalTimingEnabled && isLastQuestionOfSection
                    ? "Next Question"
                    : !sectionalTimingEnabled && current === totalQuestions - 1
                      ? "Submit Test"
                      : "Save & Next"}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {sectionAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Section boundary</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You have reached the last question of this section. Please wait till the time allotted
              for this section is over or submit the section to move to next section
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSectionAlertOpen(false)}>Ok</Button>
            </div>
          </div>
        </div>
      )}

      {sectionSummaryOpen && activeSection && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Summary of {activeSection.name}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Section Time Left</p>
                <p className="mt-1 font-mono font-semibold">
                  {formatDuration(sectionSecondsLeft ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Attempted count</p>
                <p className="mt-1 font-semibold">{activeSectionAttemptedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unattempted count</p>
                <p className="mt-1 font-semibold">
                  {Math.max(activeSectionQuestions.length - activeSectionAttemptedCount, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Marked for Review count</p>
                <p className="mt-1 font-semibold">{activeSectionMarkedCount}</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-medium">
              Are you sure you want to submit this section?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSectionSummaryOpen(false)}>
                No
              </Button>
              <Button onClick={confirmSectionSubmit}>Yes</Button>
            </div>
          </div>
        </div>
      )}

      {finalSummaryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Submit Test</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Answered</p>
                <p className="mt-1 font-semibold">{totalAnsweredCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Unanswered</p>
                <p className="mt-1 font-semibold">
                  {Math.max(totalQuestions - totalAnsweredCount, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Marked</p>
                <p className="mt-1 font-semibold">{totalMarkedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time Left</p>
                <p className="mt-1 font-mono font-semibold">{formatDuration(displayedSeconds)}</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-medium">Are you sure you want to submit the test?</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFinalSummaryOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setFinalSummaryOpen(false);
                  void submit();
                }}
              >
                Yes, Submit Test
              </Button>
            </div>
          </div>
        </div>
      )}

      {started && !isFullscreen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-2xl">
            <h2 className="text-lg font-semibold">Please return to fullscreen to continue your exam</h2>
            <Button
              className="mt-5"
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                } catch {
                  toast.error("Fullscreen is required to continue the exam.");
                }
              }}
            >
              Return to Fullscreen
            </Button>
          </div>
        </div>
      )}

      {!isLive && isPaused && (
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