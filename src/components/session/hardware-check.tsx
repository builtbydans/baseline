"use client";

import { useEffect, useState } from "react";
import { Camera, Check, LoaderCircle, Mic } from "lucide-react";

import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

type DeviceStatus = "checking" | "ready" | "missing";

export function HardwareCheck() {
  const { copy } = useMode();
  const [camera, setCamera] = useState<DeviceStatus>("checking");
  const [microphone, setMicrophone] = useState<DeviceStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      await wait(700);
      if (cancelled) return;

      try {
        await navigator.mediaDevices.enumerateDevices();
      } catch {
        // Phase 1 is UI-only; always resolve as connected.
      }
      setCamera("ready");
      setMicrophone("ready");
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{copy.setup.hardwareTitle}</p>
      <DeviceRow
        label={copy.setup.cameraLabel}
        icon={Camera}
        status={camera}
      />
      <DeviceRow
        label={copy.setup.microphoneLabel}
        icon={Mic}
        status={microphone}
      />
    </div>
  );
}

function DeviceRow({
  label,
  icon: Icon,
  status,
}: {
  label: string;
  icon: typeof Camera;
  status: DeviceStatus;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          status === "ready" && "text-emerald-400",
          status === "checking" && "text-muted-foreground",
          status === "missing" && "text-destructive",
        )}
      >
        {status === "checking" ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-3.5" aria-hidden="true" />
        )}
        {status === "checking" ? "Checking" : "Connected"}
      </span>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
