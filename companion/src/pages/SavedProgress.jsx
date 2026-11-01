import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ELEMENTS, CATEGORY_META, getElementBySlug, formatMass } from "@/data/elementsData";
import { useStudyProgress } from "@/lib/studyStore";
import {
  CheckCircle2,
  ArrowLeftRight,
  Download,
  Upload,
  Trash2,
  Plus,
  Award,
} from "lucide-react";

export default function SavedProgress() {
  const {
    savedSlugs,
    masteryMap,
    notesMap,
    quizHistory,
    toggleSavedSlug,
    saveElementNote,
    toggleMasteredManual,
    importStudyData,
    exportStudyData,
  } = useStudyProgress();

  const [addSlugInput, setAddSlugInput] = useState("carbon");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusKind, setStatusKind] = useState("info");

  const savedElements = savedSlugs.map((s) => getElementBySlug(s)).filter(Boolean);
  const masteredElements = ELEMENTS.filter((el) => masteryMap[el.slug]?.mastered);
  const masteryPct = Math.round((masteredElements.length / ELEMENTS.length) * 100);

  const handleExportJson = () => {
    try {
      const payload = exportStudyData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "elementa-study-progress.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatusKind("success");
      setStatusMsg("Exported your progress as a JSON file on this device.");
    } catch {
      setStatusKind("error");
      setStatusMsg("Couldn't create the export file. Check that your browser allows downloads for this site.");
    }
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setStatusKind("error");
        setStatusMsg("That file isn't valid JSON. Export a fresh copy from this page and try again.");
        return;
      }

      const result = importStudyData(parsed);
      if (!result.ok) {
        setStatusKind("error");
        setStatusMsg(`Import failed: ${result.error}`);
        return;
      }

      const { savedElements, notes, quizSessions, droppedSlugs } = result.summary;
      const summary = `Imported ${savedElements} saved element${savedElements === 1 ? "" : "s"}, ${notes} note${
        notes === 1 ? "" : "s"
      } and ${quizSessions} quiz session${quizSessions === 1 ? "" : "s"}.`;
      const dropped =
        droppedSlugs > 0 ? ` ${droppedSlugs} entr${droppedSlugs === 1 ? "y" : "ies"} didn't match an element and were skipped.` : "";
      setStatusKind(result.warning ? "error" : "success");
      setStatusMsg(result.warning ? `${summary}${dropped} ${result.warning}` : `${summary}${dropped}`);
    };

    reader.onerror = () => {
      setStatusKind("error");
      setStatusMsg("Couldn't read that file. Try exporting a fresh copy and importing it again.");
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & Portable Backup Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242c38] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Saved Elements &amp; Study Progress</h1>
            <p className="text-sm text-[#aeb8c4] mt-1">
              Bookmark elements, write personal study notes, and track your quiz mastery across all 118 elements.
            </p>
            <p className="text-[11px] text-[#7a8694] mt-1">
              Stored only in this browser on this device — no account, nothing uploaded.{" "}
              <Link to="/privacy" className="text-[#7bb6ff] hover:underline">
                What's stored
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept="application/json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>

        {statusMsg && (
          <div
            role="status"
            className={`p-3 rounded-lg border text-xs ${
              statusKind === "error"
                ? "bg-[#ff6b6b]/10 border-[#ff6b6b]/50 text-[#ffc9c9]"
                : "bg-[#4f9dff]/15 border-[#4f9dff] text-white"
            }`}
          >
            {statusMsg}
          </div>
        )}

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#131822] border border-[#242c38] space-y-1">
            <span className="text-xs font-mono text-[#8b98a9]">SAVED STUDY DECK</span>
            <div className="text-2xl font-extrabold text-white">{savedElements.length} Elements</div>
            <Link to="/practice?focus=deck" className="text-xs text-[#7bb6ff] hover:underline inline-block pt-1">
              Practice saved deck →
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-[#131822] border border-[#242c38] space-y-1">
            <span className="text-xs font-mono text-[#8b98a9]">MASTERED ELEMENTS</span>
            <div className="text-2xl font-extrabold text-[#69db7c]">
              {masteredElements.length} / 118 ({masteryPct}%)
            </div>
            <div className="w-full h-2 rounded-full bg-[#1c232d] overflow-hidden mt-1">
              <div className="h-full bg-[#69db7c]" style={{ width: `${masteryPct}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#131822] border border-[#242c38] space-y-1">
            <span className="text-xs font-mono text-[#8b98a9]">QUIZ SESSIONS COMPLETED</span>
            <div className="text-2xl font-extrabold text-[#ffd43b]">{quizHistory.length}</div>
            <span className="text-xs text-[#aeb8c4] block">
              Latest accuracy: {quizHistory[0]?.accuracy ?? 0}%
            </span>
          </div>
        </div>

        {/* Add Element to Study Deck Quick Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#131822] border border-[#242c38] rounded-xl p-3.5">
          <span className="text-xs font-medium text-[#aeb8c4]">Quick-add element to Study Deck:</span>
          <select
            value={addSlugInput}
            onChange={(e) => setAddSlugInput(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] text-xs text-white"
          >
            {ELEMENTS.map((el) => (
              <option key={el.slug} value={el.slug}>
                #{el.number} {el.symbol} — {el.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!savedSlugs.includes(addSlugInput)) {
                toggleSavedSlug(addSlugInput);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Deck</span>
          </button>
          {savedElements.length >= 2 && (
            <Link
              to={`/compare?ids=${savedElements
                .slice(0, 3)
                .map((e) => e.slug)
                .join(",")}`}
              className="ml-auto px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs text-[#7bb6ff] flex items-center gap-1.5 no-underline"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare Top Saved Elements</span>
            </Link>
          )}
        </div>

        {/* Saved Elements Grid */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Bookmarked Study Deck ({savedElements.length})</h2>
          {savedElements.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#131822] border border-[#242c38] text-center space-y-2">
              <p className="text-sm text-[#aeb8c4]">Your Study Deck is currently empty.</p>
              <Link to="/" className="text-xs text-[#7bb6ff] hover:underline">
                Explore the periodic table to bookmark elements →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedElements.map((el) => {
                const meta = CATEGORY_META[el.category];
                const stats = masteryMap[el.slug];
                const note = notesMap[el.slug] || "";
                return (
                  <div
                    key={el.slug}
                    className="rounded-xl bg-[#131822] border border-[#242c38] p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/element/${el.slug}`} className="flex items-center gap-3 no-underline group">
                        <div
                          className="w-12 h-12 rounded-lg bg-[#1c232d] border border-[#2a323d] border-l-4 flex flex-col items-center justify-center shrink-0"
                          style={{ borderLeftColor: meta.hex }}
                        >
                          <span className="text-[10px] font-mono text-[#7a8694]">{el.number}</span>
                          <span className="text-lg font-extrabold text-white">{el.symbol}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-[#7bb6ff] flex items-center gap-1.5">
                            <span>{el.name}</span>
                            {stats?.mastered && <CheckCircle2 className="w-4 h-4 text-[#69db7c]" />}
                          </h3>
                          <p className="text-xs font-mono text-[#8b98a9]">
                            {meta.label} · {formatMass(el)}
                            {el.synthetic ? "" : " u"} · {el.electronConfig}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleMasteredManual(el.slug)}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            stats?.mastered
                              ? "bg-[#69db7c]/20 border-[#69db7c] text-[#69db7c]"
                              : "bg-[#1c232d] border-[#2a323d] text-[#aeb8c4] hover:text-white"
                          }`}
                        >
                          {stats?.mastered ? "Mastered ✓" : "Mark Mastered"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSavedSlug(el.slug)}
                          aria-label={`Remove ${el.name} from saved`}
                          className="p-1.5 rounded bg-[#1c232d] border border-[#2a323d] text-[#8b98a9] hover:text-[#ff6b6b]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#aeb8c4] leading-relaxed">
                      Notable as {el.highlight}.
                    </p>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => saveElementNote(el.slug, e.target.value)}
                        placeholder={`Add study note for ${el.name}…`}
                        className="w-full px-2.5 py-1.5 rounded bg-[#0e121a] border border-[#242c38] text-xs text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Quiz Sessions */}
        <section className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#ffd43b]" />
            <span>Recent Quiz History</span>
          </h2>
          {quizHistory.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#131822] border border-[#242c38] text-center space-y-2">
              <p className="text-sm text-[#aeb8c4]">No quiz sessions completed on this device yet.</p>
              <Link to="/practice?focus=trends" className="text-xs text-[#7bb6ff] hover:underline inline-block">
                Start a practice quiz →
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-[#131822] border border-[#242c38] divide-y divide-[#242c38]">
              {quizHistory.map((item) => (
                <div key={item.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white">{item.mode}</span>
                    <span className="text-[#7a8694] font-mono ml-2">({item.date})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#69db7c]">
                      {item.score}/{item.total} ({item.accuracy}%)
                    </span>
                    {item.missedSlugs?.length > 0 && (
                      <Link
                        to={`/practice?ids=${item.missedSlugs.join(",")}`}
                        className="px-2.5 py-1 rounded bg-[#ff6b6b]/15 border border-[#ff6b6b]/40 text-[#ff6b6b] hover:underline no-underline"
                      >
                        Retry missed ({item.missedSlugs.join(", ")})
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}