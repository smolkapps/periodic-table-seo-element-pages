import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ELEMENTS, CATEGORY_META, getElementBySlug, buildDeterministicQuiz } from "@/data/elementsData";
import { useStudyProgress } from "@/lib/studyStore";
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookmarkCheck,
  Printer,
  ArrowRight,
  Award,
} from "lucide-react";

export default function Practice() {
  const [searchParams] = useSearchParams();
  const focusElementSlug = searchParams.get("element");
  const focusIdsParam = searchParams.get("ids");
  const focusParam = searchParams.get("focus");

  const focusedElement = useMemo(
    () => (focusElementSlug ? getElementBySlug(focusElementSlug) || null : null),
    [focusElementSlug]
  );
  const comparedElements = useMemo(
    () =>
      focusIdsParam
        ? Array.from(
            new Map(
              focusIdsParam
                .split(",")
                .map((s) => getElementBySlug(s))
                .filter(Boolean)
                .map((el) => [el.slug, el])
            ).values()
          )
        : [],
    [focusIdsParam]
  );

  const deriveRouteMode = () => {
    if (focusParam) return focusParam;
    if (focusedElement) return "element";
    if (comparedElements.length > 0) return "compare";
    return "deck";
  };

  const { savedSlugs, recordQuizResult, toggleSavedSlug } = useStudyProgress();
  const [quizMode, setQuizMode] = useState(deriveRouteMode);
  const [deckSnapshotSlugs, setDeckSnapshotSlugs] = useState(() => [...savedSlugs]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [completedSession, setCompletedSession] = useState(null);
  const [showWorksheet, setShowWorksheet] = useState(false);

  const firstOptionRef = useRef(null);
  const nextButtonRef = useRef(null);
  const shouldFocusQuestionRef = useRef(false);

  // Sync quiz mode if route search params change.
  useEffect(() => {
    const nextMode = focusParam || (focusedElement ? "element" : comparedElements.length > 0 ? "compare" : "deck");
    setQuizMode(nextMode);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    setCompletedSession(null);
  }, [focusParam, focusedElement, comparedElements.length]);

  // Keep deckSnapshotSlugs synced whenever not actively mid-question in deck mode.
  useEffect(() => {
    if (quizMode !== "deck" || (deckSnapshotSlugs.length === 0 && savedSlugs.length > 0)) {
      setDeckSnapshotSlugs([...savedSlugs]);
    }
  }, [savedSlugs, quizMode, deckSnapshotSlugs.length]);

  const deckElements = useMemo(
    () => deckSnapshotSlugs.map((s) => getElementBySlug(s)).filter(Boolean),
    [deckSnapshotSlugs]
  );

  const isEmptyDeckMode = quizMode === "deck" && deckElements.length === 0;

  const pool = useMemo(() => {
    if (quizMode === "element" && focusedElement) {
      return [focusedElement];
    }
    if (quizMode === "compare" && comparedElements.length > 0) {
      return comparedElements;
    }
    if (quizMode === "deck") {
      return deckElements;
    }
    if (quizMode === "trends") {
      return ["fluorine", "oxygen", "caesium", "helium", "iron", "lithium", "silicon", "gold"]
        .map((s) => getElementBySlug(s))
        .filter(Boolean);
    }
    return ELEMENTS.filter((_, idx) => idx % 5 === 0);
  }, [quizMode, focusedElement, comparedElements, deckElements]);

  const questions = useMemo(() => buildDeterministicQuiz(pool, 5, quizMode), [pool, quizMode]);
  const currentQ = questions[currentIdx];

  useEffect(() => {
    if (selectedOption !== null) {
      nextButtonRef.current?.focus();
    } else if (shouldFocusQuestionRef.current && currentQ && !showWorksheet && !completedSession) {
      shouldFocusQuestionRef.current = false;
      firstOptionRef.current?.focus();
    }
  }, [selectedOption, currentIdx, currentQ, showWorksheet, completedSession]);

  const handleSelectOption = (slug) => {
    if (selectedOption !== null) return;
    setSelectedOption(slug);
    const isCorrect = slug === currentQ.correctSlug;
    setAnswers((prev) => [...prev, { slug: currentQ.target.slug, chosen: slug, isCorrect }]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      shouldFocusQuestionRef.current = true;
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
    } else {
      const score = answers.filter((a) => a.isCorrect).length;
      const session = recordQuizResult({
        mode:
          quizMode === "deck"
            ? "Saved Study Deck"
            : quizMode === "trends"
            ? "Periodic Trends & Valence"
            : quizMode === "element" && focusedElement
            ? `Element Focus (${focusedElement.name})`
            : quizMode === "compare" && comparedElements.length > 0
            ? `Comparison Focus (${comparedElements.map((e) => e.symbol).join(", ")})`
            : "All 118 Elements Mix",
        score,
        total: questions.length,
        perElementResults: answers,
      });
      setDeckSnapshotSlugs((prev) => Array.from(new Set([...prev, ...(session.missedSlugs || [])])));
      setCompletedSession(session);
    }
  };

  const resetQuiz = (newMode = quizMode) => {
    shouldFocusQuestionRef.current = true;
    setDeckSnapshotSlugs([...savedSlugs]);
    setQuizMode(newMode);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    setCompletedSession(null);
    setShowWorksheet(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <BrainCircuit className="w-7 h-7 text-[#69db7c]" />
              <span>Chemistry Practice &amp; Quiz Studio</span>
            </h1>
            <p className="text-sm text-[#aeb8c4] mt-1">
              Practice electron configurations, periodic trends, and real-world applications. Missed elements are
              automatically added to your Saved Study Deck.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!showWorksheet && isEmptyDeckMode) {
                setQuizMode("trends");
              }
              setShowWorksheet((v) => !v);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#161b22] border border-[#ffd43b]/40 text-[#ffd43b] hover:bg-[#ffd43b]/10 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>{showWorksheet ? "Back to Interactive Quiz" : "Teacher Worksheet Generator"}</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "deck", label: `My Study Deck (${savedSlugs.length})` },
            { id: "trends", label: "Periodic Trends & Valence" },
            { id: "all", label: "All 118 Elements Mix" },
            ...(focusedElement
              ? [{ id: "element", label: `Element Focus: ${focusedElement.name} (${focusedElement.symbol})` }]
              : []),
            ...(comparedElements.length > 0
              ? [{ id: "compare", label: `Comparison (${comparedElements.map((e) => e.symbol).join(", ")})` }]
              : []),
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => resetQuiz(m.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                quizMode === m.id
                  ? "bg-[#4f9dff] text-[#07121f] border-[#4f9dff]"
                  : "bg-[#131822] text-[#aeb8c4] border-[#242c38] hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {isEmptyDeckMode ? (
          /* Honest Empty Study Deck State */
          <div
            data-testid="empty-study-deck-notice"
            className="rounded-2xl bg-[#131822] border border-[#242c38] p-6 sm:p-8 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#4f9dff]/15 border border-[#4f9dff]/40 flex items-center justify-center mx-auto text-[#7bb6ff]">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-white">Your Study Deck is currently empty</h2>
              <p className="text-sm text-[#aeb8c4] leading-relaxed">
                You haven&apos;t saved any elements to your Study Deck on this device yet. Bookmark elements from the
                periodic table to build a custom deck, or start a general quiz below — any elements you miss are
                automatically added to your Study Deck for review.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => resetQuiz("trends")}
                className="px-4 py-2 rounded-xl bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs sm:text-sm font-semibold transition-colors"
              >
                Start Periodic Trends &amp; Valence Quiz
              </button>
              <button
                type="button"
                onClick={() => resetQuiz("all")}
                className="px-4 py-2 rounded-xl bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs sm:text-sm font-semibold text-white transition-colors"
              >
                Quiz All 118 Elements Mix
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-[#161b22] border border-[#2a323d] hover:border-white text-xs sm:text-sm font-medium text-[#aeb8c4] hover:text-white no-underline"
              >
                Explore Table to Save Elements →
              </Link>
            </div>
          </div>
        ) : showWorksheet ? (
          /* Teacher / Student Printable Worksheet + Answer Key */
          <div className="rounded-2xl bg-[#131822] border border-[#242c38] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#242c38] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#ffd43b]/15 text-[#ffd43b]">
                  Classroom &amp; Self-Study Worksheet
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Printable Chemistry Quiz &amp; Answer Key ({questions.length}{" "}
                  {questions.length === 1 ? "Question" : "Questions"})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl bg-[#0e121a] border border-[#242c38] space-y-2">
                  <p className="text-sm font-semibold text-white">
                    {idx + 1}. {q.prompt}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#aeb8c4] pl-4 list-disc">
                    {q.options.map((opt) => (
                      <li key={opt.slug}>{opt.label}</li>
                    ))}
                  </ul>
                  <p className="text-xs font-mono text-[#69db7c] pt-1 border-t border-[#1c232d]">
                    Answer Key: {q.target.name} ({q.target.symbol}) — {q.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : completedSession ? (
          /* Quiz Summary & Saved Progress CTA */
          <div className="rounded-2xl bg-[#131822] border border-[#242c38] p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#69db7c]/15 border border-[#69db7c] flex items-center justify-center mx-auto text-[#69db7c]">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-[#69db7c]">Session Saved to Study Progress</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                You scored {completedSession.score} / {completedSession.total} ({completedSession.accuracy}%)
              </h2>
              <p className="text-sm text-[#aeb8c4]">
                Mode: {completedSession.mode} • Mastery map and study deck updated.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => resetQuiz(quizMode)}
                className="px-4 py-2.5 rounded-xl bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs sm:text-sm font-semibold text-white flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
              {quizMode !== "deck" && savedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={() => resetQuiz("deck")}
                  className="px-4 py-2.5 rounded-xl bg-[#1a2436] border border-[#4f9dff] hover:bg-[#4f9dff]/20 text-xs sm:text-sm font-semibold text-[#7bb6ff] flex items-center gap-2"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Practice My Study Deck ({savedSlugs.length})</span>
                </button>
              )}
              <Link
                to="/saved"
                className="px-4 py-2.5 rounded-xl bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs sm:text-sm font-semibold flex items-center gap-2 no-underline"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>View Saved Progress & Mastery →</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Question Card */
          <div className="rounded-2xl bg-[#131822] border border-[#242c38] p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b98a9]">
              <span>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span
                className="px-2 py-0.5 rounded border"
                style={{
                  color: CATEGORY_META[currentQ.target.category]?.hex,
                  borderColor: `${CATEGORY_META[currentQ.target.category]?.hex}44`,
                }}
              >
                Target: Period {currentQ.target.period}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{currentQ.prompt}</h2>

            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption === opt.slug;
                const isCorrect = opt.slug === currentQ.correctSlug;
                let btnStyle = "bg-[#1a212d] border-[#2a323d] text-[#e9edf2] hover:border-[#4f9dff]";
                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyle = "bg-[#69db7c]/20 border-[#69db7c] text-white font-semibold";
                  } else if (isSelected) {
                    btnStyle = "bg-[#ff6b6b]/20 border-[#ff6b6b] text-white";
                  } else {
                    btnStyle = "bg-[#141922] border-[#242c38] text-[#7a8694] opacity-60";
                  }
                }

                return (
                  <button
                    key={opt.slug}
                    ref={optIdx === 0 ? firstOptionRef : null}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(opt.slug)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${btnStyle}`}
                  >
                    <span className="font-mono">{opt.label}</span>
                    {selectedOption !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#69db7c] shrink-0" />}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-[#ff6b6b] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="p-4 rounded-xl bg-[#0e121a] border border-[#242c38] space-y-3">
                <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
                  <strong className={selectedOption === currentQ.correctSlug ? "text-[#69db7c]" : "text-[#ffa94d]"}>
                    {selectedOption === currentQ.correctSlug ? "Correct! " : "Scientific Explanation: "}
                  </strong>
                  {currentQ.explanation}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/element/${currentQ.target.slug}`}
                      className="text-xs text-[#7bb6ff] hover:underline"
                    >
                      Open {currentQ.target.name} article →
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleSavedSlug(currentQ.target.slug)}
                      className="text-xs px-2.5 py-1 rounded bg-[#1c232d] border border-[#2a323d] text-[#aeb8c4] hover:text-white"
                    >
                      {savedSlugs.includes(currentQ.target.slug) ? "Saved in Deck ✓" : "+ Save to Deck"}
                    </button>
                  </div>
                  <button
                    ref={nextButtonRef}
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#7bb6ff]"
                  >
                    <span>{currentIdx + 1 < questions.length ? "Next Question" : "Finish & Save Progress"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}