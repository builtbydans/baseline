import type { PracticeSession } from "@/lib/types";

const globalStore = globalThis as typeof globalThis & {
  __claritySessions?: Map<string, PracticeSession>;
};

function getMap(): Map<string, PracticeSession> {
  if (!globalStore.__claritySessions) {
    globalStore.__claritySessions = new Map();
  }
  return globalStore.__claritySessions;
}

export function saveSession(session: PracticeSession): void {
  getMap().set(session.id, session);
}

export function getStoredSession(id: string): PracticeSession | undefined {
  return getMap().get(id);
}

export function listStoredSessions(): PracticeSession[] {
  return [...getMap().values()].sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}
