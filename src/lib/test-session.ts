export type TestSessionState = {
  answers: Record<string, number>;
  markedForReview: string[];
  visitedQuestions: string[];
  currentQuestionIndex: number;
  currentSectionIndex: number;
  remainingTimeSeconds: number;
  completedSections: string[];
  isPaused: boolean;
};

export function getTestSessionKey(testId: string, userId?: string | null) {
  return `test_session_${testId}_${userId ?? "anonymous"}`;
}

export function readTestSession(testId: string, userId?: string | null): TestSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getTestSessionKey(testId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TestSessionState>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      markedForReview: Array.isArray(parsed.markedForReview) ? parsed.markedForReview : [],
      visitedQuestions: Array.isArray(parsed.visitedQuestions) ? parsed.visitedQuestions : [],
      currentQuestionIndex: Number.isInteger(parsed.currentQuestionIndex) ? parsed.currentQuestionIndex : 0,
      currentSectionIndex: Number.isInteger(parsed.currentSectionIndex) ? parsed.currentSectionIndex : 0,
      remainingTimeSeconds: Number.isFinite(parsed.remainingTimeSeconds) ? Math.max(0, Number(parsed.remainingTimeSeconds)) : 0,
      completedSections: Array.isArray(parsed.completedSections) ? parsed.completedSections : [],
      isPaused: Boolean(parsed.isPaused),
    };
  } catch {
    return null;
  }
}

export function writeTestSession(testId: string, userId: string | null | undefined, state: TestSessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getTestSessionKey(testId, userId), JSON.stringify(state));
}

export function clearTestSession(testId: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getTestSessionKey(testId, userId));
}

export function hasTestSession(testId: string, userId?: string | null) {
  return Boolean(readTestSession(testId, userId));
}
