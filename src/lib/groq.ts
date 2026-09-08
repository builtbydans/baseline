import type {
  AppMode,
  FeedbackItem,
  PracticeSession,
  SessionMetrics,
  TranscriptSegment,
  TranscriptWord,
} from "@/lib/types";

const FILLER_TOKENS = new Set([
  "um",
  "uh",
  "uhm",
  "erm",
  "ah",
  "like",
  "so",
  "actually",
  "basically",
  "literally",
  "right",
]);

const FILLER_PHRASES = ["you know", "i mean", "kind of", "sort of"];

export interface GroqWord {
  word: string;
  start?: number;
  end?: number;
}

export interface TranscriptionResult {
  text: string;
  words: GroqWord[];
  durationSeconds: number;
}

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set. Add it to .env.local and restart the server.");
  }
  return key;
}

export async function transcribeWithGroq(
  audio: Blob,
  filename: string,
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: form,
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq transcription failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    text?: string;
    duration?: number;
    words?: Array<{ word: string; start: number; end: number }>;
    segments?: Array<{ text: string; start: number; end: number }>;
  };

  const text = (data.text ?? "").trim();
  const words =
    data.words?.map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
    })) ?? [];

  let durationSeconds = data.duration ?? 0;
  if (!durationSeconds && words.length > 0) {
    durationSeconds = Math.ceil(words.at(-1)?.end ?? 0);
  }
  if (!durationSeconds && data.segments?.length) {
    durationSeconds = Math.ceil(data.segments.at(-1)?.end ?? 0);
  }

  return { text, words, durationSeconds };
}

export function buildTranscriptFromWords(
  words: GroqWord[],
  fallbackText: string,
): TranscriptSegment[] {
  if (words.length === 0) {
    return tokenizePlainText(fallbackText);
  }

  const transcriptWords: TranscriptWord[] = words.map((item, index) => {
    const text = item.word.trim();
    const stripped = text.replace(/[.,!?;:"']+/g, "").toLowerCase();
    const startMs = Math.round((item.start ?? index * 0.35) * 1000);
    const endMs = Math.round((item.end ?? (item.start ?? index * 0.35) + 0.3) * 1000);

    return {
      text,
      startMs,
      endMs,
      isFiller: FILLER_TOKENS.has(stripped),
      isSlurred: false,
    };
  });

  markPhraseFillers(transcriptWords);

  return [
    {
      id: "seg-1",
      startMs: transcriptWords[0]?.startMs ?? 0,
      endMs: transcriptWords.at(-1)?.endMs ?? 0,
      speaker: "user",
      words: transcriptWords,
      issues: transcriptWords.some((word) => word.isFiller) ? ["filler"] : [],
    },
  ];
}

function tokenizePlainText(text: string): TranscriptSegment[] {
  const tokens = text.match(/\S+/g) ?? [];
  if (tokens.length === 0) {
    return [
      {
        id: "seg-1",
        startMs: 0,
        endMs: 1000,
        speaker: "user",
        words: [],
        issues: [],
      },
    ];
  }

  let cursor = 0;
  const words: TranscriptWord[] = tokens.map((token) => {
    const duration = Math.max(180, token.length * 45);
    const stripped = token.replace(/[.,!?;:"']+/g, "").toLowerCase();
    const word: TranscriptWord = {
      text: token,
      startMs: cursor,
      endMs: cursor + duration,
      isFiller: FILLER_TOKENS.has(stripped),
      isSlurred: false,
    };
    cursor += duration + 40;
    return word;
  });

  markPhraseFillers(words);

  return [
    {
      id: "seg-1",
      startMs: words[0]?.startMs ?? 0,
      endMs: words.at(-1)?.endMs ?? cursor,
      speaker: "user",
      words,
      issues: words.some((word) => word.isFiller) ? ["filler"] : [],
    },
  ];
}

function markPhraseFillers(words: TranscriptWord[]) {
  for (let i = 0; i < words.length; i += 1) {
    for (const phrase of FILLER_PHRASES) {
      const parts = phrase.split(" ");
      const slice = words.slice(i, i + parts.length);
      if (slice.length !== parts.length) continue;

      const matches = slice.every((word, index) => {
        const stripped = word.text.replace(/[.,!?;:"']+/g, "").toLowerCase();
        return stripped === parts[index];
      });

      if (matches) {
        slice.forEach((word) => {
          word.isFiller = true;
        });
      }
    }
  }
}

export function computeMetrics(
  transcript: TranscriptSegment[],
  durationSeconds: number,
): SessionMetrics {
  const words = transcript.flatMap((segment) => segment.words);
  const fillerWordCount = words.filter((word) => word.isFiller).length;
  const totalWords = Math.max(words.length, 1);
  const fillerRatio = fillerWordCount / totalWords;
  const wpm =
    durationSeconds > 0 ? (words.length / durationSeconds) * 60 : words.length;

  const clarityPercent = clamp(
    Math.round(92 - fillerRatio * 120 - Math.max(0, wpm - 160) * 0.15),
    35,
    98,
  );
  const slurringScore = clamp(Math.round(clarityPercent - 4 + (1 - fillerRatio) * 4), 40, 98);
  const eyeContactPercent = clamp(Math.round(70 + clarityPercent * 0.15), 45, 92);
  const fidgetingScore = clamp(Math.round(68 + (1 - fillerRatio) * 20), 45, 92);
  const overallScore = clamp(
    Math.round(
      clarityPercent * 0.45 +
        (100 - Math.min(fillerWordCount * 4, 40)) * 0.25 +
        eyeContactPercent * 0.15 +
        fidgetingScore * 0.15,
    ),
    40,
    98,
  );

  return {
    overallScore,
    clarityPercent,
    fillerWordCount,
    slurringScore,
    eyeContactPercent,
    fidgetingScore,
  };
}

export async function generateFeedbackWithGroq(input: {
  topic: string;
  mode: AppMode;
  transcriptText: string;
  metrics: SessionMetrics;
}): Promise<FeedbackItem[]> {
  const system =
    input.mode === "clinical"
      ? "You are a supportive speech-language coaching assistant. Be encouraging, concrete, and never diagnose. Return only JSON."
      : "You are a professional interview and presentation coach. Be direct, concrete, and encouraging. Return only JSON.";

  const prompt = {
    topic: input.topic,
    mode: input.mode,
    metrics: input.metrics,
    transcript: input.transcriptText.slice(0, 4000),
    instructions:
      "Return JSON with shape { feedback: [{ id, category, title, body }] }. Provide 3 to 4 items. category must be speech or visual. Keep titles under 70 chars and bodies under 180 chars.",
  };

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(prompt) },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty feedback response");

    const parsed = JSON.parse(content) as {
      feedback?: Array<{
        id?: string;
        category?: string;
        title?: string;
        body?: string;
      }>;
    };

    const items = (parsed.feedback ?? [])
      .map((item, index) => ({
        id: item.id?.trim() || `fb-${index + 1}`,
        category:
          item.category === "visual" ? ("visual" as const) : ("speech" as const),
        title: item.title?.trim() || "Practice tip",
        body:
          item.body?.trim() ||
          "Focus on one clear improvement in your next session.",
      }))
      .slice(0, 4);

    if (items.length > 0) return items;
  } catch {
    // Fall through to heuristic feedback.
  }

  return heuristicFeedback(input.metrics, input.mode);
}

function heuristicFeedback(
  metrics: SessionMetrics,
  mode: AppMode,
): FeedbackItem[] {
  const fillerLabel = mode === "clinical" ? "disfluencies" : "filler words";
  return [
    {
      id: "fb-1",
      category: "speech",
      title:
        metrics.fillerWordCount > 0
          ? `Reduce ${fillerLabel} with a silent pause`
          : "Keep the clean pacing",
      body:
        metrics.fillerWordCount > 0
          ? `You used ${metrics.fillerWordCount} ${fillerLabel}. Replace the next one with a short breath instead of a word.`
          : "Your transcript stayed clean. Hold that same deliberate pacing next time.",
    },
    {
      id: "fb-2",
      category: "speech",
      title: "Protect clarity on key phrases",
      body: `Clarity landed around ${metrics.clarityPercent}%. Slow the most important sentence by about 10%.`,
    },
    {
      id: "fb-3",
      category: "visual",
      title: "Re-center on the lens",
      body: "After any pause, bring your gaze back to the camera before the next sentence.",
    },
  ];
}

export function createSessionId(): string {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildPracticeSession(input: {
  id: string;
  topic: string;
  mode: AppMode;
  transcriptText: string;
  words: GroqWord[];
  durationSeconds: number;
  feedback: FeedbackItem[];
}): PracticeSession {
  const transcript = buildTranscriptFromWords(input.words, input.transcriptText);
  const metrics = computeMetrics(transcript, input.durationSeconds);

  return {
    id: input.id,
    topic: input.topic,
    startedAt: new Date().toISOString(),
    durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    metrics,
    transcript,
    feedback: input.feedback,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
