"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Circle, Mic, Square } from "lucide-react";

import { FacialTrackingOverlay } from "@/components/session/facial-tracking-overlay";
import { Button } from "@/components/ui/button";
import { cacheSessionLocally } from "@/lib/local-sessions";
import { formatClock } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { useSessionDraft } from "@/lib/session-context";
import type { PracticeSession } from "@/lib/types";

type RoomPhase = "idle" | "ready" | "recording" | "analyzing";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function describeMediaError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Could not access devices. Try again from this page.";
  }

  const name = "name" in error ? String(error.name) : "";
  const message = error.message || "Unknown media error";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Browser blocked the mic. Use the padlock/site settings for this exact URL (localhost vs 127.0.0.1 are different), allow Microphone, then click Enable devices.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found. Plug one in or check macOS System Settings → Privacy & Security → Microphone.";
    case "NotReadableError":
    case "TrackStartError":
      return "The mic/camera is busy (Zoom, Meet, another tab). Close other apps using it, then click Enable devices.";
    case "OverconstrainedError":
      return "This device rejected the requested audio settings. Click Enable devices to retry with defaults.";
    case "SecurityError":
      return "Media capture needs a secure context. Open http://localhost:3000 (not a file:// or blocked host).";
    case "AbortError":
      return "Device setup was interrupted. Click Enable devices to retry.";
    default:
      return `${name || "MediaError"}: ${message}`;
  }
}

export function InterviewRoom() {
  const router = useRouter();
  const { copy, mode } = useMode();
  const { draft } = useSessionDraft();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | undefined>(undefined);
  const audioStreamRef = useRef<MediaStream | undefined>(undefined);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasPreview, setHasPreview] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [hasChunks, setHasChunks] = useState(false);
  const [phase, setPhase] = useState<RoomPhase>("idle");
  const [status, setStatus] = useState(
    "Enable your microphone first. Recording will not start until you choose Start recording.",
  );
  const [error, setError] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState(0);

  const topic = draft.topic.trim() || "Practice session";
  const isRecording = phase === "recording";
  const isReady = phase === "ready";
  const isAnalyzing = phase === "analyzing";

  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(() => {
      setElapsedMs((current) => current + 120);
    }, 120);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (deviceToken === 0) return;

    let cancelled = false;
    let previewStream: MediaStream | undefined;
    let audioStream: MediaStream | undefined;

    function stopStreams() {
      previewStream?.getTracks().forEach((track) => track.stop());
      audioStream?.getTracks().forEach((track) => track.stop());
    }

    async function enableDevices() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "This browser does not support getUserMedia. Try Chrome or Edge on http://localhost:3000.",
        );
        setStatus("Devices unavailable");
        setPhase("idle");
        return;
      }

      setError(null);
      setPhase("idle");
      setHasPreview(false);
      setAudioOnly(false);
      setHasChunks(false);
      setElapsedMs(0);
      setStatus("Requesting microphone…");

      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stopStreams();
          return;
        }
        audioStreamRef.current = audioStream;

        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
          if (cancelled) {
            videoOnly.getTracks().forEach((track) => track.stop());
            stopStreams();
            return;
          }
          previewStream = videoOnly;
          previewStreamRef.current = videoOnly;
          if (videoRef.current) {
            videoRef.current.srcObject = videoOnly;
            try {
              await videoRef.current.play();
            } catch {
              // Preview autoplay quirks should not block readiness.
            }
          }
          setHasPreview(true);
          setAudioOnly(false);
          setStatus("Devices ready. Click Start recording when you want to begin.");
        } catch {
          setHasPreview(false);
          setAudioOnly(true);
          setStatus(
            "Microphone ready (camera unavailable). Click Start recording when you want to begin.",
          );
        }

        if (cancelled) {
          stopStreams();
          return;
        }

        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        stopStreams();
        audioStreamRef.current = undefined;
        previewStreamRef.current = undefined;
        setHasPreview(false);
        setPhase("idle");
        setStatus("Waiting for devices");
        setError(describeMediaError(err));
      }
    }

    void enableDevices();

    return () => {
      cancelled = true;
      if (recorderRef.current?.state === "recording") {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      recorderRef.current = null;
      previewStreamRef.current = undefined;
      audioStreamRef.current = undefined;
      stopStreams();
    };
  }, [deviceToken]);

  function startRecording() {
    const audioStream = audioStreamRef.current;
    if (!audioStream) {
      setError("Enable devices before starting a recording.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("MediaRecorder is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(audioStream, { mimeType })
        : new MediaRecorder(audioStream);

      chunksRef.current = [];
      setHasChunks(false);
      setElapsedMs(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setHasChunks(true);
        }
      };
      recorder.onerror = () => {
        setError("MediaRecorder failed while capturing audio.");
        setPhase("ready");
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setPhase("recording");
      setStatus(
        audioOnly
          ? "Recording audio — speak naturally about your topic"
          : "Recording — speak naturally about your topic",
      );
    } catch (err) {
      setError(describeMediaError(err));
      setPhase("ready");
    }
  }

  async function stopRecorder(): Promise<Blob | null> {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      if (chunksRef.current.length === 0) return null;
      return new Blob(chunksRef.current, {
        type: recorder?.mimeType || "audio/webm",
      });
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        resolve(blob);
      };
      try {
        recorder.requestData();
      } catch {
        // optional
      }
      recorder.stop();
    });
  }

  async function endSession() {
    setError(null);
    setPhase("analyzing");
    setStatus("Uploading and transcribing with Groq…");

    try {
      const blob = await stopRecorder();
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;

      if (!blob || blob.size < 500) {
        throw new Error(
          "Recording was too short. Speak for a few seconds, then try again.",
        );
      }

      const extension = blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      const form = new FormData();
      form.append("audio", blob, `session.${extension}`);
      form.append("topic", topic);
      form.append("mode", mode);
      form.append(
        "durationSeconds",
        String(Math.max(1, Math.round(elapsedMs / 1000))),
      );

      const response = await fetch("/api/sessions", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        session?: PracticeSession;
        error?: string;
      };

      if (!response.ok || !payload.session) {
        throw new Error(payload.error || "Analysis failed.");
      }

      cacheSessionLocally(payload.session);
      router.push(`/session/results/${payload.session.id}?fresh=1`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not finish the session.";
      setError(message);
      setHasPreview(false);
      setAudioOnly(false);
      setHasChunks(false);
      setPhase("idle");
      setStatus(
        "Upload failed. Enable devices again, then start a new recording.",
      );
    }
  }

  function enableDevices() {
    setError(null);
    setStatus("Requesting microphone…");
    setDeviceToken((value) => value + 1);
  }

  if (isAnalyzing) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <div className="space-y-2">
          <h1 className="text-xl font-medium">{copy.room.analyzingTitle}</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {copy.room.analyzingBody}
          </p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {copy.room.title}
          </p>
          <h1 className="text-sm font-medium sm:text-base">{topic}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              isRecording
                ? "inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive"
                : "inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
            }
          >
            <span className="relative flex size-2">
              {isRecording ? (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
              ) : null}
              <span
                className={
                  isRecording
                    ? "relative inline-flex size-2 rounded-full bg-destructive"
                    : "relative inline-flex size-2 rounded-full bg-muted-foreground"
                }
              />
            </span>
            {isRecording ? copy.room.recording : isReady ? "Ready" : "Standby"}
            <span className="font-mono text-foreground">
              {formatClock(elapsedMs)}
            </span>
          </span>

          {isRecording ? (
            <Button variant="destructive" onClick={() => void endSession()}>
              <Square className="size-3 fill-current" />
              {copy.room.endSession}
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              disabled={!isReady}
            >
              <Circle className="size-3 fill-current" />
              Start recording
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-foreground/10">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={
              hasPreview
                ? "absolute inset-0 h-full w-full object-cover"
                : "hidden"
            }
          />
          {!hasPreview ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1c2430,#09090b_70%)]" />
          ) : null}
          <FacialTrackingOverlay />
          <p className="absolute top-4 left-4 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs text-primary backdrop-blur-sm">
            {isRecording ? copy.room.trackingLabel : "Preview"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Session capture
          </p>
          <p className="text-sm text-foreground/90">{status}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            1) Enable devices · 2) Start recording · 3) End session for Groq analysis.
            `localhost` and `127.0.0.1` permissions are separate.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(phase === "idle" || error) && (
              <Button type="button" variant="outline" onClick={enableDevices}>
                <Mic />
                Enable devices
              </Button>
            )}
            {isReady && (
              <Button type="button" onClick={startRecording}>
                <Circle className="size-3 fill-current" />
                Start recording
              </Button>
            )}
            {isRecording && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void endSession()}
                disabled={!hasChunks && elapsedMs < 1000}
              >
                <Square className="size-3 fill-current" />
                {copy.room.endSession}
              </Button>
            )}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
