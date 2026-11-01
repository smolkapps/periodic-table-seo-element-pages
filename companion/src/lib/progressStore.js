/**
 * Elementa device-local study progress.
 *
 * Progress lives only in this browser's localStorage. There is no account,
 * no server record and no shared learner row: nothing here performs a network
 * request, so studying works offline and does not require sign-up.
 *
 * This module is deliberately free of React and of any Base44 SDK import so the
 * persistence + import-validation rules can be unit tested with node:test.
 */
import { getElementBySlug } from "../data/elementsData.js";

export const STORAGE_KEYS = {
  SAVED_SLUGS: "elementa_saved_slugs_v3",
  MASTERY: "elementa_mastery_v3",
  NOTES: "elementa_notes_v3",
  QUIZ_HISTORY: "elementa_quiz_history_v3",
};

export const SCHEMA_VERSION = 3;
export const MAX_QUIZ_HISTORY = 25;
export const MAX_NOTE_LENGTH = 4000;

export const EMPTY_PROGRESS = Object.freeze({
  savedSlugs: [],
  masteryMap: {},
  notesMap: {},
  quizHistory: [],
});

export const STORAGE_UNAVAILABLE_MESSAGE =
  "Progress can't be saved in this browser: local storage is unavailable (private or restricted browsing). Changes you make now will disappear when you reload.";

export const STORAGE_FULL_MESSAGE =
  "This browser's storage for Elementa is full, so your latest change was not saved. Export your progress, then remove some study notes to free space.";

export const STORAGE_BLOCKED_MESSAGE =
  "Your browser blocked saving progress for this site. Allow site data for Elementa (or leave private browsing) so your study deck survives a reload.";

function getDefaultStorage() {
  try {
    if (typeof localStorage === "undefined" || !localStorage) return null;
    return localStorage;
  } catch {
    return null;
  }
}

function isUsable(storage) {
  if (!storage) return false;
  try {
    const probe = "__elementa_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readJson(storage, key) {
  let raw = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { ok: false, value: null };
  }
  if (raw === null || raw === undefined) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: null };
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeSavedSlugs(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const element = getElementBySlug(raw);
    if (!element || seen.has(element.slug)) continue;
    seen.add(element.slug);
    out.push(element.slug);
  }
  return out;
}

export function sanitizeMasteryMap(value) {
  if (!isPlainObject(value)) return {};
  const out = {};
  for (const [slug, stats] of Object.entries(value)) {
    if (!getElementBySlug(slug) || !isPlainObject(stats)) continue;
    const attempts = Number(stats.attempts);
    const correct = Number(stats.correct);
    if (!Number.isFinite(attempts) || !Number.isFinite(correct)) continue;
    out[slug] = {
      attempts: Math.max(0, Math.floor(attempts)),
      correct: Math.max(0, Math.floor(correct)),
      mastered: stats.mastered === true,
      lastPracticed: typeof stats.lastPracticed === "string" ? stats.lastPracticed : null,
    };
  }
  return out;
}

export function sanitizeNotesMap(value) {
  if (!isPlainObject(value)) return {};
  const out = {};
  for (const [slug, note] of Object.entries(value)) {
    if (!getElementBySlug(slug) || typeof note !== "string") continue;
    const trimmed = note.slice(0, MAX_NOTE_LENGTH);
    if (trimmed.trim().length === 0) continue;
    out[slug] = trimmed;
  }
  return out;
}

export function sanitizeQuizSession(value) {
  if (!isPlainObject(value)) return null;
  const mode = typeof value.mode === "string" ? value.mode.trim() : "";
  const total = Number(value.total);
  const score = Number(value.score);
  if (!mode || !Number.isFinite(total) || total <= 0 || !Number.isFinite(score)) return null;
  const boundedScore = Math.min(Math.max(0, Math.floor(score)), Math.floor(total));
  const accuracy = Math.round((boundedScore / total) * 100);
  return {
    id: typeof value.id === "string" && value.id ? value.id : `session-${accuracy}-${Math.floor(total)}`,
    mode,
    score: boundedScore,
    total: Math.floor(total),
    accuracy,
    date: typeof value.date === "string" ? value.date : "",
    missedSlugs: sanitizeSavedSlugs(value.missedSlugs),
  };
}

export function sanitizeQuizHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(sanitizeQuizSession)
    .filter(Boolean)
    .slice(0, MAX_QUIZ_HISTORY);
}

export function sanitizeProgress(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    savedSlugs: sanitizeSavedSlugs(source.savedSlugs),
    masteryMap: sanitizeMasteryMap(source.masteryMap),
    notesMap: sanitizeNotesMap(source.notesMap),
    quizHistory: sanitizeQuizHistory(source.quizHistory),
  };
}

/**
 * Read progress from a Storage-like object. On a device that has never studied,
 * every collection is genuinely empty (no sample quizzes, notes or mastery).
 */
export function readProgress(storage = getDefaultStorage()) {
  if (!isUsable(storage)) {
    return {
      progress: { ...EMPTY_PROGRESS },
      storageAvailable: false,
      error: STORAGE_UNAVAILABLE_MESSAGE,
      recovered: false,
    };
  }

  let recovered = false;
  const read = (key) => {
    const result = readJson(storage, key);
    if (!result.ok) recovered = true;
    return result.value;
  };

  const progress = {
    savedSlugs: sanitizeSavedSlugs(read(STORAGE_KEYS.SAVED_SLUGS)),
    masteryMap: sanitizeMasteryMap(read(STORAGE_KEYS.MASTERY)),
    notesMap: sanitizeNotesMap(read(STORAGE_KEYS.NOTES)),
    quizHistory: sanitizeQuizHistory(read(STORAGE_KEYS.QUIZ_HISTORY)),
  };

  return {
    progress,
    storageAvailable: true,
    error: recovered
      ? "Some saved study data was unreadable and has been reset. Your other progress is unchanged."
      : null,
    recovered,
  };
}

export function writeProgress(progress, storage = getDefaultStorage()) {
  if (!isUsable(storage)) {
    return { ok: false, error: STORAGE_UNAVAILABLE_MESSAGE };
  }
  try {
    storage.setItem(STORAGE_KEYS.SAVED_SLUGS, JSON.stringify(progress.savedSlugs));
    storage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(progress.masteryMap));
    storage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(progress.notesMap));
    storage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(progress.quizHistory));
    return { ok: true, error: null };
  } catch (error) {
    const isQuota =
      error && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22);
    return { ok: false, error: isQuota ? STORAGE_FULL_MESSAGE : STORAGE_BLOCKED_MESSAGE };
  }
}

export function buildExportPayload(progress) {
  return {
    app: "Elementa",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    savedSlugs: progress.savedSlugs,
    masteryMap: progress.masteryMap,
    notesMap: progress.notesMap,
    quizHistory: progress.quizHistory,
  };
}

/**
 * Validate a user-supplied progress file before it replaces local progress.
 * Returns { ok: true, progress, summary } or { ok: false, error }.
 */
export function validateImport(raw) {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "That file isn't a JSON object, so it can't be an Elementa progress export." };
  }

  const fields = ["savedSlugs", "masteryMap", "notesMap", "quizHistory"];
  const present = fields.filter((field) => field in raw);
  if (present.length === 0) {
    return {
      ok: false,
      error: "This file has none of the expected fields (savedSlugs, masteryMap, notesMap, quizHistory).",
    };
  }

  if ("savedSlugs" in raw && !Array.isArray(raw.savedSlugs)) {
    return { ok: false, error: "The “savedSlugs” field must be a list of element names." };
  }
  if (Array.isArray(raw.savedSlugs) && raw.savedSlugs.some((slug) => typeof slug !== "string")) {
    return { ok: false, error: "The “savedSlugs” list contains values that aren't text." };
  }
  if ("masteryMap" in raw && !isPlainObject(raw.masteryMap)) {
    return { ok: false, error: "The “masteryMap” field must be an object keyed by element name." };
  }
  if ("notesMap" in raw && !isPlainObject(raw.notesMap)) {
    return { ok: false, error: "The “notesMap” field must be an object keyed by element name." };
  }
  if ("quizHistory" in raw && !Array.isArray(raw.quizHistory)) {
    return { ok: false, error: "The “quizHistory” field must be a list of quiz sessions." };
  }

  const progress = sanitizeProgress(raw);
  const recognizedSlugs = new Set(
    [raw.savedSlugs, Object.keys(raw.notesMap || {}), Object.keys(raw.masteryMap || {})]
      .filter((value) => value !== undefined && value !== null)
      .flat()
      .filter((slug) => typeof slug === "string" && getElementBySlug(slug))
  );

  if (
    recognizedSlugs.size === 0 &&
    progress.quizHistory.length === 0 &&
    (raw.savedSlugs?.length || Object.keys(raw.notesMap || {}).length || Object.keys(raw.masteryMap || {}).length)
  ) {
    return { ok: false, error: "None of the elements in this file match Elementa's 118-element table." };
  }

  const droppedSlugs = Array.isArray(raw.savedSlugs) ? raw.savedSlugs.length - progress.savedSlugs.length : 0;

  return {
    ok: true,
    progress,
    summary: {
      savedElements: progress.savedSlugs.length,
      notes: Object.keys(progress.notesMap).length,
      quizSessions: progress.quizHistory.length,
      droppedSlugs: Math.max(0, droppedSlugs),
    },
  };
}