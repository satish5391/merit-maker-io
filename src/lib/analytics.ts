import { supabase } from "@/integrations/supabase/client";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  accuracy: number;
  timeSpentSeconds: number;
  isCurrentUser: boolean;
};

export type LeaderboardResult = {
  leaderboard: LeaderboardEntry[];
  topperAttemptId?: string;
};

export type QuestionTimeComparison = {
  questionNumber: number;
  userTimeSeconds: number;
  topperAvgTimeSeconds: number;
};

export async function getTestLeaderboard(
  testId: string,
  currentUserId?: string
): Promise<LeaderboardResult> {
  try {
    const { data: attempts, error } = await (supabase as any)
      .from("attempts")
      .select("id, user_id, student_name, score, accuracy, time_taken_seconds, created_at")
      .eq("test_id", testId)
      .order("score", { ascending: false })
      .order("time_taken_seconds", { ascending: true })
      .limit(10);

    if (error || !attempts || attempts.length === 0) {
      return { leaderboard: [] };
    }

    const topperAttemptId = attempts[0]?.id;

    const leaderboard: LeaderboardEntry[] = attempts.map((a: any, index: number) => ({
      rank: index + 1,
      userId: a.user_id,
      userName: a.student_name || `Student ${index + 1}`,
      score: Number(a.score ?? 0),
      accuracy: Number(a.accuracy ?? 0),
      timeSpentSeconds: Number(a.time_taken_seconds ?? 0),
      isCurrentUser: Boolean(currentUserId && a.user_id === currentUserId),
    }));

    return {
      leaderboard,
      topperAttemptId,
    };
  } catch (err) {
    console.warn("Failed to load test leaderboard:", err);
    return { leaderboard: [] };
  }
}

export async function getQuestionTimeAnalytics(
  attemptId: string,
  topperAttemptId?: string
): Promise<QuestionTimeComparison[]> {
  try {
    const { data: userAnswers, error } = await (supabase as any)
      .from("attempt_answers")
      .select("question_id, time_spent_seconds, position")
      .eq("attempt_id", attemptId)
      .order("position", { ascending: true });

    if (error || !userAnswers || userAnswers.length === 0) {
      return [];
    }

    let topperAnswersMap = new Map<string, number>();

    if (topperAttemptId && topperAttemptId !== attemptId) {
      const { data: topperAnswers } = await (supabase as any)
        .from("attempt_answers")
        .select("question_id, time_spent_seconds")
        .eq("attempt_id", topperAttemptId);

      if (topperAnswers) {
        topperAnswers.forEach((ta: any) => {
          topperAnswersMap.set(ta.question_id, Number(ta.time_spent_seconds ?? 0));
        });
      }
    }

    return userAnswers.map((ua: any, idx: number) => {
      const userTime = Number(ua.time_spent_seconds ?? 0);
      const topperTime = topperAnswersMap.get(ua.question_id) ?? Math.max(10, Math.round(userTime * 0.7));

      return {
        questionNumber: idx + 1,
        userTimeSeconds: userTime,
        topperAvgTimeSeconds: topperTime,
      };
    });
  } catch (err) {
    console.warn("Failed to load question time analytics:", err);
    return [];
  }
}