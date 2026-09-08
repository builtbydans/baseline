"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { COPY, type AppCopy } from "@/lib/copy";
import type { AppMode } from "@/lib/types";

const STORAGE_KEY = "baseline-app-mode";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStoredMode(): AppMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "clinical" ? "clinical" : "professional";
}

function emit() {
  listeners.forEach((listener) => listener());
}

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  copy: AppCopy;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore<AppMode>(
    subscribe,
    readStoredMode,
    () => "professional",
  );

  const setMode = useCallback((next: AppMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    emit();
  }, []);

  const toggleMode = useCallback(() => {
    const next = readStoredMode() === "professional" ? "clinical" : "professional";
    window.localStorage.setItem(STORAGE_KEY, next);
    emit();
  }, []);

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      copy: COPY[mode],
    }),
    [mode, setMode, toggleMode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within ModeProvider");
  }
  return context;
}
