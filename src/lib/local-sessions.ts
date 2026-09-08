"use client";

import { useSyncExternalStore } from "react";

import type { PracticeSession } from "@/lib/types";

const STORAGE_KEY = "clarity-real-sessions";
const MAX_SESSIONS = 20;
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined = undefined;
let cachedSessions: PracticeSession[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function parseSessions(raw: string | null): PracticeSession[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PracticeSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSnapshot(): PracticeSession[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSessions;
  cachedRaw = raw;
  cachedSessions = parseSessions(raw);
  return cachedSessions;
}

function getServerSnapshot(): PracticeSession[] {
  return [];
}

export function cacheSessionLocally(session: PracticeSession): void {
  if (typeof window === "undefined") return;
  const existing = getSnapshot().filter((item) => item.id !== session.id);
  const next = [session, ...existing].slice(0, MAX_SESSIONS);
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSessions = next;
  emit();
}

export function readLocalSessions(): PracticeSession[] {
  if (typeof window === "undefined") return [];
  return getSnapshot();
}

export function getLocalSession(id: string): PracticeSession | undefined {
  return readLocalSessions().find((session) => session.id === id);
}

export function useLocalSessions(): PracticeSession[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useLocalSession(id: string): PracticeSession | undefined {
  const sessions = useLocalSessions();
  return sessions.find((session) => session.id === id);
}
