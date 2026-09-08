"use client";

import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalSessions } from "@/lib/local-sessions";
import { formatDuration, mockSessions } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";

export function SessionList() {
  const { copy } = useMode();
  const local = useLocalSessions();
  const mockReversed = [...mockSessions].reverse();
  const localIds = new Set(local.map((session) => session.id));
  const sessions = [
    ...local,
    ...mockReversed.filter((session) => !localIds.has(session.id)),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.dashboard.recentTitle}</CardTitle>
        <CardDescription>{copy.dashboard.recentDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sessions.map((session) => {
          const isLive = localIds.has(session.id);
          return (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-sm text-primary">
                {session.metrics.overallScore}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.topic}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(session.startedAt))}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    {formatDuration(session.durationSeconds)}
                  </span>
                </p>
              </div>
              {isLive ? (
                <Badge className="hidden sm:inline-flex">Live</Badge>
              ) : (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {session.metrics.clarityPercent}% {copy.results.clarity}
                </Badge>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/session/results/${session.id}`}>
                  {copy.dashboard.viewResults}
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
