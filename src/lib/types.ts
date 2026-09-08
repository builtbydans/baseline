export type AppMode = "professional" | "clinical";

export type FrequencyGoal = "daily" | "twice-weekly" | "weekly";

export type TranscriptIssue = "filler" | "slurring" | "eye-contact" | "fidgeting";

export interface SessionMetrics {
  overallScore: number;
  clarityPercent: number;
  fillerWordCount: number;
  slurringScore: number;
  eyeContactPercent: number;
  fidgetingScore: number;
}

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
  isFiller: boolean;
  isSlurred: boolean;
}

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  speaker: "user";
  words: TranscriptWord[];
  issues: TranscriptIssue[];
}

export interface FeedbackItem {
  id: string;
  category: "speech" | "visual";
  title: string;
  body: string;
}

export interface PracticeSession {
  id: string;
  topic: string;
  startedAt: string;
  durationSeconds: number;
  metrics: SessionMetrics;
  transcript: TranscriptSegment[];
  feedback: FeedbackItem[];
}

export interface TrendPoint {
  dateLabel: string;
  startedAt: string;
  clarity: number;
  fillerWords: number;
  eyeContact: number;
  overallScore: number;
}

export interface SessionDraft {
  topic: string;
  frequency: FrequencyGoal;
  targetMinutes: number;
}

export const DEFAULT_SESSION_DRAFT: SessionDraft = {
  topic: "",
  frequency: "twice-weekly",
  targetMinutes: 10,
};
