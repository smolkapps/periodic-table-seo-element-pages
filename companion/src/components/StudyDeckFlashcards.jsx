import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META, FLASHCARD_MODES, buildDeckFlashcard } from "@/data/elementsData";
import {
  Eye,
  CheckCircle2,
  RotateCcw,
  BrainCircuit,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

/**
 * Active-recall flashcard rehearsal for the learner's device-local Saved Study Deck.
 * Bridges passive reference reading and multiple-choice quizzing by asking learners to
 * retrieve configurations, valence subshells, periodic trends, and personal study notes
 * from memory before revealing the answer.
 *
 * @param {{
 *   elements: any[],
 *   notesMap: Record<string, string>,
 *   masteryMap: Record<string, any>,
 *   onSaveNote: (slug: string, text: string) => void
 * }} props
 */
export default function StudyDeckFlashcards({ elements = [], notesMap = {}, masteryMap = {}, onSaveNote }) {
  const [promptMode, setPromptMode] = useState("structure");
  /** @type {[string[] | null, import("react").Dispatch<import("react").SetStateAction<string[] | null>>]} */
  const [subsetSlugs, setSubsetSlugs] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  /** @type {[Record<string, "recalled" | "review">, import("react").Dispatch<import("react").SetStateAction<Record<string, "recalled" | "review">>>]} */
  const [ratings, setRatings] = useState({});
  const [isPassComplete, setIsPassComplete] = useState(false);

  /** @type {import("react").RefObject<HTMLButtonElement | null>} */
  const revealBtnRef = useRef(null);
  /** @type {import("react").RefObject<HTMLDivElement | null>} */
  const answerRegionRef = useRef(null);
  /** @type {import("react").RefObject<HTMLHeadingElement | null>} */
  const summaryHeadingRef = useRef(null);
  const pendingFocusRef = useRef("");

  const activeCards = useMemo(() => {
    if (!subsetSlugs) return elements;
    const filtered = elements.filter((el) => subsetSlugs.includes(el.slug));
    return filtered.length > 0 ? filtered : elements;
  }, [elements, subsetSlugs]);

  const safeIndex = activeCards.length > 0 ? Math.min(cardIndex, activeCards.length - 1) : 0;
  const currentElement = activeCards[safeIndex] || null;
  const currentNote = currentElement ? notesMap[currentElement.slug] || "" : "";

  const card = useMemo(
    () => (currentElement ? buildDeckFlashcard(currentElement, promptMode, currentNote) : null),
    [currentElement, promptMode, currentNote]
  );

  useEffect(() => {
    if (pendingFocusRef.current === "answer" && isRevealed) {
      pendingFocusRef.current = "";
      answerRegionRef.current?.focus();
    } else if (pendingFocusRef.current === "summary" && isPassComplete) {
      pendingFocusRef.current = "";
      summaryHeadingRef.current?.focus();
    } else if (pendingFocusRef.current === "reveal-btn" && !isRevealed && !isPassComplete) {
      pendingFocusRef.current = "";
      revealBtnRef.current?.focus();
    }
  }, [isRevealed, isPassComplete, safeIndex, promptMode]);

  if (!currentElement || !card) return null;

  const isClueUnrevealed = promptMode === "clue" && !isRevealed;
  const accent = isClueUnrevealed ? "#4f9dff" : CATEGORY_META[currentElement.category]?.hex || "#4f9dff";
  const isMastered = Boolean(masteryMap[currentElement.slug]?.mastered);

  const handleSelectMode = (nextMode) => {
    pendingFocusRef.current = "reveal-btn";
    setPromptMode(nextMode);
    setCardIndex(0);
    setIsRevealed(false);
    setRatings({});
    setIsPassComplete(false);
  };

  const handleRateCard = (outcome) => {
    const nextRatings = { ...ratings, [currentElement.slug]: outcome };
    setRatings(nextRatings);
    const nextUncheckedIndex = activeCards.findIndex((el) => !nextRatings[el.slug]);
    if (nextUncheckedIndex !== -1) {
      pendingFocusRef.current = "reveal-btn";
      setCardIndex(nextUncheckedIndex);
      setIsRevealed(false);
    } else {
      pendingFocusRef.current = "summary";
      setIsPassComplete(true);
      setIsRevealed(false);
    }
  };

  const handleStepCard = (nextIdx) => {
    if (nextIdx < 0 || nextIdx >= activeCards.length) return;
    pendingFocusRef.current = "reveal-btn";
    setCardIndex(nextIdx);
    setIsRevealed(false);
  };

  const handleRestartPass = (nextSubset = null, nextMode = promptMode) => {
    pendingFocusRef.current = "reveal-btn";
    setSubsetSlugs(nextSubset);
    setPromptMode(nextMode);
    setCardIndex(0);
    setIsRevealed(false);
    setRatings({});
    setIsPassComplete(false);
  };

  const recalledCount = activeCards.filter((el) => ratings[el.slug] === "recalled").length;
  const flaggedElements = activeCards.filter((el) => ratings[el.slug] === "review");
  const modeKeys = Object.keys(FLASHCARD_MODES);
  const nextModeId = modeKeys[(modeKeys.indexOf(promptMode) + 1) % modeKeys.length];
  const comparePool = (flaggedElements.length >= 2 ? flaggedElements : elements).slice(0, 3);

  return (
    <div
      data-testid="study-deck-flashcards"
      className="rounded-2xl bg-[#131822] border border-[#242c38] p-4 sm:p-6 space-y-4 shadow-xl"
    >
      <p className="text-xs text-[#aeb8c4]">Self-check only: recall ratings do not change quiz scores or mastery.</p>
      {/* Recall Lens Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#242c38] pb-3.5">
        <div
          role="group"
          aria-label="Flashcard recall lens"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="text-xs font-mono text-[#7a8694] mr-1">Recall Lens:</span>
          {Object.values(FLASHCARD_MODES).map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={promptMode === m.id}
              onClick={() => handleSelectMode(m.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors motion-reduce:transition-none ${
                promptMode === m.id
                  ? "bg-[#4f9dff] text-[#07121f] border-[#4f9dff]"
                  : "bg-[#0e121a] text-[#aeb8c4] border-[#242c38] hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {subsetSlugs !== null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#ffa94d]">
              Drilling {activeCards.length} flagged
            </span>
            <button
              type="button"
              onClick={() => handleRestartPass(null, promptMode)}
              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#0e121a] border border-[#2a323d] text-[#7bb6ff] hover:text-white font-medium"
            >
              Show all {elements.length}
            </button>
          </div>
        )}
      </div>

      {isPassComplete ? (
        /* Pass Completion & Bridge to Scoped Quiz / Compare */
        <div
          data-testid="flashcard-pass-summary"
          className="py-3 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#69db7c]/15 border border-[#69db7c]/50 flex items-center justify-center mx-auto text-[#69db7c]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-[#7bb6ff]">
              {FLASHCARD_MODES[promptMode]?.label} Pass Complete
            </span>
            <h3
              ref={summaryHeadingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-extrabold text-white focus:outline-none"
            >
              Recalled {recalledCount} of {activeCards.length}{" "}
              {activeCards.length === 1 ? "Element" : "Elements"} from Memory
            </h3>
            <p className="text-xs sm:text-sm text-[#aeb8c4]">
              {flaggedElements.length > 0
                ? `Flagged for another look: ${flaggedElements.map((e) => `${e.name} (${e.symbol})`).join(", ")}.`
                : "Every card in this pass was recalled cleanly. Lock in mastery with a multiple-choice quiz or try the next recall lens."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {flaggedElements.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleRestartPass(
                      flaggedElements.map((e) => e.slug),
                      promptMode
                    )
                  }
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#ffa94d]/15 border border-[#ffa94d]/60 hover:bg-[#ffa94d]/25 text-xs sm:text-sm font-semibold text-[#ffd8a8] inline-flex items-center gap-2 transition-colors motion-reduce:transition-none"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Rehearse Flagged ({flaggedElements.length})</span>
                </button>
                <Link
                  to={
                    flaggedElements.length === 1
                      ? `/practice?element=${flaggedElements[0].slug}`
                      : `/practice?ids=${flaggedElements.map((e) => e.slug).join(",")}`
                  }
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#ff6b6b]/15 border border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/25 text-xs sm:text-sm font-semibold text-[#ffa8a8] inline-flex items-center gap-2 no-underline transition-colors motion-reduce:transition-none"
                >
                  <BrainCircuit className="w-4 h-4 shrink-0" />
                  <span>Quiz Flagged ({flaggedElements.map((e) => e.symbol).join(", ")})</span>
                </Link>
              </>
            )}

            <Link
              to="/practice?focus=deck"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 no-underline transition-colors motion-reduce:transition-none"
            >
              <BrainCircuit className="w-4 h-4 shrink-0" />
              <span>Start Deck Quiz ({elements.length})</span>
            </Link>

            {comparePool.length >= 2 && (
              <Link
                to={`/compare?ids=${comparePool.map((e) => e.slug).join(",")}`}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#161c26] border border-[#2a323d] hover:border-[#4f9dff] text-xs sm:text-sm font-semibold text-[#7bb6ff] inline-flex items-center gap-2 no-underline transition-colors motion-reduce:transition-none"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Compare ({comparePool.map((e) => e.symbol).join(" vs ")})</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => handleRestartPass(null, nextModeId)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1c232d] border border-[#2a323d] hover:border-white text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 transition-colors motion-reduce:transition-none"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Try {FLASHCARD_MODES[nextModeId].label} Lens</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Flashcard */
        <div
          className="rounded-xl bg-[#0e121a] border border-[#242c38] p-4 sm:p-5 space-y-4"
          style={{ borderTop: `3px solid ${accent}` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8b98a9]">
            <span>
              Card {safeIndex + 1} of {activeCards.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#161c26] border border-[#242c38] text-[#aeb8c4]">
                {card.frontBadge}
              </span>
              {!isClueUnrevealed && isMastered && (
                <span className="px-2 py-0.5 rounded bg-[#69db7c]/15 border border-[#69db7c]/40 text-[#69db7c]">
                  Mastered ✓
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">{card.frontTitle}</h3>
            <p className="text-sm text-[#cbd5e1] leading-relaxed">{card.frontPrompt}</p>
            {!isRevealed && card.hasPersonalNote && (
              <p className="text-xs font-mono text-[#7bb6ff] flex items-center gap-1.5 pt-0.5">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Personal study note saved: revealed with answer</span>
              </p>
            )}
          </div>

          {!isRevealed ? (
            <button
              ref={revealBtnRef}
              type="button"
              onClick={() => {
                pendingFocusRef.current = "answer";
                setIsRevealed(true);
              }}
              className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Reveal Chemistry Answer</span>
            </button>
          ) : (
            <div
              ref={answerRegionRef}
              tabIndex={-1}
              data-testid="flashcard-answer"
              className="border-t border-[#242c38] pt-4 space-y-3.5 focus:outline-none"
            >
              <div className="p-3.5 rounded-xl bg-[#141b27] border border-[#2a3547] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#69db7c]">
                  Reference Answer
                </span>
                {card.referenceNote && <p className="text-xs text-[#ffd43b] leading-relaxed">{card.referenceNote}</p>}
                <div className="text-lg sm:text-xl font-mono font-extrabold text-white break-words">
                  {card.answerHeadline}
                </div>
                <div className="text-xs font-mono text-[#7bb6ff]">{card.answerSubline}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {card.details.map((item) => (
                  <div
                    key={item.label}
                    className="p-2.5 rounded-lg bg-[#131822] border border-[#242c38] space-y-0.5"
                  >
                    <span className="block text-[11px] text-[#8b98a9]">{item.label}</span>
                    <span className="font-mono text-white break-words">{item.value}</span>
                  </div>
                ))}
              </div>

              {card.aufbauNote && (
                <div className="p-2.5 rounded-lg bg-[#ffd43b]/10 border border-[#ffd43b]/30 text-xs text-[#ffd43b]">
                  <strong>Subshell Note:</strong> {card.aufbauNote}
                </div>
              )}

              <p className="text-xs text-[#aeb8c4] leading-relaxed">{card.takeaway}</p>

              {/* Personal Study Note — reinforces learner's own mnemonic right on reveal */}
              <div className="p-3 rounded-xl bg-[#131822] border border-[#4f9dff]/35 space-y-1.5">
                <label
                  htmlFor={`flashcard-note-${currentElement.slug}`}
                  className="text-[11px] font-mono uppercase tracking-wider text-[#7bb6ff] flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>My Study Note ({currentElement.name})</span>
                </label>
                <input
                  id={`flashcard-note-${currentElement.slug}`}
                  type="text"
                  value={currentNote}
                  onChange={(e) => onSaveNote && onSaveNote(currentElement.slug, e.target.value)}
                  placeholder={`Add a mnemonic or bonding note for ${currentElement.name}…`}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#242c38] text-xs text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
                />
              </div>

              {/* Self-Check Recall Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleRateCard("review")}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#ffa94d]/15 border border-[#ffa94d]/50 hover:bg-[#ffa94d]/25 text-xs sm:text-sm font-semibold text-[#ffd8a8] flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Needs Another Look</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard("recalled")}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#69db7c]/20 border border-[#69db7c] hover:bg-[#69db7c]/30 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#69db7c] shrink-0" />
                  <span>Recalled Cleanly</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link
                  to={`/element/${currentElement.slug}`}
                  className="text-[#7bb6ff] hover:underline"
                >
                  Open {currentElement.name} full reference →
                </Link>
              </div>
            </div>
          )}

          {/* Prev / Next Card Stepper */}
          {activeCards.length > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1c232d]">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => handleStepCard(safeIndex - 1)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161c26] border border-[#242c38] text-xs font-medium text-[#aeb8c4] hover:text-white disabled:opacity-40 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="text-[11px] font-mono text-[#7a8694]">
                {Object.keys(ratings).length}/{activeCards.length} checked
              </span>
              <button
                type="button"
                disabled={safeIndex + 1 >= activeCards.length}
                onClick={() => handleStepCard(safeIndex + 1)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161c26] border border-[#242c38] text-xs font-medium text-[#aeb8c4] hover:text-white disabled:opacity-40 inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
