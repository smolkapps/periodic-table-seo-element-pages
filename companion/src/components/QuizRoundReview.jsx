import React from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META, getElementBySlug } from "@/data/elementsData";
import { CheckCircle2, XCircle, ArrowLeftRight } from "lucide-react";

/**
 * Formats an option label with its element name when the option text shows only a symbol or configuration.
 * @param {{ slug: string, label: string } | undefined} opt
 * @param {string} fallbackSlug
 */
function describeOption(opt, fallbackSlug) {
  const el = getElementBySlug(opt?.slug || fallbackSlug);
  const rawLabel = opt?.label || el?.name || fallbackSlug;
  if (el && !rawLabel.toLowerCase().includes(el.name.toLowerCase())) {
    return `${rawLabel} — ${el.name}`;
  }
  return rawLabel;
}

/**
 * @param {{
 *   items: Array<{
 *     index: number,
 *     question: any,
 *     chosen: string,
 *     isCorrect: boolean
 *   }>
 * }} props
 */
export default function QuizRoundReview({ items = [] }) {
  if (items.length === 0) return null;

  const missedItems = items.filter((item) => !item.isCorrect);
  const correctItems = items.filter((item) => item.isCorrect);

  return (
    <section
      aria-label="Round Chemistry Review"
      data-testid="quiz-round-review"
      className="text-left border-t border-[#242c38] pt-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-bold text-white">Round Chemistry Review</h3>
        <div className="flex items-center gap-2 text-xs font-mono">
          {missedItems.length > 0 && (
            <span className="px-2.5 py-0.5 rounded bg-[#ff6b6b]/15 text-[#ff8787] border border-[#ff6b6b]/40">
              {missedItems.length} to review
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded bg-[#69db7c]/15 text-[#69db7c] border border-[#69db7c]/40">
            {correctItems.length} correct
          </span>
        </div>
      </div>

      {missedItems.length > 0 && (
        <div className="space-y-3">
          {missedItems.map((item) => {
            const q = item.question;
            const target = q.target;
            const chosenEl = getElementBySlug(item.chosen);
            const chosenOpt = q.options.find((o) => o.slug === item.chosen);
            const correctOpt = q.options.find((o) => o.slug === q.correctSlug);
            const accent = CATEGORY_META[target.category]?.hex || "#4f9dff";

            return (
              <div
                key={q.id}
                data-testid="missed-question-card"
                className="rounded-xl bg-[#0e121a] border border-[#ff6b6b]/35 p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#ff8787]">Question {item.index + 1} · Needs Review</span>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border"
                    style={{ color: accent, borderColor: `${accent}55` }}
                  >
                    {target.name} ({target.symbol}) · Z={target.number}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white leading-snug">{q.prompt}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ffc9c9] flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-[#ff6b6b] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] uppercase text-[#ff8787]">Your answer</span>
                      <span>{describeOption(chosenOpt, item.chosen)}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#69db7c]/10 border border-[#69db7c]/30 text-[#d3f9d8] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#69db7c] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] uppercase text-[#69db7c]">Correct answer</span>
                      <span>{describeOption(correctOpt, q.correctSlug)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#aeb8c4] leading-relaxed">{q.explanation}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {chosenEl && chosenEl.slug !== target.slug && (
                    <Link
                      to={`/compare?ids=${target.slug},${chosenEl.slug}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161c26] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-semibold text-[#7bb6ff] inline-flex items-center gap-1.5 no-underline transition-colors motion-reduce:transition-none"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Compare {target.symbol} vs {chosenEl.symbol}
                      </span>
                    </Link>
                  )}
                  <Link
                    to={`/element/${target.slug}`}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161c26] border border-[#2a323d] hover:border-white text-xs font-medium text-[#aeb8c4] hover:text-white inline-flex items-center no-underline transition-colors motion-reduce:transition-none"
                  >
                    Open {target.name} reference →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {correctItems.length > 0 &&
        (missedItems.length > 0 ? (
          <details className="rounded-xl bg-[#0e121a] border border-[#242c38] p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-[#aeb8c4] hover:text-white select-none">
              Show {correctItems.length} correct {correctItems.length === 1 ? "answer" : "answers"} from this set
            </summary>
            <ul className="mt-2.5 space-y-1.5 border-t border-[#1e2634] pt-2.5">
              {correctItems.map((item) => {
                const q = item.question;
                const correctOpt = q.options.find((o) => o.slug === q.correctSlug);
                return (
                  <li key={q.id} className="flex items-start gap-2 text-[#aeb8c4]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#69db7c] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">
                        Q{item.index + 1} ({q.target.symbol}):
                      </strong>{" "}
                      {describeOption(correctOpt, q.correctSlug)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        ) : (
          <div className="rounded-xl bg-[#0e121a] border border-[#69db7c]/30 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-[#69db7c]">
              Clean sweep — every element in this set answered accurately:
            </p>
            <div className="flex flex-wrap gap-2">
              {correctItems.map((item) => (
                <Link
                  key={item.question.id}
                  to={`/element/${item.question.target.slug}`}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#161c26] border border-[#2a323d] hover:border-[#69db7c] text-xs font-mono text-white inline-flex items-center gap-1.5 no-underline"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#69db7c]" />
                  <span>
                    {item.question.target.symbol} · {item.question.target.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
}
