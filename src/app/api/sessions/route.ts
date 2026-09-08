import {
  buildPracticeSession,
  createSessionId,
  generateFeedbackWithGroq,
  transcribeWithGroq,
} from "@/lib/groq";
import { saveSession } from "@/lib/session-store";
import type { AppMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        {
          error:
            "GROQ_API_KEY is missing. Add it to .env.local and restart npm run dev.",
        },
        { status: 500 },
      );
    }

    const form = await request.formData();
    const audioEntry = form.get("audio");
    const topic = String(form.get("topic") ?? "Practice session").trim();
    const modeValue = String(form.get("mode") ?? "professional");
    const mode: AppMode =
      modeValue === "clinical" ? "clinical" : "professional";
    const clientDuration = Number(form.get("durationSeconds") ?? 0);

    if (!(audioEntry instanceof Blob)) {
      return Response.json(
        { error: "Missing audio recording." },
        { status: 400 },
      );
    }

    const audio = audioEntry;

    if (audio.size < 500) {
      return Response.json(
        {
          error:
            "Recording was too short. Speak for a few seconds, then end the session.",
        },
        { status: 400 },
      );
    }

    const filename =
      "name" in audio && typeof audio.name === "string" && audio.name
        ? audio.name
        : "session.webm";

    const transcription = await transcribeWithGroq(audio, filename);
    const durationSeconds = Math.max(
      1,
      Math.round(transcription.durationSeconds || clientDuration || 1),
    );

    if (!transcription.text) {
      return Response.json(
        {
          error:
            "No speech detected. Check your microphone and try a slightly longer take.",
        },
        { status: 422 },
      );
    }

    const draftMetricsSession = buildPracticeSession({
      id: "draft",
      topic: topic || "Practice session",
      mode,
      transcriptText: transcription.text,
      words: transcription.words,
      durationSeconds,
      feedback: [],
    });

    const feedback = await generateFeedbackWithGroq({
      topic: topic || "Practice session",
      mode,
      transcriptText: transcription.text,
      metrics: draftMetricsSession.metrics,
    });

    const session = buildPracticeSession({
      id: createSessionId(),
      topic: topic || "Practice session",
      mode,
      transcriptText: transcription.text,
      words: transcription.words,
      durationSeconds,
      feedback,
    });

    saveSession(session);

    return Response.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze session.";
    console.error("[api/sessions]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { listStoredSessions } = await import("@/lib/session-store");
  return Response.json({ sessions: listStoredSessions() });
}
