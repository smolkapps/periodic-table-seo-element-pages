import { QUIZ_LENGTH_OPTIONS, QUIZ_DIFFICULTY_META } from "../data/elementsData.js";

export const QUIZ_PREFS_STORAGE_KEY = "elementa_quiz_prefs_v1";

const PERSISTABLE_MODES = new Set(["trends", "all", "deck"]);

export const DEFAULT_QUIZ_PREFS = Object.freeze({
  mode: null,
  difficulty: "standard",
  count: 5,
});

function getDefaultStorage() {
  try {
    if (typeof localStorage === "undefined" || !localStorage) return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function sanitizeQuizPrefs(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_QUIZ_PREFS };
  }
  const mode = typeof raw.mode === "string" && PERSISTABLE_MODES.has(raw.mode) ? raw.mode : null;
  const difficulty =
    typeof raw.difficulty === "string" && QUIZ_DIFFICULTY_META[raw.difficulty] ? raw.difficulty : "standard";
  const countNum = Number(raw.count);
  const count = QUIZ_LENGTH_OPTIONS.includes(countNum) ? countNum : 5;
  return { mode, difficulty, count };
}

export function readQuizPrefs(storage = getDefaultStorage()) {
  if (!storage) return { ...DEFAULT_QUIZ_PREFS };
  try {
    const raw = storage.getItem(QUIZ_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_QUIZ_PREFS };
    return sanitizeQuizPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_QUIZ_PREFS };
  }
}

export function writeQuizPrefs(prefs, storage = getDefaultStorage()) {
  const sanitized = sanitizeQuizPrefs(prefs);
  if (!storage) return { ok: false, prefs: sanitized };
  try {
    storage.setItem(QUIZ_PREFS_STORAGE_KEY, JSON.stringify(sanitized));
    return { ok: true, prefs: sanitized };
  } catch {
    return { ok: false, prefs: sanitized };
  }
}