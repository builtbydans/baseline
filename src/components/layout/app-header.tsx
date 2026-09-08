"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const { mode, setMode, copy } = useMode();
  const isRoom = pathname === "/session/room";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md",
        isRoom && "hidden",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <AudioLines className="size-4" aria-hidden="true" />
          </span>
          Baseline
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-2.5 py-1">
            <span
              className={cn(
                "text-xs",
                mode === "professional"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Professional
            </span>
            <Switch
              checked={mode === "clinical"}
              onCheckedChange={(checked) =>
                setMode(checked ? "clinical" : "professional")
              }
              aria-label={`Switch to ${copy.otherModeName} mode`}
              size="sm"
            />
            <span
              className={cn(
                "text-xs",
                mode === "clinical"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Clinical
            </span>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {copy.modeName} mode
          </Badge>
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs">AL</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
