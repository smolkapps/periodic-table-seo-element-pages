import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_PROGRESS,
  MAX_NOTE_LENGTH,
  STORAGE_KEYS,
  buildExportPayload,
  readProgress,
  sanitizeMasteryMap,
  sanitizeQuizHistory,
  validateImport,
  writeProgress,
} from "../src/lib/progressStore.js";

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("device-local progress: honest zero start", () => {
  it("starts completely empty on a device that has never studied", () => {
    const result = readProgress(createMemoryStorage());
    assert.deepEqual(result.progress, {
      savedSlugs: [],
      masteryMap: {},
      notesMap: {},
      quizHistory: [],
    });
    assert.equal(result.storageAvailable, true);
    assert.equal(result.error, null);
  });

  it("has no seeded sample quizzes, notes or mastery in the empty shape", () => {
    assert.deepEqual(EMPTY_PROGRESS.savedSlugs, []);
    assert.deepEqual(EMPTY_PROGRESS.masteryMap, {});
    assert.deepEqual(EMPTY_PROGRESS.notesMap, {});
    assert.deepEqual(EMPTY_PROGRESS.quizHistory, []);
  });
});

describe("device-local progress: persistence across reloads", () => {
  it("round-trips saved elements, notes, mastery and quiz history", () => {
    const storage = createMemoryStorage();
    const progress = {
      savedSlugs: ["oxygen", "iron", "not-an-element"],
      masteryMap: { oxygen: { attempts: 3, correct: 2, mastered: true, lastPracticed: "2026-10-30" } },
      notesMap: { iron: "Loses 4s electrons first." },
      quizHistory: [{ id: "s1", mode: "Periodic Trends", score: 4, total: 5, date: "2026-10-30", missedSlugs: ["chromium"] }],
    };

    const writeResult = writeProgress(progress, storage);
    assert.equal(writeResult.ok, true);

    // A fresh read simulates reloading the same origin.
    const reloaded = readProgress(storage);
    assert.deepEqual(reloaded.progress.savedSlugs, ["oxygen", "iron"]);
    assert.equal(reloaded.progress.notesMap.iron, "Loses 4s electrons first.");
    assert.equal(reloaded.progress.masteryMap.oxygen.mastered, true);
    assert.equal(reloaded.progress.quizHistory.length, 1);
    assert.equal(reloaded.progress.quizHistory[0].accuracy, 80);
    assert.equal(reloaded.error, null);
  });

  it("stores only the four documented keys and no learner identity", () => {
    const storage = createMemoryStorage();
    writeProgress({ savedSlugs: ["gold"], masteryMap: {}, notesMap: {}, quizHistory: [] }, storage);
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).sort();
    assert.deepEqual(keys, Object.values(STORAGE_KEYS).sort());
  });

  it("caps notes and quiz history", () => {
    const storage = createMemoryStorage();
    const longNote = "x".repeat(MAX_NOTE_LENGTH + 500);
    writeProgress({ savedSlugs: ["gold"], masteryMap: {}, notesMap: { gold: longNote }, quizHistory: [] }, storage);
    assert.equal(readProgress(storage).progress.notesMap.gold.length, MAX_NOTE_LENGTH);

    const sessions = Array.from({ length: 40 }, (_, index) => ({
      id: `q-${index}`,
      mode: "Practice",
      score: 1,
      total: 2,
      date: "2026-10-30",
    }));
    assert.equal(sanitizeQuizHistory(sessions).length, 25);
  });
});

describe("device-local progress: storage failures are reported", () => {
  it("reports unavailable storage instead of silently discarding progress", () => {
    const read = readProgress(null);
    assert.equal(read.storageAvailable, false);
    assert.match(read.error, /local storage is unavailable/i);
    assert.deepEqual(read.progress, EMPTY_PROGRESS);

    const write = writeProgress(EMPTY_PROGRESS, null);
    assert.equal(write.ok, false);
    assert.match(write.error, /local storage is unavailable/i);
  });

  it("reports a blocked browser storage instead of claiming success", () => {
    const result = writeProgress(EMPTY_PROGRESS, throwingStorage);
    assert.equal(result.ok, false);
    assert.ok(result.error.length > 0);
  });

  it("surfaces corrupted stored data as a recoverable error", () => {
    const storage = createMemoryStorage({ [STORAGE_KEYS.SAVED_SLUGS]: "{not json" });
    const result = readProgress(storage);
    assert.equal(result.storageAvailable, true);
    assert.equal(result.recovered, true);
    assert.match(result.error, /couldn't be read|unreadable/i);
    assert.deepEqual(result.progress.savedSlugs, []);
  });
});

describe("progress import validation", () => {
  it("accepts a real export and reports what was imported", () => {
    const exported = buildExportPayload({
      savedSlugs: ["oxygen"],
      masteryMap: {},
      notesMap: { oxygen: "Paramagnetic." },
      quizHistory: [],
    });
    const result = validateImport(exported);
    assert.equal(result.ok, true);
    assert.deepEqual(result.progress.savedSlugs, ["oxygen"]);
    assert.equal(result.summary.notes, 1);
  });

  it("rejects non-objects, unknown files and malformed field types", () => {
    assert.equal(validateImport("hello").ok, false);
    assert.equal(validateImport(null).ok, false);
    assert.equal(validateImport([]).ok, false);
    assert.equal(validateImport({ hello: "world" }).ok, false);
    assert.equal(validateImport({ savedSlugs: "oxygen" }).ok, false);
    assert.equal(validateImport({ savedSlugs: [1, 2] }).ok, false);
    assert.equal(validateImport({ masteryMap: [] }).ok, false);
    assert.equal(validateImport({ quizHistory: {} }).ok, false);
  });

  it("rejects a file whose elements do not exist in the table", () => {
    const result = validateImport({ savedSlugs: ["unobtanium", "mithril"] });
    assert.equal(result.ok, false);
    assert.match(result.error, /don't|match|118/i);
  });

  it("drops unknown elements but keeps valid ones", () => {
    const result = validateImport({ savedSlugs: ["oxygen", "unobtanium"] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.progress.savedSlugs, ["oxygen"]);
    assert.equal(result.summary.droppedSlugs, 1);
  });

  it("sanitizes odd mastery entries instead of trusting them", () => {
    // Numeric strings are coerced; a non-boolean "mastered" flag is not trusted.
    assert.deepEqual(sanitizeMasteryMap({ oxygen: { attempts: "2", correct: "1", mastered: "yes" } }), {
      oxygen: { attempts: 2, correct: 1, mastered: false, lastPracticed: null },
    });
    assert.deepEqual(sanitizeMasteryMap({ oxygen: { attempts: "lots", correct: 1 } }), {});
    assert.deepEqual(sanitizeMasteryMap({ unobtanium: { attempts: 2, correct: 1, mastered: true } }), {});
    assert.deepEqual(sanitizeMasteryMap({ oxygen: { attempts: 2, correct: 1, mastered: true } }), {
      oxygen: { attempts: 2, correct: 1, mastered: true, lastPracticed: null },
    });
  });
});