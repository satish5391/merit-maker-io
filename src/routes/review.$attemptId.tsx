import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Lightbulb, MinusCircle, XCircle } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
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
import MarkdownMath from "@/components/MarkdownMath";

export const Route = createFileRoute("/review/$attemptId")({
  head: () => ({
    meta: [
      { title: "Detailed Analysis — Question-wise Review | Rankdon" },
      {
        name: "description",
        content:
          "Review every question of your attempt: your selected option, the correct answer and the full solution explanation.",
      },
    ],
  }),
  component: ReviewPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">{String(error?.message ?? "Unexpected error")}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={() => reset?.()}>Try again</Button>
        <Button asChild variant="ghost">
          <Link to="/attempted-tests">Back to attempts</Link>
        </Button>
      </div>
    </div>
  ),
});

function ReviewPage() {
  const params = Route.useParams() as { attemptId: string };
  const attemptId = params.attemptId;

  const { data: attempt, isLoading: loadingAttempt, isError: errorAttempt } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => await fetchAttempt(attemptId),
  });

  const { data: test, isLoading: loadingTest } = useQuery({
    queryKey: ["test", attempt?.test_id],
    queryFn: async () => await fetchTest(attempt!.test_id),
    enabled: Boolean(attempt?.test_id),
  });

  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ["questions", attempt?.test_id],
    queryFn: async () => await fetchQuestions(attempt!.test_id),
    enabled: Boolean(attempt?.test_id),
  });

  // --- Hooks and memos (must be declared before any early returns) ---
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string | "all">("");

  // robust parsing for answers
  const userAnswers: Record<string, any> = useMemo(() => {
    if (!attempt?.answers) return {};
    if (typeof attempt.answers === "string") {
      try {
        return JSON.parse(attempt.answers as string) ?? {};
      } catch {
        return {};
      }
    }
    return attempt.answers ?? {};
  }, [attempt?.answers]);

  const safeQuestions = useMemo(() => (questions || []) as any[], [questions]);

  // build sections and mapping defensively
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
    return [{ id: "section-default", name: test?.title ?? "Section", duration_minutes: test?.duration_minutes ?? 0 }];
  }, [sections, test]);

  // default selected section to first available when test loads
  useEffect(() => {
    // If selectedSectionId is empty or invalid, default to first available section id or name
    const validIds = effectiveSections.map((s) => s.id);
    const validNames = effectiveSections.map((s) => s.name);
    const isValid = selectedSectionId && (selectedSectionId === "all" || validIds.includes(selectedSectionId) || validNames.includes(selectedSectionId));
    if (!isValid && effectiveSections.length > 0) {
      const first = effectiveSections[0];
      setSelectedSectionId(first.id ?? first.name ?? "default");
    }
  }, [effectiveSections, selectedSectionId]);

  const sectionQuestionMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of effectiveSections) map[s.id] = [];
    for (const q of safeQuestions) {
      const sid = (q as any).section_id ?? (effectiveSections[0] && effectiveSections[0].id) ?? "section-default";
      if (!map[sid]) {
        const fallback = (effectiveSections[0] && effectiveSections[0].id) ?? "section-default";
        map[fallback] = map[fallback] ?? [];
        map[fallback].push(q);
      } else map[sid].push(q);
    }
    return map;
  }, [effectiveSections, safeQuestions]);

  // questions scoped to the selected section (or all)
  const sectionScopedQuestions = useMemo(() => {
    const activeSection = (selectedSectionId as string) || effectiveSections[0]?.id || effectiveSections[0]?.name || "default";
    if (activeSection === "all") return safeQuestions;
    const firstId = effectiveSections[0]?.id ?? "section-default";
    const firstName = effectiveSections[0]?.name ?? "";
    return safeQuestions.filter((q) => {
      const sid = (q as any).section_id ?? (q as any).section ?? "";
      const sname = (q as any).section ?? "";
      // match by id or name
      if (sid === activeSection || sname === activeSection) return true;
      // if activeSection is the first/default, include unassigned questions
      if (activeSection === firstId || activeSection === firstName || activeSection === "default") {
        return sid === "" || sid == null;
      }
      return false;
    });
  }, [safeQuestions, selectedSectionId, effectiveSections]);

  // mapping for palette and filtering
  const mapped = useMemo(() => {
    return sectionScopedQuestions.map((q, qi: number) => {
      const selected = userAnswers[q.id];
      const skipped = selected === undefined;
      const isCorrect = selected === q.correct_index;
      const status: "correct" | "wrong" | "skipped" = skipped ? "skipped" : isCorrect ? "correct" : "wrong";
      return { q, qi, status };
    });
  }, [sectionScopedQuestions, userAnswers]);

  const filtered = useMemo(() => (filter === "all" ? mapped : mapped.filter((m) => m.status === filter)), [mapped, filter]);

  const activeRef = useRef<number | null>(null);
  // --- end hooks/memos ---

  // Early loading / error handling
  if (loadingAttempt) return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading detailed review...</div>;
  if (errorAttempt || !attempt)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="text-lg font-semibold">Attempt not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">We couldn't find that attempt.</p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/attempted-tests">Back to attempted tests</Link>
            </Button>
          </div>
        </div>
      </div>
    );

  if (loadingTest || loadingQuestions || !test || !questions)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );

  if (test.is_live && test.result_declaration_time && new Date(test.result_declaration_time).getTime() > Date.now())
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
          <h1 className="font-display text-xl font-semibold">Detailed solutions are not available yet</h1>
          <p className="mt-3 text-sm">Detailed solutions, rank, and percentile analysis will be declared on: {new Date(test.result_declaration_time).toLocaleString()}.</p>
          <Button asChild variant="outline" className="mt-5"><Link to="/result/$attemptId" params={{ attemptId }}>View submission summary</Link></Button>
        </div>
      </div>
    );

  

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap gap-2">
        <Badge>{test.category}</Badge>
        <Badge variant="secondary">{test.subject}</Badge>
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">Detailed analysis — {test.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">
        {attempt.student_name} · {new Date(attempt.created_at).toLocaleString()} · {Number(attempt.score)}/{Number(attempt.max_score)} marks · {Number(attempt.accuracy)}% accuracy
      </p>

      {/* Section tabs */}
      <div className="mt-4 flex gap-2">
        {effectiveSections.map((s) => {
          const count = (sectionQuestionMap[s.id] ?? []).length;
          const active = selectedSectionId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSectionId(s.id)}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium",
                active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
              )}
            >
              {s.name} · {count}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        {(() => {
          const allCount = sectionScopedQuestions.length;
          const correctCount = mapped.filter((m) => m.status === "correct").length;
          const wrongCount = mapped.filter((m) => m.status === "wrong").length;
          const skippedCount = mapped.filter((m) => m.status === "skipped").length;
          const tabs = [
            { key: "all", label: "All", count: allCount },
            { key: "correct", label: "Correct", count: correctCount },
            { key: "wrong", label: "Wrong", count: wrongCount },
            { key: "skipped", label: "Skipped", count: skippedCount },
          ];
          return tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              aria-pressed={filter === tab.key}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition",
                filter === tab.key ? "bg-muted text-foreground" : "bg-background text-muted-foreground hover:bg-accent/50",
              )}
            >
              {tab.key === "correct" && <CheckCircle2 className="size-4 text-success" />}
              {tab.key === "wrong" && <XCircle className="size-4 text-destructive" />}
              {tab.key === "skipped" && <MinusCircle className="size-4 text-muted-foreground" />}
              <span>{tab.label}</span>
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-muted/40 px-2 py-0.5 text-xs">{tab.count}</span>
            </button>
          ));
        })()}
      </div>

      <div className="sticky top-24 z-20 mt-4 w-full bg-background/60 py-2 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-0">
          <div className="overflow-x-auto py-1">
            <div className="flex gap-2">
              {mapped.map(({ qi, status }) => {
                const idx = qi + 1;
                const base = "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium cursor-pointer shrink-0";
                const classes = cn(
                  base,
                  status === "correct" ? "bg-success text-success-foreground" : "",
                  status === "wrong" ? "bg-destructive text-destructive-foreground" : "",
                  status === "skipped" ? "bg-muted text-muted-foreground" : "",
                  activeRef.current === idx && "ring-2 ring-ring",
                );
                return (
                  <button
                    key={qi}
                    onClick={() => {
                      activeRef.current = idx;
                      const el = document.getElementById(`question-${idx}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setTimeout(() => (activeRef.current = null), 1200);
                    }}
                    className={classes}
                    aria-label={`Jump to question ${idx}`}
                  >
                    {idx}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {(filtered || []).map(({ q, qi }: { q: any; qi: number }) => {
          const selected = userAnswers[q.id];
          const skipped = selected === undefined;
          const isCorrect = selected === q.correct_index;
          const idx = qi + 1;
          return (
            <article id={`question-${idx}`} key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question {idx}</p>
                <Badge variant={skipped ? "secondary" : isCorrect ? "default" : "destructive"} className={cn(!skipped && isCorrect && "bg-success text-success-foreground")}>
                  {skipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                </Badge>
              </div>

              <h2 className="mt-2 text-base font-medium">
                <MarkdownMath content={q.body} />
              </h2>

              <ul className="mt-4 space-y-2">
                {(q.options || []).map((opt: any, oi: number) => {
                  const isAnswer = oi === q.correct_index;
                  const isPicked = oi === selected;
                  const wrongPick = isPicked && !isAnswer;
                  return (
                    <li key={oi} className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm", isAnswer && "border-success bg-success/10", wrongPick && "border-destructive bg-destructive/10", !isAnswer && !wrongPick && "border-border bg-background")}>
                      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", isAnswer && "border-transparent bg-success text-success-foreground", wrongPick && "border-transparent bg-destructive text-destructive-foreground")}>{String.fromCharCode(65 + oi)}</span>
                      <span className="flex-1"><MarkdownMath content={opt} /></span>
                      {isPicked && <span className={cn("text-xs font-medium", isAnswer ? "text-success" : "text-destructive")}>Your answer</span>}
                      {isAnswer && !isPicked && <span className="text-xs font-medium text-success">Correct answer</span>}
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
                    <MarkdownMath content={q.explanation ?? "No explanation was added for this question."} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/result/$attemptId" params={{ attemptId: attempt?.id ?? attemptId }}>
            Back to scorecard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/attempted-tests">My history</Link>
        </Button>
      </div>
    </div>
  );
}
