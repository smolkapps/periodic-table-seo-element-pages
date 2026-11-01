/**
 * Device-local storage for optional saved Chemistry Tutor conversations.
 *
 * Privacy & Honesty Guarantee:
 * - Starts 100% empty on a fresh device (zero fake or seeded conversations).
 * - Stored only in this browser's `localStorage` under `elementa_tutor_sessions_v1`.
 * - Never writes to any cloud entity or shared learner record.
 */
import { useState, useEffect, useCallback } from "react";
import { STORAGE_UNAVAILABLE_MESSAGE, STORAGE_FULL_MESSAGE, STORAGE_BLOCKED_MESSAGE } from "./progressStore.js";

export const TUTOR_SESSIONS_KEY = "elementa_tutor_sessions_v1";
export const MAX_SAVED_TUTOR_SESSIONS = 15;

function getDefaultStorage() {
  try {
    if (typeof localStorage === "undefined" || !localStorage) return null;
    return localStorage;
  } catch {
    return null;
  }
}

function isStorageUsable(storage) {
  if (!storage) return false;
  try {
    const probe = "__elementa_tutor_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeTutorSessions(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.id !== "string" || typeof item.elementSlug !== "string") continue;
    if (!Array.isArray(item.messages) || item.messages.length === 0) continue;
    out.push({
      id: item.id,
      title: typeof item.title === "string" ? item.title.slice(0, 120) : item.elementSlug,
      elementSlug: item.elementSlug,
      level: typeof item.level === "string" ? item.level : "ap",
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
      messages: item.messages.slice(-20).map((m) => ({
        id: String(m.id || `msg-${Math.random()}`),
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content || "").slice(0, 4000),
        mode: m.mode === "live_ai" ? "live_ai" : "local_coach",
        sourceBadge: String(m.sourceBadge || "Guided Socratic Coach (Local Dataset — Not Live AI)"),
        misconceptionAddressed: m.misconceptionAddressed || null,
        hints: Array.isArray(m.hints) ? m.hints.slice(0, 3) : [],
        diagnosticQuestion: m.diagnosticQuestion || null,
        visualizerFocus: m.visualizerFocus || null,
        modelCaveat: m.modelCaveat || null,
        citations: Array.isArray(m.citations) ? m.citations.slice(0, 4) : [],
      })),
    });
    if (out.length >= MAX_SAVED_TUTOR_SESSIONS) break;
  }
  return out;
}

export function readTutorSessions(storage = getDefaultStorage()) {
  if (!isStorageUsable(storage)) {
    return { sessions: [], error: STORAGE_UNAVAILABLE_MESSAGE };
  }
  try {
    const raw = storage.getItem(TUTOR_SESSIONS_KEY);
    if (!raw) return { sessions: [], error: null };
    return { sessions: sanitizeTutorSessions(JSON.parse(raw)), error: null };
  } catch {
    return {
      sessions: [],
      error: "Saved tutor sessions in this browser were unreadable and have been reset.",
    };
  }
}

export function writeTutorSessions(sessions, storage = getDefaultStorage()) {
  if (!isStorageUsable(storage)) {
    return { ok: false, error: STORAGE_UNAVAILABLE_MESSAGE };
  }
  try {
    const clean = sanitizeTutorSessions(sessions);
    storage.setItem(TUTOR_SESSIONS_KEY, JSON.stringify(clean));
    return { ok: true, sessions: clean, error: null };
  } catch (err) {
    const isQuota =
      err && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22);
    return { ok: false, error: isQuota ? STORAGE_FULL_MESSAGE : STORAGE_BLOCKED_MESSAGE };
  }
}

export function useTutorSessions() {
  const [state, setState] = useState(() => readTutorSessions());

  const refresh = useCallback(() => {
    setState(readTutorSessions());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  const saveSession = useCallback((session) => {
    const current = readTutorSessions().sessions;
    const filtered = current.filter((s) => s.id !== session.id);
    const next = [session, ...filtered].slice(0, MAX_SAVED_TUTOR_SESSIONS);
    const res = writeTutorSessions(next);
    setState({ sessions: res.ok ? res.sessions : current, error: res.error });
    return res;
  }, []);

  const deleteSession = useCallback((sessionId) => {
    const current = readTutorSessions().sessions;
    const next = current.filter((s) => s.id !== sessionId);
    const res = writeTutorSessions(next);
    setState({ sessions: res.ok ? res.sessions : current, error: res.error });
    return res;
  }, []);

  const clearAllSessions = useCallback(() => {
    const res = writeTutorSessions([]);
    setState({ sessions: [], error: res.error });
    return res;
  }, []);

  return {
    savedSessions: state.sessions,
    tutorStorageError: state.error,
    saveSession,
    deleteSession,
    clearAllSessions,
  };
}