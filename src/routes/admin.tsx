import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchTests, fetchQuestions } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Create Mock Tests | TestPrep" },
      {
        name: "description",
        content:
          "Create mock tests with custom duration, positive and negative marking, add questions and delete tests.",
      },
      { property: "og:title", content: "Admin Dashboard — TestPrep" },
      {
        property: "og:description",
        content: "Create and manage mock tests with positive and negative marking.",
      },
    ],
  }),
  component: Admin,
});

type Draft = {
  body: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

const emptyDraft = (): Draft => ({
  body: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
});

function Admin() {
  const qc = useQueryClient();
  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [duration, setDuration] = useState(10);
  const [positive, setPositive] = useState(2);
  const [negative, setNegative] = useState(0.5);
  const [maxAttempts, setMaxAttempts] = useState<string>("1");
  const [questions, setQuestions] = useState<Draft[]>([emptyDraft()]);

  const createTest = useMutation({
    mutationFn: async () => {
      const valid = questions.filter(
        (q) => q.body.trim() && q.options.every((o) => o.trim().length > 0),
      );
      if (!title.trim()) throw new Error("Test title is required");
      if (valid.length === 0) throw new Error("Add at least one complete question");

      const { data: test, error } = await supabase
        .from("tests")
        .insert({
          title: title.trim(),
          subject: subject.trim() || "General",
          duration_minutes: duration,
          positive_marks: positive,
          negative_marks: negative,
          max_attempts:
            maxAttempts.trim().toLowerCase() === "unlimited" || maxAttempts.trim() === ""
              ? null
              : Math.max(1, Number(maxAttempts)),
        })
        .select()
        .single();
      if (error) throw error;

      const { error: qErr } = await supabase.from("questions").insert(
        valid.map((q, i) => ({
          test_id: test.id,
          position: i + 1,
          body: q.body.trim(),
          options: q.options.map((o) => o.trim()),
          correct_index: q.correct_index,
          explanation: q.explanation.trim(),
        })),
      );
      if (qErr) throw qErr;
    },
    onSuccess: () => {
      toast.success("Test created");
      setTitle("");
      setQuestions([emptyDraft()]);
      qc.invalidateQueries({ queryKey: ["tests"] });
      qc.invalidateQueries({ queryKey: ["tests-with-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test deleted");
      qc.invalidateQueries({ queryKey: ["tests"] });
      qc.invalidateQueries({ queryKey: ["tests-with-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = (i: number, next: Partial<Draft>) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...next } : q)));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create mock tests with custom marking schemes, and remove tests you no longer need.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-semibold">New test</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Test title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reasoning Mock Test 2"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pos">Marks per correct answer</Label>
              <Input
                id="pos"
                type="number"
                step="0.25"
                min={0}
                value={positive}
                onChange={(e) => setPositive(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="neg">Negative marks per wrong answer</Label>
              <Input
                id="neg"
                type="number"
                step="0.25"
                min={0}
                value={negative}
                onChange={(e) => setNegative(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="attempts">Max attempts allowed</Label>
              <Input
                id="attempts"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="1 or Unlimited"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a number, or type "Unlimited" for no limit.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <h3 className="font-display text-base font-semibold">Questions</h3>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Question {i + 1}</span>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setQuestions((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={q.body}
                  onChange={(e) => patch(i, { body: e.target.value })}
                  placeholder="Enter the question"
                  className="mt-2"
                />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={q.correct_index === oi}
                        onChange={() => patch(i, { correct_index: oi })}
                        className="size-4 accent-[var(--primary)]"
                        aria-label={`Mark option ${oi + 1} correct`}
                      />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          patch(i, {
                            options: q.options.map((o, idx) =>
                              idx === oi ? e.target.value : o,
                            ),
                          })
                        }
                        placeholder={`Option ${oi + 1}`}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Select the radio next to the correct option.
                </p>
                <div className="mt-3">
                  <Label htmlFor={`explanation-${i}`}>Answer explanation / solution</Label>
                  <Textarea
                    id={`explanation-${i}`}
                    value={q.explanation}
                    onChange={(e) => patch(i, { explanation: e.target.value })}
                    placeholder="Explain how the correct answer is derived…"
                    className="mt-1.5 min-h-24"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => setQuestions((prev) => [...prev, emptyDraft()])}
            >
              <Plus className="mr-1 size-4" /> Add question
            </Button>
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => createTest.mutate()}
            disabled={createTest.isPending}
          >
            {createTest.isPending ? "Creating…" : "Create test"}
          </Button>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Existing tests</h2>
          <Accordion type="single" collapsible className="mt-3">
            {tests?.map((t) => (
              <AccordionItem key={t.id} value={t.id}>
                <AccordionTrigger className="text-left">
                  <span className="pr-2">{t.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{t.subject}</Badge>
                    <Badge variant="secondary">{t.duration_minutes} min</Badge>
                    <Badge variant="secondary">
                      +{t.positive_marks} / −{t.negative_marks}
                    </Badge>
                    <Badge variant="secondary">
                      {t.max_attempts === null ? "Unlimited attempts" : `${t.max_attempts} attempt(s)`}
                    </Badge>
                  </div>
                  <QuestionList testId={t.id} />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4"
                    onClick={() => deleteTest.mutate(t.id)}
                  >
                    <Trash2 className="mr-1 size-4" /> Delete test
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {tests && tests.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">No tests created yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function QuestionList({ testId }: { testId: string }) {
  const { data } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });
  return (
    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
      {data?.map((q) => <li key={q.id}>{q.body}</li>)}
    </ol>
  );
}
