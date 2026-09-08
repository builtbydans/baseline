"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HardwareCheck } from "@/components/session/hardware-check";
import { useMode } from "@/lib/mode-context";
import { useSessionDraft } from "@/lib/session-context";
import type { FrequencyGoal } from "@/lib/types";

export function SetupDialog({
  triggerLabel,
}: {
  triggerLabel: string;
}) {
  const router = useRouter();
  const { copy } = useMode();
  const { draft, updateDraft } = useSessionDraft();
  const [open, setOpen] = useState(false);

  const canStart = draft.topic.trim().length > 2;

  function begin() {
    if (!canStart) return;
    setOpen(false);
    router.push("/session/room");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.setup.title}</DialogTitle>
          <DialogDescription>{copy.setup.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">{copy.setup.topicLabel}</Label>
            <Input
              id="topic"
              value={draft.topic}
              onChange={(event) => updateDraft({ topic: event.target.value })}
              placeholder={copy.setup.topicPlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="frequency">{copy.setup.frequencyLabel}</Label>
              <Select
                value={draft.frequency}
                onValueChange={(value) =>
                  updateDraft({ frequency: value as FrequencyGoal })
                }
              >
                <SelectTrigger id="frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{copy.frequency.daily}</SelectItem>
                  <SelectItem value="twice-weekly">
                    {copy.frequency["twice-weekly"]}
                  </SelectItem>
                  <SelectItem value="weekly">{copy.frequency.weekly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">{copy.setup.durationLabel}</Label>
              <Select
                value={String(draft.targetMinutes)}
                onValueChange={(value) =>
                  updateDraft({ targetMinutes: Number(value) })
                }
              >
                <SelectTrigger id="duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <HardwareCheck />
        </div>

        <DialogFooter>
          <Button onClick={begin} disabled={!canStart}>
            {copy.setup.beginCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
