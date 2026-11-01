import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ELEMENTS, CATEGORY_META, formatMass } from "@/data/elementsData";
import { useStudyProgress } from "@/lib/studyStore";
import { Search, BookmarkCheck, CheckCircle2 } from "lucide-react";

export default function AllElements() {
  const [filter, setFilter] = useState("");
  const { savedSlugs, masteryMap, toggleSavedSlug } = useStudyProgress();

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const map = new Map();
    for (const cat of Object.keys(CATEGORY_META)) {
      map.set(cat, []);
    }
    for (const el of ELEMENTS) {
      if (q) {
        const hay = `${el.name} ${el.symbol} ${el.number} ${el.electronConfig} ${CATEGORY_META[el.category].label}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      map.get(el.category).push(el);
    }
    return map;
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#242c38] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">All 118 Chemical Elements</h1>
            <p className="text-sm text-[#aeb8c4] mt-1">
              Complete browsable directory grouped by chemical family. Select any element to view its atomic structure,
              properties, periodic trends, and real-world uses.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#7a8694] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Filter 118 elements"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && filter !== "") {
                  e.preventDefault();
                  setFilter("");
                }
              }}
              placeholder="Filter 118 elements…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161b22] border border-[#2a323d] text-sm text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
            />
          </div>
        </div>

        <div className="space-y-8">
          {[...grouped.entries()].map(([cat, els]) => {
            if (els.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <section key={cat} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-l-4 pl-3" style={{ borderLeftColor: meta.hex }}>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{meta.label}</span>
                    <span className="text-xs font-mono text-[#7a8694]">({els.length})</span>
                  </h2>
                  <p className="text-xs text-[#8b98a9]">{meta.reactivity}</p>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 list-none p-0">
                  {els.map((el) => {
                    const isSaved = savedSlugs.includes(el.slug);
                    const isMastered = Boolean(masteryMap[el.slug]?.mastered);
                    return (
                      <li
                        key={el.number}
                        className="rounded-xl bg-[#131822] border border-[#242c38] hover:border-[#4f9dff]/60 p-3 flex items-center justify-between gap-2 transition-all"
                      >
                        <Link to={`/element/${el.slug}`} className="flex items-center gap-3 no-underline flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg bg-[#1c232d] border border-[#2a323d] border-l-[3px] flex flex-col items-center justify-center shrink-0"
                            style={{ borderLeftColor: meta.hex }}
                          >
                            <span className="text-[9px] font-mono text-[#7a8694] leading-none">{el.number}</span>
                            <span className="text-sm font-extrabold text-white leading-tight">{el.symbol}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                              <span>{el.name}</span>
                              {isMastered && (
                                <span title="Mastered" className="inline-flex">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#69db7c] shrink-0" aria-label="Mastered" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[#8b98a9] truncate">
                              {formatMass(el)}
                              {el.synthetic ? "" : " u"} · {el.electronConfig}
                            </div>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleSavedSlug(el.slug)}
                          aria-label={isSaved ? `Remove ${el.name} from Study Deck` : `Save ${el.name} to Study Deck`}
                          aria-pressed={isSaved}
                          title={isSaved ? "Remove from Study Deck" : "Save to Study Deck"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isSaved
                              ? "bg-[#4f9dff]/15 border-[#4f9dff] text-[#7bb6ff]"
                              : "bg-[#1c232d] border-[#2a323d] text-[#7a8694] hover:text-white"
                          }`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}