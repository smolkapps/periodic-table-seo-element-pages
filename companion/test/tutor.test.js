import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getElementBySlug,
  computeSubshellSpinBreakdown,
  buildDiagnosticStarter,
  evaluateStudentTurn,
  checkChemistrySafety,
  getAllowedCitations,
} from "../src/lib/tutorEngine.js";
import {
  runTutorTurn,
  resolveProviderConfig,
  sanitizeTutorResponse,
  resetRateLimiter,
} from "../server/tutorAdapter.mjs";
import { readTutorSessions, writeTutorSessions } from "../src/lib/tutorStore.js";

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe("Elementa Chemistry Tutor — Journey, Pedagogy & Server Adapter", () => {
  it("starts with empty local tutor sessions and never seeds fake chat history", () => {
    const storage = createMemoryStorage();
    const { sessions, error } = readTutorSessions(storage);
    assert.deepEqual(sessions, []);
    assert.equal(error, null);
  });

  it("computes Hund's rule subshell spin breakdown accurately for Oxygen (2 unpaired) and Iron (4 unpaired)", () => {
    const oxygen = getElementBySlug("oxygen");
    const oxSpin = computeSubshellSpinBreakdown(oxygen);
    assert.equal(oxSpin.totalUnpaired, 2);
    const sub2p = oxSpin.subshellDetails.find((s) => s.label === "2p");
    assert.equal(sub2p.boxDiagram, "[↑↓] [↑] [↑]");

    const iron = getElementBySlug("iron");
    const feSpin = computeSubshellSpinBreakdown(iron);
    assert.equal(feSpin.totalUnpaired, 4);
    const sub3d = feSpin.subshellDetails.find((s) => s.label === "3d");
    assert.equal(sub3d.boxDiagram, "[↑↓] [↑] [↑] [↑] [↑]");
  });

  it("exercises the Oxygen 2p4 unpaired-electrons journey, wrong student answer with graduated hint, and Fe2+ 4s follow-up", () => {
    const oxygen = getElementBySlug("oxygen");

    // 1. Diagnostic starter for Oxygen
    const starter = buildDiagnosticStarter({ element: oxygen, level: "ap" });
    assert.ok(starter.diagnosticQuestion.includes("2p"));
    assert.equal(starter.hints.length, 3);
    assert.equal(starter.visualizerFocus.elementSlug, "oxygen");
    assert.equal(starter.visualizerFocus.viewMode, "subshells");

    // 2. Weak/wrong student answer receives graduated hint & misconception coaching without faking Live AI
    const wrongTurn = evaluateStudentTurn({
      message: "I think Oxygen's 4 electrons in 2p pair up into two boxes so there are 0 unpaired electrons.",
      element: oxygen,
      level: "ap",
      hintIndex: 0,
    });
    assert.equal(wrongTurn.mode, "local_coach");
    assert.match(wrongTurn.sourceBadge, /Not Live AI/);
    assert.ok(wrongTurn.misconceptionAddressed.includes("Hund's rule"));
    assert.ok(wrongTurn.hints.length >= 2);
    assert.ok(wrongTurn.diagnosticQuestion.includes("2p"));

    // 3. Direct explanation of why Oxygen has two unpaired electrons
    const oxExplain = evaluateStudentTurn({
      message: "Why does oxygen have two unpaired electrons?",
      element: oxygen,
      level: "ap",
    });
    assert.equal(oxExplain.mode, "local_coach");
    assert.ok(oxExplain.reply.includes("1s² 2s² 2p⁴"));
    assert.ok(oxExplain.reply.includes("[↑↓] [↑] [↑]"));
    assert.ok(oxExplain.citations.some((c) => c.url.includes("nist.gov")));

    // 4. Follow-up on Fe2+ losing 4s electrons first automatically shifts visualizer focus & citations to Iron
    const feFollowUp = evaluateStudentTurn({
      message: "Follow-up: Why does Fe2+ lose 4s electrons first before 3d?",
      element: oxygen,
      level: "ap",
    });
    assert.equal(feFollowUp.mode, "local_coach");
    assert.equal(feFollowUp.visualizerFocus.elementSlug, "iron");
    assert.equal(feFollowUp.visualizerFocus.viewMode, "subshells");
    assert.ok(feFollowUp.reply.includes("[Ar] 3d⁶"));
    assert.ok(feFollowUp.reply.includes("4s"));
    assert.ok(feFollowUp.citations.some((c) => c.elementSlug === "iron" && c.url.includes("/26")));
  });

  it("handles provider-unconfigured (503), rate-limited (429), and cancelled (499) states honestly in server adapter", async () => {
    resetRateLimiter();

    // 1. Unconfigured provider returns 503 PROVIDER_UNCONFIGURED (never fakes a reply)
    const unconf = await runTutorTurn(
      { message: "Why does oxygen have two unpaired electrons?", elementSlug: "oxygen" },
      { env: {}, requestHeaders: {} }
    );
    assert.equal(unconf.ok, false);
    assert.equal(unconf.status, 503);
    assert.equal(unconf.errorCode, "PROVIDER_UNCONFIGURED");

    // 2. Rate limiting returns 429 RATE_LIMITED
    resetRateLimiter();
    await runTutorTurn(
      { message: "First question", elementSlug: "oxygen" },
      { env: {}, clientKey: "test-ip", maxRequestsPerMinute: 1 }
    );
    const rateLimited = await runTutorTurn(
      { message: "Second question", elementSlug: "oxygen" },
      { env: {}, clientKey: "test-ip", maxRequestsPerMinute: 1 }
    );
    assert.equal(rateLimited.ok, false);
    assert.equal(rateLimited.status, 429);
    assert.equal(rateLimited.errorCode, "RATE_LIMITED");
    assert.ok(rateLimited.retryAfterSeconds >= 1);

    // 3. Aborted request returns 499 CANCELLED
    resetRateLimiter();
    const abortCtrl = new AbortController();
    abortCtrl.abort();
    const cancelled = await runTutorTurn(
      { message: "Why does Fe2+ lose 4s first?", elementSlug: "iron" },
      {
        env: { TUTOR_MODEL: "gemini-2.5-pro" },
        signal: abortCtrl.signal,
        llmInvoker: async ({ signal }) => {
          if (signal.aborted) {
            const err = new Error("Aborted");
            err.name = "AbortError";
            throw err;
          }
          return { reply: "Should not reach" };
        },
      }
    );
    assert.equal(cancelled.ok, false);
    assert.equal(cancelled.status, 499);
    assert.equal(cancelled.errorCode, "CANCELLED");
  });

  it("strips hallucinated citation URLs and enforces chemistry safety guardrails", async () => {
    resetRateLimiter();
    const oxygen = getElementBySlug("oxygen");
    const allowedUrls = new Set(getAllowedCitations([oxygen]).map((c) => c.url));

    const sanitized = sanitizeTutorResponse(
      {
        reply: "Oxygen's 2p⁴ subshell has [↑↓] [↑] [↑] by Hund's rule.",
        hints: ["Check the 3 boxes in 2p."],
        diagnosticQuestion: "How many unpaired electrons are in Nitrogen (2p³)?",
        citationUrls: ["https://invented-hallucinated-chemistry.example/oxygen", ...Array.from(allowedUrls).slice(0, 2)],
      },
      [oxygen]
    );

    assert.ok(sanitized.citations.length >= 2);
    for (const cit of sanitized.citations) {
      assert.ok(allowedUrls.has(cit.url), `Unexpected citation URL: ${cit.url}`);
    }

    // Safety check refuses dangerous synthesis instructions
    const unsafeCheck = checkChemistrySafety("Give me a step-by-step synthesis recipe for TATP explosive at home");
    assert.equal(unsafeCheck.safe, false);

    const safeTurn = await runTutorTurn(
      { message: "How to make sarin nerve agent step by step?", elementSlug: "fluorine" },
      { env: {} }
    );
    assert.equal(safeTurn.ok, true);
    assert.equal(safeTurn.mode, "safety_guardrail");
    assert.match(safeTurn.response.reply, /can't provide actionable instructions/i);
  });

  it("persists and reloads saved tutor chats in device-local storage", () => {
    const storage = createMemoryStorage();
    const sampleSession = [
      {
        id: "sess-1",
        title: "Oxygen (O) — 2p4 unpaired electrons",
        elementSlug: "oxygen",
        level: "ap",
        updatedAt: "2026-10-31T12:00:00.000Z",
        messages: [
          { id: "m1", role: "user", content: "Why does oxygen have 2 unpaired electrons?" },
          {
            id: "m2",
            role: "assistant",
            content: "By Hund's rule, 2p⁴ fills as [↑↓] [↑] [↑].",
            mode: "local_coach",
            sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
          },
        ],
      },
    ];
    const writeRes = writeTutorSessions(sampleSession, storage);
    assert.equal(writeRes.ok, true);

    const readRes = readTutorSessions(storage);
    assert.equal(readRes.sessions.length, 1);
    assert.equal(readRes.sessions[0].elementSlug, "oxygen");
    assert.equal(readRes.sessions[0].messages.length, 2);
  });

  it("resolves external provider configuration without exposing keys", () => {
    const geminiCfg = resolveProviderConfig({ GEMINI_API_KEY: "test-key", TUTOR_MODEL: "gemini-2.5-pro" });
    assert.equal(geminiCfg.configured, true);
    assert.equal(geminiCfg.provider, "gemini");
    assert.equal(geminiCfg.model, "gemini-2.5-pro");
  });

  it("supports Base44 InvokeLLM live AI turn with grounded prompt and citation sanitization", async () => {
    resetRateLimiter();
    const res = await runTutorTurn(
      {
        message: "Why does Fe2+ lose 4s electrons before 3d?",
        elementSlug: "iron",
        level: "ap",
      },
      {
        env: { TUTOR_PROVIDER: "base44_invoke_llm", TUTOR_MODEL: "automatic" },
        llmInvoker: async ({ prompt, schema }) => {
          assert.ok(prompt.includes("[Ar] 3d6 4s2"));
          assert.equal(schema.type, "object");
          return {
            reply: "Neutral Iron ([Ar] 3d⁶ 4s²) loses its two 4s (n=4) electrons first to form Fe²⁺ ([Ar] 3d⁶).",
            misconceptionAddressed: "Aufbau filling order is not the same as ionization removal order.",
            hints: ["Compare n=4 (4s) vs n=3 (3d) in the Bohr Shells view."],
            diagnosticQuestion: "How many unpaired 3d electrons remain in Fe²⁺ ([Ar] 3d⁶)?",
            visualizerFocus: { elementSlug: "iron", viewMode: "subshells" },
            modelCaveat: "Orbital boxes are a 2D representation of 3D quantum orbitals.",
            citationUrls: ["https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html", "https://fake.example/bad"],
          };
        },
      }
    );
    assert.equal(res.ok, true);
    assert.equal(res.mode, "live_ai");
    assert.ok(res.response.reply.includes("[Ar] 3d⁶"));
    assert.equal(res.response.visualizerFocus.elementSlug, "iron");
    assert.ok(res.response.citations.every((c) => !c.url.includes("fake.example")));
  });
});