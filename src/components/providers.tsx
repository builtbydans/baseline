"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeProvider } from "@/lib/mode-context";
import { SessionProvider } from "@/lib/session-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <ModeProvider>
        <SessionProvider>{children}</SessionProvider>
      </ModeProvider>
    </TooltipProvider>
  );
}
