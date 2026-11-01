import { useCallback, useEffect, useState } from "react";
import { getElementBySlug } from "@/data/elementsData";
import {
  MAX_NOTE_LENGTH,
  MAX_QUIZ_HISTORY,
  buildExportPayload,
  readProgress,
  validateImport,
  writeProgress,
} from "@/lib/progressStore";

// One shared in-memory snapshot so every component (navbar, table, quiz) sees
// exactly the same device-local progress without re-reading storage per mount.
let cachedProgress = null;
let cachedStorageError = null;
const listeners = new Set();

function ensureLoaded() {
  if (cachedProgress) return;
  const { progress, error } = readProgress();
  cachedProgress = progress;
  cachedStorageError = error;
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(nextProgress) {
  cachedProgress = nextProgress;
  const result = writeProgress(nextProgress);
  cachedStorageError = result.ok ? null : result.error;
  emit();
  return result;
}

function reloadFromStorage() {
  const { progress, error } = readProgress();
  cachedProgress = progress;
  cachedStorageError = error;
  emit();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function useStudyProgress() {
  ensureLoaded();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((version) => version + 1);
    listeners.add(listener);

    // Keep two tabs of the same origin consistent.
    const onStorageEvent = (event) => {
      if (!event.key || event.key.startsWith("elementa_")) reloadFromStorage();
    };
    window.addEventListener("storage", onStorageEvent);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorageEvent);
    };
  }, []);

  const toggleSavedSlug = useCallback((slug) => {
    const element = getElementBySlug(slug);
    if (!element) return false;
    const exists = cachedProgress.savedSlugs.includes(element.slug);
    const savedSlugs = exists
      ? cachedProgress.savedSlugs.filter((saved) => saved !== element.slug)
      : [...cachedProgress.savedSlugs, element.slug];
    commit({ ...cachedProgress, savedSlugs });
    return !exists;
  }, []);

  const saveElementNote = useCallback((slug, noteText) => {
    const element = getElementBySlug(slug);
    if (!element) return;
    const notesMap = { ...cachedProgress.notesMap };
    const trimmed = String(noteText ?? "").slice(0, MAX_NOTE_LENGTH);
    if (trimmed.trim().length === 0) {
      delete notesMap[element.slug];
    } else {
      notesMap[element.slug] = trimmed;
    }
    commit({ ...cachedProgress, notesMap });
  }, []);

  const toggleMasteredManual = useCallback((slug) => {
    const element = getElementBySlug(slug);
    if (!element) return;
    const masteryMap = { ...cachedProgress.masteryMap };
    const previous = masteryMap[element.slug] || { attempts: 1, correct: 0, mastered: false };
    const mastered = !previous.mastered;
    masteryMap[element.slug] = {
      attempts: Math.max(previous.attempts, 1),
      correct: mastered ? Math.max(previous.correct, 1) : previous.correct,
      mastered,
      lastPracticed: todayIsoDate(),
    };
    commit({ ...cachedProgress, masteryMap });
  }, []);

  const recordQuizResult = useCallback(({ mode, score, total, perElementResults }) => {
    const masteryMap = { ...cachedProgress.masteryMap };
    const today = todayIsoDate();
    const missedSlugs = [];

    for (const item of perElementResults || []) {
      const element = getElementBySlug(item.slug);
      if (!element) continue;
      const previous = masteryMap[element.slug] || { attempts: 0, correct: 0, mastered: false };
      const attempts = previous.attempts + 1;
      const correct = previous.correct + (item.isCorrect ? 1 : 0);
      masteryMap[element.slug] = {
        attempts,
        correct,
        mastered: correct >= 2 && correct / attempts >= 0.7,
        lastPracticed: today,
      };
      if (!item.isCorrect && !missedSlugs.includes(element.slug)) {
        missedSlugs.push(element.slug);
      }
    }

    const safeTotal = Number(total) > 0 ? Number(total) : 0;
    const safeScore = Math.min(Math.max(0, Number(score) || 0), safeTotal);
    const session = {
      id: `quiz-${Date.now()}`,
      mode: mode || "Practice",
      score: safeScore,
      total: safeTotal,
      accuracy: safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0,
      date: today,
      missedSlugs,
    };

    const quizHistory = [session, ...cachedProgress.quizHistory].slice(0, MAX_QUIZ_HISTORY);
    // Missed elements go into the study deck so they can be reviewed.
    const savedSlugs = Array.from(new Set([...cachedProgress.savedSlugs, ...missedSlugs]));

    commit({ savedSlugs, masteryMap, notesMap: cachedProgress.notesMap, quizHistory });
    return session;
  }, []);

  const importStudyData = useCallback((raw) => {
    const result = validateImport(raw);
    if (!result.ok) return result;
    const write = commit(result.progress);
    return {
      ok: true,
      summary: result.summary,
      warning: write.ok ? null : write.error,
    };
  }, []);

  const exportStudyData = useCallback(() => buildExportPayload(cachedProgress), []);

  return {
    savedSlugs: cachedProgress.savedSlugs,
    masteryMap: cachedProgress.masteryMap,
    notesMap: cachedProgress.notesMap,
    quizHistory: cachedProgress.quizHistory,
    storageError: cachedStorageError,
    toggleSavedSlug,
    saveElementNote,
    toggleMasteredManual,
    recordQuizResult,
    importStudyData,
    exportStudyData,
  };
}