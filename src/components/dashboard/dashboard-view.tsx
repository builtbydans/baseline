"use client";

import dynamic from "next/dynamic";
import { Activity, MessageSquareText, Sparkles, TrendingUp } from "lucide-react";

import { SetupDialog } from "@/components/session/setup-dialog";
import { SessionList } from "@/components/dashboard/session-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalSessions } from "@/lib/local-sessions";
import { latestSession, mockSessions, mockTrend } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";

const ProgressChart = dynamic(
  () =>
    import("@/components/dashboard/progress-chart").then(
      (mod) => mod.ProgressChart,
    ),
  {
    loading: () => (
      <div className="h-80 rounded-xl bg-card ring-1 ring-foreground/10" />
    ),
  },
);

export function DashboardView() {
  const { copy } = useMode();
  const localSessions = useLocalSessions();
  const featured = localSessions[0] ?? latestSession;
  const previous =
    localSessions[1] ??
    mockSessions[mockSessions.length - 2] ??
    latestSession;
  const sessionCount = localSessions.length + mockSessions.length;

  const clarityDelta =
    featured.metrics.clarityPercent - previous.metrics.clarityPercent;
  const fillerDelta =
    featured.metrics.fillerWordCount - previous.metrics.fillerWordCount;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {copy.dashboard.kicker}
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            {copy.dashboard.title}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {copy.dashboard.subtitle}
          </p>
        </div>
        <SetupDialog triggerLabel={copy.dashboard.startCta} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={copy.dashboard.latestScore}
          value={String(featured.metrics.overallScore)}
          hint={featured.topic}
          icon={Sparkles}
        />
        <KpiCard
          title={copy.dashboard.clarityTrend}
          value={`${featured.metrics.clarityPercent}%`}
          hint={`${clarityDelta >= 0 ? "+" : ""}${clarityDelta} vs last session`}
          icon={TrendingUp}
        />
        <KpiCard
          title={copy.dashboard.fillerTrend}
          value={String(featured.metrics.fillerWordCount)}
          hint={`${fillerDelta} vs last session`}
          icon={MessageSquareText}
        />
        <KpiCard
          title={copy.dashboard.sessionCount}
          value={String(sessionCount)}
          hint={`${mockTrend.length} sample weeks + live takes`}
          icon={Activity}
        />
      </section>

      <ProgressChart />
      <SessionList />
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Sparkles;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
