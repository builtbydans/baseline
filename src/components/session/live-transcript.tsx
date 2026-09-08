"use client";

import { useSyncExternalStore } from "react";

import { getLiveTranscriptWords } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const words = getLiveTranscriptWords();

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function LiveTranscript({ elapsedMs }: { elapsedMs: number }) {
  const visible = words.filter((word) => word.startMs <= elapsedMs);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Listening for speech…</p>
    );
  }

  return (
    <p className="text-sm leading-7 text-foreground/90">
      {visible.map((word, index) => {
        const isLatest = index === visible.length - 1;
        return (
          <span
            key={`${word.startMs}-${word.text}`}
            className={cn(
              "mr-1 inline-block rounded-sm px-0.5",
              word.isFiller && "bg-destructive/20 text-destructive",
              word.isSlurred && !word.isFiller && "text-amber-300",
              isLatest &&
                !prefersReducedMotion &&
                "animate-in fade-in duration-200",
            )}
          >
            {word.text}
          </span>
        );
      })}
    </p>
  );
}
