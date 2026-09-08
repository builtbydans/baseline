"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_SESSION_DRAFT,
  type SessionDraft,
} from "@/lib/types";

const STORAGE_KEY = "clarity-session-draft";
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined = undefined;
let cachedDraft: SessionDraft = DEFAULT_SESSION_DRAFT;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SessionDraft {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedDraft;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedDraft = DEFAULT_SESSION_DRAFT;
    return cachedDraft;
  }

  try {
    cachedDraft = { ...DEFAULT_SESSION_DRAFT, ...JSON.parse(raw) } as SessionDraft;
  } catch {
    cachedDraft = DEFAULT_SESSION_DRAFT;
  }
  return cachedDraft;
}

function getServerSnapshot(): SessionDraft {
  return DEFAULT_SESSION_DRAFT;
}

function writeDraft(draft: SessionDraft) {
  const raw = JSON.stringify(draft);
  window.sessionStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedDraft = draft;
  listeners.forEach((listener) => listener());
}

interface SessionContextValue {
  draft: SessionDraft;
  setDraft: (draft: SessionDraft) => void;
  updateDraft: (patch: Partial<SessionDraft>) => void;
  resetDraft: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const draft = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDraft = useCallback((next: SessionDraft) => {
    writeDraft(next);
  }, []);

  const updateDraft = useCallback((patch: Partial<SessionDraft>) => {
    writeDraft({ ...getSnapshot(), ...patch });
  }, []);

  const resetDraft = useCallback(() => {
    writeDraft(DEFAULT_SESSION_DRAFT);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ draft, setDraft, updateDraft, resetDraft }),
    [draft, setDraft, updateDraft, resetDraft],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionDraft(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionDraft must be used within SessionProvider");
  }
  return context;
}
