import type { Attempt } from "@/lib/mock-test";

const KEY = "testprep.attempt-history";
const COMPLETED_KEY = "testprep.completed-tests";

export type AttemptSummary = {
  attemptId: string;
  testId: string;
  testTitle: string;
  category: string;
  score: number;
  maxScore: number;
  accuracy: number;
  submittedAt: string;
};

export function getAttemptHistory(): AttemptSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AttemptSummary[]) : [];
  } catch {
    return [];
  }
}

export function saveAttemptToHistory(
  attempt: Pick<Attempt, "id" | "test_id" | "score" | "max_score" | "accuracy" | "created_at"> & {
    testTitle: string;
    category: string;
  },
) {
  if (typeof window === "undefined") return;
  const summary: AttemptSummary = {
    attemptId: attempt.id,
    testId: attempt.test_id,
    testTitle: attempt.testTitle,
    category: attempt.category,
    score: Number(attempt.score),
    maxScore: Number(attempt.max_score),
    accuracy: Number(attempt.accuracy),
    submittedAt: attempt.created_at,
  };
  const existing = getAttemptHistory().filter((s) => s.attemptId !== summary.attemptId);
  existing.unshift(summary);
  window.localStorage.setItem(KEY, JSON.stringify(existing));
}

export function clearAttemptHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function markTestCompleted(testId: string, attemptId: string) {
  if (typeof window === "undefined") return;
  const completed = getCompletedTests();
  completed[testId] = attemptId;
  window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
}

export function getCompletedTests(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPLETED_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}
