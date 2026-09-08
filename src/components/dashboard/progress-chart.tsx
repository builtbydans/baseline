"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { mockTrend } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";

const chartConfig = {
  clarity: {
    label: "Speech clarity",
    color: "var(--chart-1)",
  },
  fillerWords: {
    label: "Fillers",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ProgressChart() {
  const { copy } = useMode();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.dashboard.chartTitle}</CardTitle>
        <CardDescription>{copy.dashboard.chartDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <LineChart data={mockTrend} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="clarity"
              tickLine={false}
              axisLine={false}
              width={32}
              domain={[50, 100]}
            />
            <YAxis
              yAxisId="fillers"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={28}
              domain={[0, 20]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              yAxisId="clarity"
              type="monotone"
              dataKey="clarity"
              stroke="var(--color-clarity)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={copy.dashboard.claritySeries}
            />
            <Line
              yAxisId="fillers"
              type="monotone"
              dataKey="fillerWords"
              stroke="var(--color-fillerWords)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={copy.dashboard.fillerSeries}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
