import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META, buildDailySpotlight, adjacentElements } from "@/data/elementsData";
import { Sparkles, Eye, BookmarkCheck, ArrowLeftRight, Shuffle, CheckCircle2 } from "lucide-react";

function localDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {{
 *   onInspectElement?: (slug: string, trigger?: HTMLElement | null) => void,
 *   savedSlugs?: string[],
 *   onToggleSave?: (slug: string) => void,
 * }} props
 */
export default function DailyElementSpotlight({ onInspectElement, savedSlugs = [], onToggleSave }) {
  const resultRef = useRef(null);
  const firstGuessRef = useRef(null);
  const moveFocusRef = useRef(false);
  const [dateKey] = useState(localDateKey);
  const [offset, setOffset] = useState(0);
  const [pickedSlug, setPickedSlug] = useState(null);
  const [revealedWithoutGuess, setRevealedWithoutGuess] = useState(false);

  const spotlight = useMemo(() => buildDailySpotlight(dateKey, offset), [dateKey, offset]);
  const { target, clue, options } = spotlight;
  const isResolved = pickedSlug !== null || revealedWithoutGuess;
  const isCorrect = pickedSlug === target.slug;
  const pickedElement = options.find((el) => el.slug === pickedSlug) || null;
  const isSaved = savedSlugs.includes(target.slug);
  const accent = CATEGORY_META[target.category]?.hex || "#4f9dff";

  const compareNeighboursUrl = useMemo(() => {
    const { prev, next } = adjacentElements(target.number);
    const ids = [prev?.slug, target.slug, next?.slug].filter(Boolean).join(",");
    return `/compare?ids=${ids}`;
  }, [target.number, target.slug]);

  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    (isResolved ? resultRef : firstGuessRef).current?.focus();
  }, [isResolved, offset]);

  const handleNextMystery = () => {
    moveFocusRef.current = true;
    setOffset((prev) => prev + 1);
    setPickedSlug(null);
    setRevealedWithoutGuess(false);
  };

  return (
    <section
      aria-label="Daily Element Spotlight"
      className="rounded-xl bg-[#131822] border border-[#242c38] px-4 py-3.5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffd43b]/15 text-[#ffd43b] border border-[#ffd43b]/30">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>{offset === 0 ? "Daily Element Clue" : `Element Clue #${offset + 1}`}</span>
            </span>
            <span className="text-[11px] font-mono text-[#8b98a9]">
              Period {target.period} · {target.group !== null ? `Group ${target.group}` : "f-block"} ·{" "}
              {target.phase.toUpperCase()} at STP{target.number >= 104 ? " (predicted)" : ""}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#e9edf2] leading-relaxed">{clue}</p>
        </div>

        {!isResolved ? (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0" role="group" aria-label="Guess the element">
            {options.map((opt, index) => (
              <button
                key={opt.slug}
                ref={index === 0 ? firstGuessRef : null}
                type="button"
                onClick={() => { moveFocusRef.current = true; setPickedSlug(opt.slug); }}
                className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1a2230] hover:bg-[#232e42] border border-[#2c374b] hover:border-[#4f9dff] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors motion-reduce:transition-none"
              >
                <span
                  className="font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#0e121a] border-l-2"
                  style={{ borderLeftColor: CATEGORY_META[opt.category]?.hex || "#4f9dff" }}
                >
                  {opt.symbol}
                </span>
                <span>{opt.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { moveFocusRef.current = true; setRevealedWithoutGuess(true); }}
              className="min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-medium text-[#8b98a9] hover:text-white flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Reveal</span>
            </button>
          </div>
        ) : (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="flex flex-col sm:flex-row sm:items-center gap-2.5 lg:max-w-xl shrink-0 bg-[#0e121a] border border-[#242c38] rounded-lg p-2.5"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <div className="text-xs leading-snug space-y-0.5 min-w-0">
              <p className="font-semibold text-white flex items-center gap-1.5">
                {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-[#69db7c] shrink-0" />}
                <span>
                  {isCorrect
                    ? `Spot on — ${target.name} (${target.symbol}, Z = ${target.number})!`
                    : pickedElement
                    ? `Close neighbor! It’s ${target.name} (${target.symbol}, Z = ${target.number}) rather than ${pickedElement.name} (${pickedElement.symbol}, Z = ${pickedElement.number}).`
                    : `${target.name} (${target.symbol}, Z = ${target.number})`}
                </span>
              </p>
              <p className="text-[11px] font-mono text-[#8b98a9]">
                Config: {target.electronConfig} ({target.shells.join("·")} shells)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => onInspectElement?.(target.slug, e.currentTarget)}
                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs font-semibold transition-colors motion-reduce:transition-none"
              >
                Inspect Atom
              </button>
              <Link
                to={compareNeighboursUrl}
                className="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-[#1a2230] border border-[#2c374b] hover:border-[#4f9dff] text-xs font-medium text-[#7bb6ff] inline-flex items-center gap-1 no-underline"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                <span>Compare</span>
              </Link>
              <button
                type="button"
                aria-pressed={isSaved}
                onClick={() => onToggleSave?.(target.slug)}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1 ${
                  isSaved
                    ? "bg-[#4f9dff]/20 border-[#4f9dff] text-[#7bb6ff]"
                    : "bg-[#1a2230] border-[#2c374b] text-[#aeb8c4] hover:text-white"
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={handleNextMystery}
                aria-label="Next Clue — try another element"
                className="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-[#161c26] border border-[#242c38] hover:border-white text-xs font-medium text-[#aeb8c4] hover:text-white inline-flex items-center gap-1"
              >
                <Shuffle className="w-3.5 h-3.5 shrink-0" />
                <span>Next Clue</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}