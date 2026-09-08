import type {
  FeedbackItem,
  PracticeSession,
  TranscriptIssue,
  TranscriptSegment,
  TranscriptWord,
  TrendPoint,
} from "@/lib/types";

const FILLER_TOKENS = new Set([
  "um",
  "uh",
  "like",
  "so",
  "actually",
  "basically",
]);

const FILLER_PHRASES = ["you know"];

function tokenizeTranscript(
  text: string,
  startMs: number,
  slurredWords: string[] = [],
): TranscriptSegment[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const slurred = new Set(slurredWords.map((word) => word.toLowerCase()));
  let cursor = startMs;
  const msPerChar = 42;

  return sentences.map((sentence, index) => {
    const words: TranscriptWord[] = [];
    let remaining = sentence;
    let offset = 0;

    while (remaining.length > 0) {
      const phrase = FILLER_PHRASES.find((item) =>
        remaining.toLowerCase().startsWith(item),
      );

      const raw = phrase ?? remaining.match(/^\S+/)?.[0] ?? remaining;
      const duration = Math.max(180, raw.length * msPerChar);
      const stripped = raw.replace(/[.,!?;:]+$/g, "").toLowerCase();

      words.push({
        text: raw,
        startMs: cursor,
        endMs: cursor + duration,
        isFiller: FILLER_TOKENS.has(stripped) || Boolean(phrase),
        isSlurred: slurred.has(stripped),
      });

      cursor += duration + 40;
      offset += raw.length;
      remaining = sentence.slice(offset).replace(/^\s+/, "");
      offset = sentence.length - remaining.length;
    }

    const issues: TranscriptIssue[] = [];
    if (words.some((word) => word.isFiller)) issues.push("filler");
    if (words.some((word) => word.isSlurred)) issues.push("slurring");

    return {
      id: `seg-${index + 1}`,
      startMs: words[0]?.startMs ?? startMs,
      endMs: words.at(-1)?.endMs ?? startMs,
      speaker: "user" as const,
      words,
      issues,
    };
  });
}

const LATEST_TRANSCRIPT = tokenizeTranscript(
  "I think um my background is in product, and like I have been working on speech tools for the past few years. Uh one thing I am really passionate about is making communication more accessible. You know when people um feel heard, everything else gets easier. I would love to walk you through a recent project where we slowed the pace and focused on clarity.",
  1200,
  ["passionate", "accessible"],
);

const LATEST_FEEDBACK: FeedbackItem[] = [
  {
    id: "fb-1",
    category: "speech",
    title: "Replace the first “um” with a pause",
    body: "The opening hesitation lands in the first two seconds. A silent beat reads as confident; the filler does not.",
  },
  {
    id: "fb-2",
    category: "speech",
    title: "Slow the third sentence by ~10%",
    body: "Speech clarity dipped on “passionate” and “accessible”. Slightly longer vowels will reduce the slurred edges.",
  },
  {
    id: "fb-3",
    category: "visual",
    title: "Re-center gaze after looking down",
    body: "Eye contact dropped around 0:18 while searching for a word. Keep the camera lens as a rest point.",
  },
  {
    id: "fb-4",
    category: "visual",
    title: "Anchor your hands",
    body: "Shoulder movement increased during filler clusters. Resting one hand on the desk will stabilize the frame.",
  },
];

export const mockSessions: PracticeSession[] = [
  {
    id: "sess-001",
    topic: "Introduce yourself",
    startedAt: "2026-07-10T14:00:00.000Z",
    durationSeconds: 186,
    metrics: {
      overallScore: 58,
      clarityPercent: 62,
      fillerWordCount: 18,
      slurringScore: 54,
      eyeContactPercent: 48,
      fidgetingScore: 51,
    },
    transcript: tokenizeTranscript(
      "Um hi so I guess I will start with my name. I like uh I am still working on speaking more clearly.",
      800,
      ["guess", "clearly"],
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-002",
    topic: "Morning routine",
    startedAt: "2026-07-17T14:30:00.000Z",
    durationSeconds: 204,
    metrics: {
      overallScore: 61,
      clarityPercent: 65,
      fillerWordCount: 16,
      slurringScore: 57,
      eyeContactPercent: 52,
      fidgetingScore: 55,
    },
    transcript: tokenizeTranscript(
      "So in the morning I um make tea and then I try to read out loud. It is like a warm-up.",
      900,
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-003",
    topic: "Describe a challenge",
    startedAt: "2026-07-24T15:00:00.000Z",
    durationSeconds: 221,
    metrics: {
      overallScore: 64,
      clarityPercent: 68,
      fillerWordCount: 14,
      slurringScore: 61,
      eyeContactPercent: 57,
      fidgetingScore: 60,
    },
    transcript: tokenizeTranscript(
      "The hardest part is uh keeping a steady pace. I get like excited and the words bunch together.",
      700,
      ["steady"],
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-004",
    topic: "Career story",
    startedAt: "2026-07-31T15:00:00.000Z",
    durationSeconds: 248,
    metrics: {
      overallScore: 68,
      clarityPercent: 72,
      fillerWordCount: 12,
      slurringScore: 66,
      eyeContactPercent: 61,
      fidgetingScore: 64,
    },
    transcript: tokenizeTranscript(
      "I used to rush every answer. Now I um leave more space between ideas.",
      640,
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-005",
    topic: "Product sense interview",
    startedAt: "2026-08-07T16:00:00.000Z",
    durationSeconds: 312,
    metrics: {
      overallScore: 71,
      clarityPercent: 75,
      fillerWordCount: 11,
      slurringScore: 70,
      eyeContactPercent: 66,
      fidgetingScore: 69,
    },
    transcript: tokenizeTranscript(
      "I would start by clarifying the user. Um then I would map the job to be done.",
      520,
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-006",
    topic: "Tell me about a project",
    startedAt: "2026-08-14T16:00:00.000Z",
    durationSeconds: 298,
    metrics: {
      overallScore: 74,
      clarityPercent: 78,
      fillerWordCount: 9,
      slurringScore: 74,
      eyeContactPercent: 71,
      fidgetingScore: 73,
    },
    transcript: tokenizeTranscript(
      "We shipped a quieter interface so people could focus on the words, not the chrome.",
      480,
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-007",
    topic: "Q3 board update",
    startedAt: "2026-08-21T17:00:00.000Z",
    durationSeconds: 334,
    metrics: {
      overallScore: 78,
      clarityPercent: 82,
      fillerWordCount: 7,
      slurringScore: 79,
      eyeContactPercent: 76,
      fidgetingScore: 77,
    },
    transcript: tokenizeTranscript(
      "Retention is up, and like the qualitative feedback is stronger around trust.",
      500,
    ),
    feedback: LATEST_FEEDBACK,
  },
  {
    id: "sess-008",
    topic: "Tell me about yourself",
    startedAt: "2026-08-28T17:30:00.000Z",
    durationSeconds: 276,
    metrics: {
      overallScore: 82,
      clarityPercent: 86,
      fillerWordCount: 5,
      slurringScore: 84,
      eyeContactPercent: 81,
      fidgetingScore: 80,
    },
    transcript: LATEST_TRANSCRIPT,
    feedback: LATEST_FEEDBACK,
  },
];

export const latestSession = mockSessions[mockSessions.length - 1];

export const mockTrend: TrendPoint[] = mockSessions.map((session) => ({
  dateLabel: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(session.startedAt)),
  startedAt: session.startedAt,
  clarity: session.metrics.clarityPercent,
  fillerWords: session.metrics.fillerWordCount,
  eyeContact: session.metrics.eyeContactPercent,
  overallScore: session.metrics.overallScore,
}));

export function getSessionById(id: string): PracticeSession | undefined {
  return mockSessions.find((session) => session.id === id);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getLiveTranscriptWords(): TranscriptWord[] {
  return latestSession.transcript.flatMap((segment) => segment.words);
}

export function countFillers(session: PracticeSession): number {
  return session.transcript
    .flatMap((segment) => segment.words)
    .filter((word) => word.isFiller).length;
}
