"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, MessageSquareText } from "lucide-react";

import { SetupDialog } from "@/components/session/setup-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getLocalSession } from "@/lib/local-sessions";
import { formatClock, formatDuration, getSessionById } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import type { PracticeSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResultsView({ sessionId }: { sessionId: string }) {
  const { copy } = useMode();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<PracticeSession | null | undefined>(
    undefined,
  );
  const [activeMs, setActiveMs] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setSession(undefined);
      setLoadError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const payload = (await response.json()) as {
            session: PracticeSession;
          };
          if (!cancelled) {
            setSession(payload.session);
          }
          return;
        }
      } catch {
        // Fall through to local/mock.
      }

      const local = getLocalSession(sessionId);
      if (local) {
        if (!cancelled) setSession(local);
        return;
      }

      const mock = getSessionById(sessionId);
      if (mock) {
        if (!cancelled) setSession(mock);
        return;
      }

      if (!cancelled) {
        setSession(null);
        setLoadError("That recording is not available on this device.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const words = useMemo(
    () => session?.transcript.flatMap((segment) => segment.words) ?? [],
    [session],
  );

  if (session === undefined) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-xl font-medium">Session not found</h1>
        <p className="text-sm text-muted-foreground">
          {loadError ?? "That recording is not in the session history."}
        </p>
        <Button asChild>
          <Link href="/">{copy.results.backToHub}</Link>
        </Button>
      </div>
    );
  }

  const isFresh = searchParams.get("fresh") === "1";
  const durationMs = Math.max(session.durationSeconds * 1000, 1);
  const playhead = Math.min(activeMs, durationMs);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {copy.results.kicker}
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            {copy.results.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.topic} · {formatDuration(session.durationSeconds)}
          </p>
          {isFresh ? <Badge>Just completed</Badge> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              {copy.results.backToHub}
            </Link>
          </Button>
          <SetupDialog triggerLabel={copy.results.practiceAgain} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="items-center justify-center py-8">
          <ScoreRing value={session.metrics.overallScore} />
          <p className="text-sm text-muted-foreground">Session score</p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            title={copy.results.speechTitle}
            icon={MessageSquareText}
            rows={[
              {
                label: copy.results.clarity,
                value: `${session.metrics.clarityPercent}%`,
                progress: session.metrics.clarityPercent,
              },
              {
                label: copy.results.fillerWords,
                value: String(session.metrics.fillerWordCount),
                progress: Math.max(0, 100 - session.metrics.fillerWordCount * 6),
              },
              {
                label: copy.results.slurring,
                value: `${session.metrics.slurringScore}%`,
                progress: session.metrics.slurringScore,
              },
            ]}
          />
          <MetricCard
            title={copy.results.visualTitle}
            icon={Eye}
            rows={[
              {
                label: copy.results.eyeContact,
                value: `${session.metrics.eyeContactPercent}%`,
                progress: session.metrics.eyeContactPercent,
              },
              {
                label: copy.results.fidgeting,
                value: `${session.metrics.fidgetingScore}%`,
                progress: session.metrics.fidgetingScore,
              },
            ]}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{copy.results.transcriptTitle}</CardTitle>
          <CardDescription>{copy.results.transcriptHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {formatClock(playhead)}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${(playhead / durationMs) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {formatDuration(session.durationSeconds)}
            </span>
          </div>
          {words.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transcript words.</p>
          ) : (
            <p className="text-base leading-8">
              {words.map((word, index) => (
                <button
                  key={`${word.startMs}-${word.text}-${index}`}
                  type="button"
                  onClick={() => setActiveMs(word.startMs)}
                  className={cn(
                    "mr-1 rounded-sm px-0.5 transition-colors",
                    word.isFiller && "bg-destructive/20 text-destructive",
                    word.isSlurred &&
                      !word.isFiller &&
                      "underline decoration-amber-400/80 underline-offset-4",
                    playhead >= word.startMs &&
                      playhead <= word.endMs &&
                      "bg-primary/20 text-foreground",
                  )}
                >
                  {word.text}
                </button>
              ))}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{copy.results.feedbackTitle}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {session.feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <Badge variant="outline" className="w-fit capitalize">
                  {item.category}
                </Badge>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative size-40">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="fill-none stroke-primary"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-4xl tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Eye;
  rows: Array<{ label: string; value: string; progress: number }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.label} className="space-y-2">
            {index > 0 ? <Separator /> : null}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono">{row.value}</span>
            </div>
            <Progress value={row.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
