export type TestSessionState = {
  answers: Record<string, number>;
  markedForReview: string[];
  visitedQuestions: string[];
  currentQuestionIndex: number;
  currentSectionIndex: number;
  remainingTimeSeconds: number;
  completedSections: string[];
  isPaused: boolean;
  isSubmitted?: boolean;
  lastSavedTimestamp?: number; // Wall-clock timestamp (Date.now()) when last saved
  isLive?: boolean;            // Identifies if this is a time-bound live test
};

export function getTestSessionKey(testId: string, userId?: string | null) {
  return `test_session_${testId}_${userId ?? "anonymous"}`;
}

export function readTestSession(testId: string, userId?: string | null): TestSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const scopedKey = getTestSessionKey(testId, userId);
    let raw = window.localStorage.getItem(scopedKey);

    if (!raw) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.includes(testId) && k.includes("session")) {
          raw = window.localStorage.getItem(k);
          break;
        }
      }
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TestSessionState>;
    if (!parsed || typeof parsed !== "object") return null;

    let adjustedTime = typeof parsed.remainingTimeSeconds === "number" ? parsed.remainingTimeSeconds : 0;

    // If it's a live test, compute elapsed wall-clock time since the last save
    if (parsed.isLive && parsed.lastSavedTimestamp) {
      const elapsedSeconds = Math.floor((Date.now() - parsed.lastSavedTimestamp) / 1000);
      adjustedTime = Math.max(0, adjustedTime - elapsedSeconds);
    }

    if (
      parsed.isSubmitted === true ||
      adjustedTime <= 0
    ) {
      clearTestSession(testId, userId);
      return null;
    }

    return {
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      markedForReview: Array.isArray(parsed.markedForReview) ? parsed.markedForReview : [],
      visitedQuestions: Array.isArray(parsed.visitedQuestions) ? parsed.visitedQuestions : [],
      currentQuestionIndex: typeof parsed.currentQuestionIndex === "number" ? parsed.currentQuestionIndex : 0,
      currentSectionIndex: typeof parsed.currentSectionIndex === "number" ? parsed.currentSectionIndex : 0,
      remainingTimeSeconds: adjustedTime,
      completedSections: Array.isArray(parsed.completedSections) ? parsed.completedSections : [],
      isPaused: Boolean(parsed.isPaused),
      isSubmitted: false,
      lastSavedTimestamp: Date.now(),
      isLive: Boolean(parsed.isLive),
    };
  } catch {
    return null;
  }
}

export function writeTestSession(testId: string, userId: string | null | undefined, state: TestSessionState) {
  if (typeof window === "undefined") return;
  if (state.isSubmitted || state.remainingTimeSeconds <= 0) {
    clearTestSession(testId, userId);
    return;
  }

  // Inject current wall-clock timestamp on write to track background time accurately
  const stateWithTimestamp: TestSessionState = {
    ...state,
    lastSavedTimestamp: Date.now(),
  };

  window.localStorage.setItem(getTestSessionKey(testId, userId), JSON.stringify(stateWithTimestamp));
}

export function clearTestSession(testId: string, userId?: string | null) {
  if (typeof window === "undefined") return;

  // Clear from localStorage
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key && (key.includes(testId) || key.startsWith(`test_session_`) || key.startsWith(`rankdon_session_`))) {
      window.localStorage.removeItem(key);
    }
  }

  // Clear from sessionStorage
  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key && (key.includes(testId) || key.startsWith(`test_session_`) || key.startsWith(`rankdon_session_`))) {
      window.sessionStorage.removeItem(key);
    }
  }
}

export function hasTestSession(testId: string, userId?: string | null): boolean {
  const session = readTestSession(testId, userId);
  return Boolean(session && !session.isSubmitted && session.remainingTimeSeconds > 0);
}