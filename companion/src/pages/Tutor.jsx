import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorContextPanel from "@/components/tutor/TutorContextPanel";
import TutorMessageList from "@/components/tutor/TutorMessageList";
import {
  ELEMENTS,
  STUDENT_LEVELS,
  getElementBySlug,
  resolveComparisonSlugs,
  buildDiagnosticStarter,
  evaluateStudentTurn,
} from "@/lib/tutorEngine";
import { fetchTutorProviderStatus, sendTutorMessageToServer } from "@/lib/tutorClient";
import { useTutorSessions } from "@/lib/tutorStore";
import {
  Sparkles,
  BookOpen,
  RotateCcw,
  Send,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Trash2,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";

export default function Tutor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const elementParam = searchParams.get("element");
  const idsParam = searchParams.get("ids");
  const fromSource = searchParams.get("from");
  const quizPromptParam = searchParams.get("q");
  const quizChosenParam = searchParams.get("chosen");
  const walkthroughParam = searchParams.get("walkthrough");

  const initialElementSlug = useMemo(() => {
    if (elementParam && getElementBySlug(elementParam)) return getElementBySlug(elementParam).slug;
    if (idsParam) {
      const resolved = resolveComparisonSlugs(idsParam.split(","));
      if (resolved.length > 0) return resolved[0].slug;
    }
    return "oxygen";
  }, [elementParam, idsParam]);

  const [selectedSlug, setSelectedSlug] = useState(initialElementSlug);
  const [visualizerSlug, setVisualizerSlug] = useState(initialElementSlug);
  const [visualizerMode, setVisualizerMode] = useState("subshells");
  const [studentLevel, setStudentLevel] = useState("ap");
  // Working default on this branch is "live_ai" powered by Base44 InvokeLLM integration credits;
  // learners can also switch to "local_coach" (deterministic dataset coach) at any time.
  const [engineMode, setEngineMode] = useState("live_ai");
  const [simulateErrorMode, setSimulateErrorMode] = useState("");
  const [providerStatus, setProviderStatus] = useState({
    checked: true,
    configured: true,
    provider: "Base44 InvokeLLM",
    model: "automatic",
    reason: null,
  });

  const [sessionId, setSessionId] = useState(() => `tutor-${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [revealedStarterHints, setRevealedStarterHints] = useState(0);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");

  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  const { savedSessions, tutorStorageError, saveSession, deleteSession } = useTutorSessions();

  // Keep selectedSlug synced when URL ?element= changes
  useEffect(() => {
    if (elementParam && getElementBySlug(elementParam)) {
      const el = getElementBySlug(elementParam);
      setSelectedSlug(el.slug);
      setVisualizerSlug(el.slug);
    }
  }, [elementParam]);

  // Check server-side /api/tutor/status once on mount
  useEffect(() => {
    const ctrl = new AbortController();
    fetchTutorProviderStatus(ctrl.signal).then((st) => {
      setProviderStatus({
        checked: true,
        configured: Boolean(st?.configured),
        provider: st?.provider || "unconfigured",
        model: st?.model || null,
        reason: st?.reason || null,
      });
    });
    return () => ctrl.abort();
  }, []);

  const activeElement = useMemo(
    () => getElementBySlug(selectedSlug) || getElementBySlug("oxygen"),
    [selectedSlug]
  );

  const visualizerElement = useMemo(
    () => getElementBySlug(visualizerSlug) || activeElement,
    [visualizerSlug, activeElement]
  );

  const compareElements = useMemo(() => {
    if (!idsParam) return [];
    return resolveComparisonSlugs(idsParam.split(","));
  }, [idsParam]);

  const quizContext = useMemo(() => {
    if (fromSource !== "quiz" && !quizPromptParam) return null;
    return {
      prompt: quizPromptParam || "",
      chosen: quizChosenParam || "",
    };
  }, [fromSource, quizPromptParam, quizChosenParam]);

  const starter = useMemo(
    () =>
      buildDiagnosticStarter({
        element: activeElement,
        compareElements,
        level: studentLevel,
        quizContext,
      }),
    [activeElement, compareElements, studentLevel, quizContext]
  );

  useEffect(() => {
    document.title = `Chemistry Tutor (${activeElement.symbol}) — Elementa`;
  }, [activeElement.symbol]);

  // Optional explicit ?walkthrough=1 or ?walkthrough=live URL trigger for verification.
  // Normal visits (/tutor) never run this and always start with an empty conversation.
  const hasRunWalkthroughRef = useRef(false);
  useEffect(() => {
    if (!walkthroughParam || hasRunWalkthroughRef.current) return;
    hasRunWalkthroughRef.current = true;

    if (walkthroughParam === "live") {
      const q = "Why does oxygen (1s2 2s2 2p4) have two unpaired electrons, and why does Fe2+ lose 4s electrons first?";
      setIsSending(true);
      sendTutorMessageToServer({
        message: q,
        elementSlug: "oxygen",
        level: "ap",
        stage: "guided",
        history: [],
      }).then((res) => {
        setIsSending(false);
        if (res.ok) {
          setMessages([
            { id: "wl-u1", role: "user", content: q },
            {
              id: "wl-a1",
              role: "assistant",
              content: res.response.reply,
              mode: res.mode,
              sourceBadge: res.sourceBadge,
              ...res.response,
            },
          ]);
        }
      });
      return;
    }

    if (walkthroughParam !== "1") return;
    const ox = getElementBySlug("oxygen");
    const step1Q = "Why does oxygen (1s2 2s2 2p4) have two unpaired electrons?";
    const step1Ans = evaluateStudentTurn({ message: step1Q, element: ox, level: "ap", hintIndex: 0 });
    const step2Q = "I think Oxygen's 4 electrons in 2p pair up into two boxes so it has 0 unpaired electrons.";
    const step2Ans = evaluateStudentTurn({ message: step2Q, element: ox, level: "ap", hintIndex: 1 });
    const step3Q = "Follow-up: Why does Fe2+ lose 4s electrons before 3d?";
    const step3Ans = evaluateStudentTurn({ message: step3Q, element: ox, level: "ap", hintIndex: 1 });

    setMessages([
      { id: "w-u1", role: "user", content: step1Q },
      { id: "w-a1", role: "assistant", content: step1Ans.reply, ...step1Ans },
      { id: "w-u2", role: "user", content: step2Q },
      { id: "w-a2", role: "assistant", content: step2Ans.reply, ...step2Ans },
      { id: "w-u3", role: "user", content: step3Q },
      { id: "w-a3", role: "assistant", content: step3Ans.reply, ...step3Ans },
    ]);
    setVisualizerSlug("iron");
    setVisualizerMode("subshells");
    setEngineMode("live_ai");

    const preserved = "Can you give me one more check question comparing Fe2+ ([Ar] 3d6) and Fe3+ ([Ar] 3d5)?";
    setDraftMessage(preserved);
    sendTutorMessageToServer(
      { message: preserved, elementSlug: "iron", level: "ap" },
      { simulateError: "provider_unconfigured" }
    ).then((res) => {
      if (!res.ok) {
        setRequestError({
          errorCode: res.errorCode,
          message: res.error,
          retryAfterSeconds: res.retryAfterSeconds || null,
          preservedText: preserved,
        });
      }
    });
  }, [walkthroughParam]);

  const handleElementChange = (nextSlug) => {
    const el = getElementBySlug(nextSlug);
    if (!el) return;
    setSelectedSlug(el.slug);
    setVisualizerSlug(el.slug);
    setRevealedStarterHints(0);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("element", el.slug);
    setSearchParams(nextParams, { replace: true });
  };

  const handleStartFreshSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setMessages([]);
    setRevealedStarterHints(0);
    setRequestError(null);
    setSessionId(`tutor-${Date.now()}`);
    setStatusNotice("Started a fresh tutor session.");
    setTimeout(() => setStatusNotice(""), 2400);
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const appendAssistantTurn = (userText, turnObj) => {
    const userEntry = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: userText,
    };
    const assistantEntry = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      content: turnObj.reply,
      mode: turnObj.mode || "local_coach",
      sourceBadge: turnObj.sourceBadge || "Guided Socratic Coach (Local Dataset — Not Live AI)",
      misconceptionAddressed: turnObj.misconceptionAddressed || null,
      hints: turnObj.hints || [],
      diagnosticQuestion: turnObj.diagnosticQuestion || null,
      visualizerFocus: turnObj.visualizerFocus || { elementSlug: activeElement.slug, viewMode: "subshells" },
      modelCaveat: turnObj.modelCaveat || starter.modelCaveat,
      citations: turnObj.citations || starter.citations,
    };

    setMessages((prev) => [...prev, userEntry, assistantEntry]);

    if (assistantEntry.visualizerFocus?.elementSlug) {
      setVisualizerSlug(assistantEntry.visualizerFocus.elementSlug);
    }
    if (assistantEntry.visualizerFocus?.viewMode) {
      setVisualizerMode(assistantEntry.visualizerFocus.viewMode);
    }
  };

  const submitMessage = async (textOverride, forceEngine = null) => {
    const text = typeof textOverride === "string" ? textOverride.trim() : draftMessage.trim();
    if (!text || isSending) return;

    const targetEngine = forceEngine || engineMode;
    setRequestError(null);

    if (targetEngine === "local_coach") {
      const localResult = evaluateStudentTurn({
        message: text,
        element: activeElement,
        compareElements,
        level: studentLevel,
        hintIndex: revealedStarterHints,
        quizContext,
      });
      appendAssistantTurn(text, localResult);
      setDraftMessage("");
      return;
    }

    // Live AI mode (default: Base44 InvokeLLM integration; optional: portable /api/tutor server adapter)
    setIsSending(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const result = await sendTutorMessageToServer(
      {
        message: text,
        elementSlug: activeElement.slug,
        compareSlugs: compareElements.map((e) => e.slug),
        level: studentLevel,
        stage: "guided",
        quizContext,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      {
        signal: controller.signal,
        simulateError: simulateErrorMode || null,
      }
    );

    abortControllerRef.current = null;
    setIsSending(false);

    if (!result.ok) {
      // Preserve draftMessage in the input box so the learner never loses their typed question
      setDraftMessage(text);
      setRequestError({
        errorCode: result.errorCode || "UPSTREAM_ERROR",
        message: result.error,
        retryAfterSeconds: result.retryAfterSeconds || null,
        preservedText: text,
      });
      return;
    }

    appendAssistantTurn(text, {
      mode: result.mode || "live_ai",
      sourceBadge: result.sourceBadge || `Live AI (${result.provider} · ${result.model})`,
      ...result.response,
    });
    setDraftMessage("");
  };

  const handleSaveCurrentSession = () => {
    if (messages.length === 0) {
      setStatusNotice("Send at least one question before saving a session.");
      setTimeout(() => setStatusNotice(""), 2500);
      return;
    }
    const res = saveSession({
      id: sessionId,
      title: `${activeElement.name} (${activeElement.symbol}) — ${messages[0]?.content.slice(0, 48) || "Study Session"}`,
      elementSlug: activeElement.slug,
      level: studentLevel,
      updatedAt: new Date().toISOString(),
      messages,
    });
    if (res.ok) {
      setStatusNotice("Session saved to this browser's local storage.");
      setTimeout(() => setStatusNotice(""), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header & Mode Controls */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131822] border border-[#242c38] rounded-2xl p-4 sm:p-5">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#4f9dff]" />
                <span>Conversational Chemistry Tutor</span>
              </h1>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  engineMode === "live_ai"
                    ? providerStatus.configured
                      ? "bg-[#69db7c]/15 text-[#69db7c] border-[#69db7c]/40"
                      : "bg-[#ffd43b]/15 text-[#ffd43b] border-[#ffd43b]/40"
                    : "bg-[#4f9dff]/15 text-[#7bb6ff] border-[#4f9dff]/35"
                }`}
              >
                {engineMode === "live_ai"
                  ? providerStatus.configured
                    ? `Live AI Ready (${providerStatus.provider})`
                    : "Live AI Selected (Server Provider Unconfigured)"
                  : "Guided Socratic Coach (Local Dataset — Not Live AI)"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
              Diagnostic questions, graduated hints, and misconception coaching connected to Elementa&apos;s Bohr shell
              and subshell orbital diagrams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStartFreshSession}
              className="px-3 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#7bb6ff]" />
              <span>Start Fresh Session</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCurrentSession}
              className="px-3 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#69db7c] text-xs font-semibold text-[#e9edf2] flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-[#69db7c]" />
              <span>Save Chat Locally</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSavedDrawer((v) => !v)}
              className="px-3 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-[#aeb8c4] hover:text-white flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Saved Chats ({savedSessions.length})</span>
            </button>
          </div>
        </header>

        {/* Missed Quiz Context Banner if navigated from a missed quiz question */}
        {quizContext && quizContext.prompt && (
          <div className="rounded-xl bg-[#ffa94d]/10 border border-[#ffa94d]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-mono uppercase text-[10px] text-[#ffa94d] block">
                Launched from Practice Quiz • Focusing on {activeElement.name} ({activeElement.symbol})
              </span>
              <p className="text-white font-medium">Question: {quizContext.prompt}</p>
              {quizContext.chosen && (
                <p className="text-[#ffd8a8]">Your selected option: {quizContext.chosen}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                submitMessage(
                  `Help me understand this quiz question about ${activeElement.name}: "${quizContext.prompt}"${
                    quizContext.chosen ? ` (I chose ${quizContext.chosen})` : ""
                  }. Give me a hint first without giving away the whole answer.`
                )
              }
              className="px-3 py-1.5 rounded-lg bg-[#ffa94d] text-[#0b0e14] font-bold text-xs shrink-0 hover:bg-[#ffc078]"
            >
              Unpack Missed Answer →
            </button>
          </div>
        )}

        {/* Configuration Bar: Element, Student Level, Engine Mode, and Error/Offline State Verifier */}
        <section
          aria-label="Tutor session settings"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 bg-[#131822] border border-[#242c38] rounded-xl p-3.5"
        >
          {/* Element Picker */}
          <label className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#8b98a9]">Element / Topic Focus</span>
            <select
              aria-label="Element focus"
              value={activeElement.slug}
              onChange={(e) => handleElementChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] text-xs sm:text-sm text-white focus:outline-none focus:border-[#4f9dff]"
            >
              {ELEMENTS.map((el) => (
                <option key={el.slug} value={el.slug}>
                  {el.number} · {el.symbol} — {el.name} ({el.electronConfig})
                </option>
              ))}
            </select>
          </label>

          {/* Student Level Selector */}
          <div className="xl:col-span-4 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#8b98a9]">Student Level</span>
            <div className="grid grid-cols-3 gap-1 bg-[#1c232d] p-1 rounded-lg border border-[#2a323d]">
              {STUDENT_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setStudentLevel(lvl.id)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors truncate ${
                    studentLevel === lvl.id
                      ? "bg-[#4f9dff] text-[#07121f] font-bold"
                      : "text-[#aeb8c4] hover:text-white"
                  }`}
                  title={lvl.description}
                >
                  <span className="sm:hidden">
                    {lvl.id === "intro" ? "Intro" : lvl.id === "ap" ? "AP / IB" : "Advanced"}
                  </span>
                  <span className="hidden sm:inline">{lvl.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Honest Response Engine Selector */}
          <div className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#8b98a9]">Tutor Engine (Honest Labeling)</span>
            <div className="grid grid-cols-2 gap-1 bg-[#1c232d] p-1 rounded-lg border border-[#2a323d]">
              <button
                type="button"
                onClick={() => {
                  setEngineMode("local_coach");
                  setRequestError(null);
                }}
                title="Guided Socratic Coach (Local Dataset — Not Live AI)"
                className={`px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                  engineMode === "local_coach"
                    ? "bg-[#4f9dff] text-[#07121f] font-bold"
                    : "text-[#aeb8c4] hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Local Coach</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEngineMode("live_ai");
                  setRequestError(null);
                }}
                title="Live AI via Base44 InvokeLLM integration (default)"
                className={`px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                  engineMode === "live_ai"
                    ? "bg-[#69db7c] text-[#07121f] font-bold"
                    : "text-[#aeb8c4] hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Live AI</span>
              </button>
            </div>
          </div>

          {/* Network / Provider State Verifier */}
          <label className="xl:col-span-2 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#8b98a9]">Adapter State Check</span>
            <select
              aria-label="Adapter state check"
              value={simulateErrorMode}
              onChange={(e) => setSimulateErrorMode(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] text-xs text-[#aeb8c4] focus:outline-none focus:border-[#4f9dff]"
            >
              <option value="">Normal Connection</option>
              <option value="provider_unconfigured">Test: Provider Unconfigured (503)</option>
              <option value="offline">Test: Offline / No Network</option>
              <option value="rate_limited">Test: Rate Limit (429)</option>
            </select>
          </label>
        </section>

        {/* Saved Local Sessions Drawer */}
        {showSavedDrawer && (
          <section className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                Saved Tutor Chats on This Device ({savedSessions.length})
              </h2>
              <span className="text-[11px] text-[#8b98a9]">Stored only in localStorage • Never uploaded</span>
            </div>
            {savedSessions.length === 0 ? (
              <p className="text-xs text-[#8b98a9]">
                No saved chats yet. Use &ldquo;Save Chat Locally&rdquo; to keep a conversation on this device.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-lg bg-[#0e121a] border border-[#242c38] flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSessionId(sess.id);
                        setSelectedSlug(sess.elementSlug);
                        setVisualizerSlug(sess.elementSlug);
                        setStudentLevel(sess.level || "ap");
                        setMessages(sess.messages || []);
                        setShowSavedDrawer(false);
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <span className="text-xs font-semibold text-white truncate block">{sess.title}</span>
                      <span className="text-[10px] font-mono text-[#7a8694]">
                        {sess.messages.length} turns • {sess.updatedAt.slice(0, 10)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSession(sess.id)}
                      aria-label={`Delete saved chat ${sess.title}`}
                      className="p-1.5 rounded text-[#7a8694] hover:text-[#ff6b6b]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(statusNotice || tutorStorageError) && (
          <div
            role="status"
            className="px-3.5 py-2 rounded-lg bg-[#4f9dff]/15 border border-[#4f9dff]/40 text-xs text-white"
          >
            {tutorStorageError || statusNotice}
          </div>
        )}

        {/* Main 2-Column Tutor Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Conversation + Composer */}
          <div className="lg:col-span-7 space-y-4">
            <TutorMessageList
              starter={starter}
              messages={messages}
              revealedStarterHints={revealedStarterHints}
              onRevealNextStarterHint={() =>
                setRevealedStarterHints((prev) => Math.min((starter.hints || []).length, prev + 1))
              }
              onRevealFullStarterExplanation={() => {
                if (activeElement.slug === "oxygen") {
                  submitMessage("Why does oxygen (1s2 2s2 2p4) have two unpaired electrons?", "local_coach");
                } else if (activeElement.slug === "iron") {
                  submitMessage("Why does Fe2+ lose 4s electrons before 3d?", "local_coach");
                } else {
                  submitMessage(
                    `Explain the full answer to the diagnostic question for ${activeElement.name} (${activeElement.symbol}).`,
                    "local_coach"
                  );
                }
              }}
              onInspectInVisualizer={(slug, mode) => {
                if (getElementBySlug(slug)) setVisualizerSlug(slug);
                if (mode) setVisualizerMode(mode);
              }}
              onUseQuickPrompt={(promptText) => {
                setDraftMessage(promptText);
                submitMessage(promptText);
              }}
            />

            {/* Honest Error / Unconfigured / Offline / Rate-Limit Alert Banner */}
            {requestError && (
              <div
                role="alert"
                className="rounded-xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/50 p-4 space-y-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#ff6b6b] shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <span className="font-mono uppercase text-[10px] text-[#ffa8a8] block">
                      Live AI Request Failed • {requestError.errorCode} (No Fake Response Generated)
                    </span>
                    <p className="text-white font-medium leading-relaxed">{requestError.message}</p>
                    <p className="text-[#aeb8c4]">
                      Your typed message is preserved in the box below so you can edit, retry, or answer using the
                      local Socratic dataset coach.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => submitMessage(draftMessage || requestError.preservedText, "live_ai")}
                    className="px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#ff6b6b]/50 hover:border-white text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Live AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEngineMode("local_coach");
                      submitMessage(draftMessage || requestError.preservedText, "local_coach");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Answer with Guided Socratic Coach (Local Dataset — Not Live AI)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Free-Form Question & Diagnostic Answer Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
              className="rounded-xl bg-[#131822] border border-[#242c38] p-3.5 space-y-3 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8b98a9]">
                <label htmlFor="tutor-question-input" className="font-medium text-[#e9edf2]">
                  Ask a chemistry question or answer the diagnostic check ({activeElement.name}):
                </label>
                <span className="font-mono">Enter to send · Shift+Enter for newline</span>
              </div>

              <textarea
                ref={inputRef}
                id="tutor-question-input"
                rows={3}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitMessage();
                  }
                }}
                placeholder={`Try answering the diagnostic question for ${activeElement.name}, or ask e.g. "Why does oxygen have 2 unpaired electrons?" or "Why does Fe2+ lose 4s electrons first?"…`}
                className="w-full rounded-lg bg-[#0e121a] border border-[#2a323d] p-3 text-xs sm:text-sm text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-[#7a8694] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4f9dff] shrink-0" />
                  <span>
                    {engineMode === "live_ai"
                      ? `Live AI sends this question & element context to ${providerStatus.provider || "Base44 InvokeLLM"}. `
                      : "Local Coach runs 100% on your device with zero network calls. "}
                    <Link to="/privacy" className="text-[#7bb6ff] hover:underline">
                      Privacy details
                    </Link>
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  {isSending && (
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      className="px-3 py-2 rounded-lg bg-[#ff6b6b]/20 border border-[#ff6b6b] text-xs font-semibold text-[#ffc9c9] flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSending || !draftMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] disabled:opacity-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Waiting for Provider…" : "Send"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Connected Atom Visualizer + Model Boundaries + Dataset Citations */}
          <div className="lg:col-span-5">
            <TutorContextPanel
              activeElement={activeElement}
              visualizerElement={visualizerElement}
              visualizerMode={visualizerMode}
              compareElements={compareElements}
              modelCaveat={starter.modelCaveat}
              citations={starter.citations}
              onSelectElementSlug={(slug) => {
                setVisualizerSlug(slug);
                handleElementChange(slug);
              }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}