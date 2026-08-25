import { supabase } from "@/integrations/supabase/client";

export type Test = {
  id: string;
  title: string;
  category: string;
  subject: string;
  duration_minutes: number;
  positive_marks: number;
  negative_marks: number;
  max_attempts: number | null;
  cutoff?: number | null;
  created_at: string;
  access_type?: "free" | "paid" | "package_only" | null;
};

export type Question = {
  id: string;
  test_id: string;
  position: number;
  body: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type Attempt = {
  id: string;
  test_id: string;
  student_name: string;
  score: number;
  max_score: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  accuracy: number;
  time_taken_seconds: number;
  answers: Record<string, number>;
  created_at: string;
};

function normalizeAttempt(row: Record<string, unknown>): Attempt {
  const raw = row['answers'];
  return {
    ...(row as unknown as Attempt),
    answers:
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, number>)
        : {},
  };
}

export async function fetchTests(): Promise<Test[]> {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Test[];
}

export async function fetchTest(id: string): Promise<Test> {
  const { data, error } = await supabase.from("tests").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Test;
}

export async function fetchQuestions(testId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", testId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((q) => ({
    ...q,
    explanation: q.explanation ?? "",
    options: (Array.isArray(q.options) ? q.options : []) as string[],
  })) as Question[];
}

export async function fetchAttempts(testId: string): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("test_id", testId)
    .order("score", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeAttempt);
}

/** Fetch only lightweight attempt score rows for a test (id and score, student_name optional) */
export async function fetchAttemptScores(testId: string): Promise<Pick<Attempt, 'id' | 'score' | 'student_name'>[]> {
  const { data, error } = await supabase
    .from("attempts")
    .select("id, score, student_name")
    .eq("test_id", testId)
    .order("score", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pick<Attempt, 'id' | 'score' | 'student_name'>[];
}

export async function fetchAttempt(id: string): Promise<Attempt> {
  const { data, error } = await supabase.from("attempts").select("*").eq("id", id).single();
  if (error) throw error;
  return normalizeAttempt(data);
}

/** All attempts made by one student, newest first. */
export async function fetchStudentAttempts(studentName: string): Promise<Attempt[]> {
  if (!studentName.trim()) return [];
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("student_name", studentName.trim())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeAttempt);
}

export async function countQuestions(testId: string): Promise<number> {
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);
  if (error) throw error;
  return count ?? 0;
}

/** Percentile of an attempt among all attempts of the same test. */
export function computeRanking(attempt: Attempt, attempts: Attempt[]) {
  const sorted = [...attempts].sort((a, b) => Number(b.score) - Number(a.score));
  const rank = sorted.findIndex((a) => a.id === attempt.id) + 1;
  const total = sorted.length;
  const below = sorted.filter((a) => Number(a.score) < Number(attempt.score)).length;
  const percentile = total > 1 ? Math.round((below / (total - 1)) * 1000) / 10 : 100;
  return { sorted, rank, total, below, percentile };
}
