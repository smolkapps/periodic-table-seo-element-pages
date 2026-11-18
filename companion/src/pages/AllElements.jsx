import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ELEMENTS, CATEGORY_META, formatMass } from "@/data/elementsData";
import {
  DISCOVERY_SEARCH_CHIPS,
  matchesElementQuery,
  getMatchedSpellingAlias,
  findClosestElementMatches,
} from "@/data/elementSearch";
import { useStudyProgress } from "@/lib/studyStore";
import { Search, BookmarkCheck, CheckCircle2, X, RotateCcw } from "lucide-react";

export default function AllElements() {
  const [filter, setFilter] = useState("");
  const searchInputRef = useRef(null);
  const { savedSlugs, masteryMap, toggleSavedSlug } = useStudyProgress();

  const trimmedFilter = filter.trim();
  const isFiltering = trimmedFilter.length > 0;

  const { grouped, totalMatches, matchedFamilyCount } = useMemo(() => {
    const map = new Map();
    for (const cat of Object.keys(CATEGORY_META)) {
      map.set(cat, []);
    }
    let matches = 0;
    for (const el of ELEMENTS) {
      if (isFiltering && !matchesElementQuery(el, trimmedFilter)) continue;
      map.get(el.category).push(el);
      matches++;
    }
    let families = 0;
    for (const list of map.values()) {
      if (list.length > 0) families++;
    }
    return { grouped: map, totalMatches: matches, matchedFamilyCount: families };
  }, [isFiltering, trimmedFilter]);

  const closeMatches = useMemo(
    () => (isFiltering && totalMatches === 0 ? findClosestElementMatches(trimmedFilter, 3) : []),
    [isFiltering, totalMatches, trimmedFilter]
  );

  const clearFilter = () => {
    setFilter("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242c38] pb-5">
          <div className="max-w-2xl min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">All 118 Chemical Elements</h1>
            <p className="text-sm text-[#aeb8c4] mt-1">
              Complete browsable directory grouped by chemical family. Search by IUPAC or US/UK spelling (e.g. aluminum,
              cesium), symbol, atomic number, configuration, period, or group.
            </p>
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#7a8694] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
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
              placeholder="Name, symbol, #Z, config, Period 2, Group 17…"
              autoComplete="off"
              className="w-full min-h-[44px] pl-9 pr-10 py-2 rounded-lg bg-[#161b22] border border-[#2a323d] text-sm text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
            />
            {filter && (
              <button
                type="button"
                onClick={clearFilter}
                aria-label="Clear element filter"
                className="min-h-[36px] min-w-[36px] absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md text-[#8b98a9] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Discovery Quick Chips + Live Match Count */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#131822] border border-[#242c38] rounded-xl p-3">
          <div role="group" aria-label="Quick element discovery searches" className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[#7a8694] mr-1">Try:</span>
            {DISCOVERY_SEARCH_CHIPS.map((chip) => {
              const active = trimmedFilter.toLowerCase() === chip.query.toLowerCase();
              return (
                <button
                  key={chip.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(active ? "" : chip.query)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors motion-reduce:transition-none ${
                    active
                      ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white font-semibold"
                      : "bg-[#1c232d] border-[#2a323d] text-[#aeb8c4] hover:text-white hover:border-[#4f9dff]/60"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            <p role="status" aria-live="polite" className="min-w-0 break-words [overflow-wrap:anywhere] text-xs font-mono text-[#aeb8c4]">
              {!isFiltering
                ? `Showing all ${ELEMENTS.length} elements across ${matchedFamilyCount} families`
                : totalMatches === 0
                ? `No elements match “${trimmedFilter}”`
                : `${totalMatches} of ${ELEMENTS.length} elements shown in ${matchedFamilyCount} ${
                    matchedFamilyCount === 1 ? "family" : "families"
                  }`}
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilter}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs text-[#7bb6ff] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Show all 118</span>
              </button>
            )}
          </div>
        </div>

        {totalMatches === 0 ? (
          <div
            data-testid="directory-empty-state"
            className="rounded-xl bg-[#131822] border border-[#242c38] p-6 sm:p-8 text-center space-y-4"
          >
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h2 className="break-words [overflow-wrap:anywhere] text-base sm:text-lg font-bold text-white">
                No elements match “{trimmedFilter}”
              </h2>
              <p className="text-xs sm:text-sm text-[#aeb8c4]">
                Search by element name (including US/UK spellings like aluminum, cesium, or sulphur), symbol, atomic
                number (#Z), electron configuration (e.g. 2p4), Period 1–7, or Group 1–18.
              </p>
            </div>

            {closeMatches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[#8b98a9]">Did you mean:</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {closeMatches.map((suggestion) => (
                    <Link
                      key={suggestion.slug}
                      to={`/element/${suggestion.slug}`}
                      className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#1c232d] border border-[#4f9dff]/50 hover:border-[#4f9dff] text-xs font-semibold text-white inline-flex items-center gap-2 no-underline"
                    >
                      <span className="font-mono text-[#7bb6ff]">#{suggestion.number} {suggestion.symbol}</span>
                      <span>{suggestion.name} →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={clearFilter}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear search &amp; show all 118 elements</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {[...grouped.entries()].map(([cat, els]) => {
              if (els.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <section key={cat} className="space-y-3">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-l-4 pl-3"
                    style={{ borderLeftColor: meta.hex }}
                  >
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
                      const matchedAlias = isFiltering ? getMatchedSpellingAlias(el, trimmedFilter) : null;
                      return (
                        <li
                          key={el.number}
                          className="rounded-xl bg-[#131822] border border-[#242c38] hover:border-[#4f9dff]/60 p-3 flex items-center justify-between gap-2 transition-colors motion-reduce:transition-none"
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
                              <div className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                                <span className="truncate">{el.name}</span>
                                {isMastered && (
                                  <span title="Mastered" className="inline-flex">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#69db7c] shrink-0" aria-label="Mastered" />
                                  </span>
                                )}
                                {matchedAlias && (
                                  <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-[#4f9dff]/15 border border-[#4f9dff]/30 text-[#7bb6ff]">
                                    Also spelled: {matchedAlias}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-[#8b98a9] truncate">
                                {formatMass(el)} · {el.electronConfig}
                              </div>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleSavedSlug(el.slug)}
                            aria-label={isSaved ? `Remove ${el.name} from Study Deck` : `Save ${el.name} to Study Deck`}
                            aria-pressed={isSaved}
                            title={isSaved ? "Remove from Study Deck" : "Save to Study Deck"}
                            className={`min-h-[40px] min-w-[40px] p-2 rounded-lg border flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none ${
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
        )}
      </main>

      <Footer />
    </div>
  );
}