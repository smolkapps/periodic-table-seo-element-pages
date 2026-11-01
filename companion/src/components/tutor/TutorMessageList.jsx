import React from "react";
import {
  HelpCircle,
  Lightbulb,
  AlertCircle,
  ExternalLink,
  Atom,
  Sparkles,
  BookOpen,
  Eye,
} from "lucide-react";

export default function TutorMessageList({
  starter,
  messages,
  revealedStarterHints,
  onRevealNextStarterHint,
  onRevealFullStarterExplanation,
  onInspectInVisualizer,
  onUseQuickPrompt,
}) {
  return (
    <div className="space-y-4">
      {/* Initial Diagnostic Card (always visible at top of session so learner has a clear diagnostic anchor) */}
      {starter && (
        <section
          aria-label="Diagnostic starting question"
          className="rounded-xl bg-[#141b27] border border-[#2c384e] p-4 sm:p-5 space-y-3.5 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#4f9dff]/15 text-[#7bb6ff] border border-[#4f9dff]/30">
              Diagnostic Check • Reference Dataset Grounded (Not Live AI)
            </span>
            <button
              type="button"
              onClick={() =>
                onInspectInVisualizer(
                  starter.visualizerFocus?.elementSlug || "oxygen",
                  starter.visualizerFocus?.viewMode || "subshells"
                )
              }
              className="text-[11px] font-mono text-[#7bb6ff] hover:underline flex items-center gap-1"
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Sync Visualizer ({starter.visualizerFocus?.viewMode === "bohr" ? "Bohr Shells" : "Subshells"})</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">{starter.topicTitle}</h2>
            <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">{starter.summary}</p>
          </div>

          {/* Diagnostic Question Box */}
          <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#4f9dff]/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#7bb6ff]">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Short Diagnostic Question (Answer below or request a graduated hint first)</span>
            </div>
            <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">{starter.diagnosticQuestion}</p>
          </div>

          {/* Graduated Hints Progression */}
          {starter.hints && starter.hints.length > 0 && (
            <div className="space-y-2">
              {revealedStarterHints > 0 && (
                <div className="space-y-1.5" aria-live="polite">
                  {starter.hints.slice(0, revealedStarterHints).map((hint, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#ffd43b]/10 border border-[#ffd43b]/35 text-xs text-[#ffe066] flex items-start gap-2"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-[#ffd43b] shrink-0 mt-0.5" />
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {revealedStarterHints < starter.hints.length && (
                  <button
                    type="button"
                    onClick={onRevealNextStarterHint}
                    className="px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#ffd43b]/50 hover:bg-[#ffd43b]/15 text-xs font-semibold text-[#ffd43b] flex items-center gap-1.5 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>
                      Reveal Hint {revealedStarterHints + 1} of {starter.hints.length}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRevealFullStarterExplanation}
                  className="px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-[#aeb8c4] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#7bb6ff]" />
                  <span>Explain Full Answer Now</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Conversation Turns */}
      {messages.length === 0 ? (
        <div className="rounded-xl bg-[#131822]/70 border border-dashed border-[#2a323d] p-4 text-xs text-[#8b98a9] space-y-2">
          <p className="font-semibold text-[#e9edf2]">
            No messages in this session yet — your chat history starts empty and stays on this device.
          </p>
          <p>
            Type your answer to the diagnostic question above, ask any free-form chemistry question, or test a sample
            student journey:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onUseQuickPrompt("Why does oxygen (1s2 2s2 2p4) have two unpaired electrons?")}
              className="px-2.5 py-1.5 rounded-lg bg-[#1a2230] border border-[#2c374b] hover:border-[#4f9dff] text-xs text-white text-left"
            >
              1. Ask why Oxygen has 2 unpaired e⁻ →
            </button>
            <button
              type="button"
              onClick={() =>
                onUseQuickPrompt("I think Oxygen's 4 electrons in 2p pair up into two boxes so it has 0 unpaired electrons.")
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#1a2230] border border-[#2c374b] hover:border-[#ffd43b] text-xs text-[#ffe066] text-left"
            >
              2. Test wrong student answer (get Hint) →
            </button>
            <button
              type="button"
              onClick={() => onUseQuickPrompt("Follow-up: Why does Fe2+ lose 4s electrons before 3d?")}
              className="px-2.5 py-1.5 rounded-lg bg-[#1a2230] border border-[#2c374b] hover:border-[#69db7c] text-xs text-[#69db7c] text-left"
            >
              3. Follow-up: Fe²⁺ losing 4s before 3d →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4" role="log" aria-live="polite" aria-label="Chemistry tutor conversation">
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-[#1f2c3f] border border-[#385072] px-4 py-3 text-xs sm:text-sm text-white space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#8fb8ff] block">Your Question / Answer</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            }

            const isLiveAi = msg.mode === "live_ai";
            return (
              <article
                key={msg.id}
                className="rounded-2xl rounded-bl-sm bg-[#131822] border border-[#242c38] p-4 sm:p-5 space-y-3.5 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2634] pb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isLiveAi
                        ? "bg-[#69db7c]/15 text-[#69db7c] border-[#69db7c]/40"
                        : "bg-[#4f9dff]/15 text-[#7bb6ff] border-[#4f9dff]/35"
                    }`}
                  >
                    {isLiveAi ? <Sparkles className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                    <span>{msg.sourceBadge || "Guided Socratic Coach (Local Dataset — Not Live AI)"}</span>
                  </span>

                  {msg.visualizerFocus?.elementSlug && (
                    <button
                      type="button"
                      onClick={() =>
                        onInspectInVisualizer(
                          msg.visualizerFocus.elementSlug,
                          msg.visualizerFocus.viewMode || "subshells"
                        )
                      }
                      className="text-[11px] font-mono text-[#7bb6ff] hover:underline flex items-center gap-1"
                    >
                      <Atom className="w-3.5 h-3.5" />
                      <span>
                        Inspect {msg.visualizerFocus.elementSlug} ({msg.visualizerFocus.viewMode}) in Visualizer →
                      </span>
                    </button>
                  )}
                </div>

                {/* Main Explanation */}
                <p className="text-xs sm:text-sm text-[#e9edf2] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Misconception Addressed */}
                {msg.misconceptionAddressed && (
                  <div className="p-3 rounded-lg bg-[#ffa94d]/10 border border-[#ffa94d]/35 text-xs text-[#ffd8a8] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ffa94d] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#ffa94d] block mb-0.5">Misconception &amp; Model Check</strong>
                      <span>{msg.misconceptionAddressed}</span>
                    </div>
                  </div>
                )}

                {/* Graduated Hints inside turn */}
                {Array.isArray(msg.hints) && msg.hints.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase text-[#ffd43b] flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Graduated Study Hints:
                    </span>
                    {msg.hints.map((hint, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-2.5 rounded-lg bg-[#0e121a] border border-[#242c38] text-xs text-[#aeb8c4]"
                      >
                        {hint}
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Diagnostic Question */}
                {msg.diagnosticQuestion && (
                  <div className="p-3 rounded-lg bg-[#0e121a] border border-[#4f9dff]/35 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#7bb6ff] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Next Check Question:
                    </span>
                    <p className="text-xs sm:text-sm text-white font-medium">{msg.diagnosticQuestion}</p>
                  </div>
                )}

                {/* Model Caveat */}
                {msg.modelCaveat && (
                  <p className="text-[11px] text-[#8b98a9] italic border-l-2 border-[#2a323d] pl-2.5">
                    {msg.modelCaveat}
                  </p>
                )}

                {/* Cited Dataset Reference Links */}
                {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-[#1e2634] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#7a8694]">Dataset References:</span>
                    {msg.citations.map((cit) => (
                      <a
                        key={`${cit.source}-${cit.url}`}
                        href={cit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e121a] border border-[#242c38] hover:border-[#4f9dff] text-[11px] text-[#aeb8c4] hover:text-white no-underline"
                      >
                        <span>{cit.source}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}