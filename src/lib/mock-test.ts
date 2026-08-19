import { supabase } from "@/integrations/supabase/client";

export type Test = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  positive_marks: number;
  negative_marks: number;
  created_at: string;
};

export type Question = {
  id: string;
  test_id: string;
  position: number;
  body: string;
  options: string[];
  correct_index: number;
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
  created_at: string;
};

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
  return (data ?? []) as Attempt[];
}

export async function fetchAttempt(id: string): Promise<Attempt> {
  const { data, error } = await supabase.from("attempts").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Attempt;
}

export async function countQuestions(testId: string): Promise<number> {
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);
  if (error) throw error;
  return count ?? 0;
}
