/**
 * Elementa Server-Side Chemistry Tutor Provider Adapter (`server/tutorAdapter.mjs`).
 *
 * Ownership & Portability Guarantee:
 * - Runs strictly on the server (Vite dev/preview middleware, standalone `node server/tutorServer.mjs`,
 *   or any Node/serverless host after export).
 * - Never exposes API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `TUTOR_API_KEY`)
 *   to the browser bundle.
 * - Requires zero Base44 database entities; all study progress and saved chats stay local to the learner's device.
 * - Supports:
 *     1. Google Gemini API (`GEMINI_API_KEY`, default model `gemini-2.5-pro`)
 *     2. OpenAI / OpenAI-compatible Chat Completions (`OPENAI_API_KEY` or `TUTOR_API_URL` + `TUTOR_API_KEY`)
 *     3. Anthropic Messages API (`ANTHROPIC_API_KEY`)
 *     4. Base44 preview integration (`llmInvoker` or forwarded preview token when running inside Base44 builder)
 * - If no provider is configured, returns an honest HTTP 503 `PROVIDER_UNCONFIGURED` (never fakes a live AI response).
 */
import { createClient } from "@base44/sdk";
import {
  MAX_MESSAGE_CHARS,
  MAX_HISTORY_TURNS,
  getElementBySlug,
  resolveComparisonSlugs,
  checkChemistrySafety,
  detectReferencedElement,
  getAllowedCitations,
  buildModelCaveat,
  buildTutorPrompt,
  TUTOR_RESPONSE_JSON_SCHEMA,
  sanitizeTutorResponse,
} from "../src/lib/tutorEngine.js";

export {
  MAX_MESSAGE_CHARS,
  MAX_HISTORY_TURNS,
  buildTutorPrompt,
  TUTOR_RESPONSE_JSON_SCHEMA,
  sanitizeTutorResponse,
};
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 20;

const rateBuckets = new Map();

export function resetRateLimiter() {
  rateBuckets.clear();
}

export function checkRateLimit(clientKey = "local", now = Date.now(), maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  const key = String(clientKey || "local");
  const entry = rateBuckets.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }
  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSeconds: 0 };
}

/**
 * Resolves which server-side AI provider is active without ever leaking secret values.
 */
export function resolveProviderConfig(env = {}, requestHeaders = {}, customInvoker = null) {
  const forcedProvider = String(env.TUTOR_PROVIDER || "").trim().toLowerCase();

  if (forcedProvider === "none" || forcedProvider === "unconfigured") {
    return { configured: false, provider: "unconfigured", model: null, reason: "TUTOR_PROVIDER is set to unconfigured." };
  }

  if ( typeof customInvoker === "function" ) {
    return {
      configured: true,
      provider: forcedProvider || "custom_adapter",
      model: env.TUTOR_MODEL || "gemini-4-argon-max",
    };
  }

  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey && (!forcedProvider || forcedProvider === "gemini")) {
    return {
      configured: true,
      provider: "gemini",
      model: env.TUTOR_MODEL || "gemini-2.5-pro",
      apiKey: geminiKey,
      apiUrl: env.TUTOR_API_URL || "https://generativelanguage.googleapis.com/v1beta",
    };
  }

  const openaiKey = env.OPENAI_API_KEY || env.TUTOR_API_KEY;
  if (openaiKey && (!forcedProvider || forcedProvider === "openai" || forcedProvider === "openai_compatible")) {
    return {
      configured: true,
      provider: env.TUTOR_API_URL ? "openai_compatible" : "openai",
      model: env.TUTOR_MODEL || "gpt-4o",
      apiKey: openaiKey,
      apiUrl: (env.TUTOR_API_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    };
  }

  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey && (!forcedProvider || forcedProvider === "anthropic")) {
    return {
      configured: true,
      provider: "anthropic",
      model: env.TUTOR_MODEL || "claude-sonnet-4-20250514",
      apiKey: anthropicKey,
      apiUrl: (env.TUTOR_API_URL || "https://api.anthropic.com/v1").replace(/\/+$/, ""),
    };
  }

  // Optional Base44 preview / platform integration when running inside Base44 with a valid session/service token
  const authHeader =
    requestHeaders["authorization"] ||
    requestHeaders["Authorization"] ||
    requestHeaders["x-base44-preview-token"] ||
    "";
  const bearerToken = String(authHeader).startsWith("Bearer ")
    ? String(authHeader).slice(7).trim()
    : String(authHeader).trim();
  const appId =
    requestHeaders["x-base44-app-id"] ||
    env.BASE44_APP_ID ||
    env.VITE_BASE44_APP_ID ||
    "";

  if (bearerToken && appId && (!forcedProvider || forcedProvider === "base44")) {
    return {
      configured: true,
      provider: "base44_preview",
      model: env.TUTOR_MODEL || "automatic",
      appId,
      token: bearerToken,
      serverUrl: env.VITE_BASE44_APP_BASE_URL || "https://base44.app",
    };
  }

  return {
    configured: false,
    provider: "unconfigured",
    model: null,
    reason:
      "No server-side AI provider key is configured. Set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or TUTOR_API_URL + TUTOR_API_KEY on the server, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
  };
}

async function callProvider(config, prompt, signal, customInvoker) {
  if (typeof customInvoker === "function") {
    return await customInvoker({ prompt, schema: TUTOR_RESPONSE_JSON_SCHEMA, config, signal });
  }

  if (config.provider === "gemini") {
    const url = `${config.apiUrl}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(
      config.apiKey
    )}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });
    if (res.status === 429) {
      const err = new Error("Upstream Gemini rate limit reached.");
      err.status = 429;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`Gemini provider returned HTTP ${res.status}.`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  }

  if (config.provider === "openai" || config.provider === "openai_compatible") {
    const url = `${config.apiUrl}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (res.status === 429) {
      const err = new Error("Upstream OpenAI rate limit reached.");
      err.status = 429;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`OpenAI provider returned HTTP ${res.status}.`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  if (config.provider === "anthropic") {
    const url = `${config.apiUrl}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (res.status === 429) {
      const err = new Error("Upstream Anthropic rate limit reached.");
      err.status = 429;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`Anthropic provider returned HTTP ${res.status}.`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return data?.content?.[0]?.text || "";
  }

  if (config.provider === "base44_preview") {
    const client = createClient({
      serverUrl: config.serverUrl,
      appId: config.appId,
      token: config.token,
    });
    const invokePayload = {
      prompt,
      response_json_schema: TUTOR_RESPONSE_JSON_SCHEMA,
    };
    if (config.model && config.model !== "automatic") {
      invokePayload.model = config.model;
    }
    return await client.integrations.Core.InvokeLLM(invokePayload);
  }

  const err = new Error("Provider not configured.");
  err.status = 503;
  throw err;
}

/**
 * Executes a single server-side chemistry tutor turn.
 */
export async function runTutorTurn(payload = {}, options = {}) {
  const {
    env = {},
    requestHeaders = {},
    clientKey = "local",
    signal,
    llmInvoker = null,
    maxRequestsPerMinute = RATE_LIMIT_MAX_REQUESTS,
  } = options;

  // Allow explicit diagnostic simulation of error states for verification & tests
  const simulateError = payload?.simulateError || requestHeaders["x-tutor-simulate-error"];
  if (simulateError === "provider_unconfigured") {
    return {
      ok: false,
      status: 503,
      errorCode: "PROVIDER_UNCONFIGURED",
      error:
        "No live AI provider is configured on the server. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY on the server, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
    };
  }
  if (simulateError === "rate_limited") {
    return {
      ok: false,
      status: 429,
      errorCode: "RATE_LIMITED",
      retryAfterSeconds: 15,
      error: "Rate limit reached for Live AI Tutor requests. Wait 15 seconds and retry, or use the Guided Socratic Coach.",
    };
  }

  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return {
      ok: false,
      status: 400,
      errorCode: "EMPTY_MESSAGE",
      error: "Please enter a chemistry question or answer before sending.",
    };
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      status: 400,
      errorCode: "MESSAGE_TOO_LONG",
      error: `Please keep your message under ${MAX_MESSAGE_CHARS} characters.`,
    };
  }

  const rate = checkRateLimit(clientKey, Date.now(), maxRequestsPerMinute);
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      errorCode: "RATE_LIMITED",
      retryAfterSeconds: rate.retryAfterSeconds,
      error: `Too many requests in a short window. Please wait ${rate.retryAfterSeconds}s and press Retry.`,
    };
  }

  const primaryElement = getElementBySlug(payload?.elementSlug || "oxygen") || getElementBySlug("oxygen");
  const referencedElement = detectReferencedElement(message, primaryElement) || primaryElement;
  const compareElements = Array.isArray(payload?.compareSlugs) && payload.compareSlugs.length >= 2
    ? resolveComparisonSlugs(payload.compareSlugs)
    : [];
  const activeElements = [];
  for (const el of [referencedElement, primaryElement, ...compareElements].filter(Boolean)) {
    if (!activeElements.some((x) => x.slug === el.slug)) activeElements.push(el);
  }

  // Safety check before calling any external model
  const safety = checkChemistrySafety(message);
  if (!safety.safe) {
    return {
      ok: true,
      mode: "safety_guardrail",
      provider: "server_safety_filter",
      model: "deterministic",
      sourceBadge: "Chemistry Safety Guardrail (Server Filter)",
      response: {
        reply: safety.refusal,
        misconceptionAddressed: null,
        hints: [],
        diagnosticQuestion: null,
        visualizerFocus: { elementSlug: primaryElement.slug, viewMode: "bohr" },
        modelCaveat: buildModelCaveat(primaryElement),
        citations: getAllowedCitations(activeElements).slice(0, 4),
      },
    };
  }

  const config = resolveProviderConfig(env, requestHeaders, llmInvoker);
  if (!config.configured) {
    return {
      ok: false,
      status: 503,
      errorCode: "PROVIDER_UNCONFIGURED",
      error: config.reason,
    };
  }

  const prompt = buildTutorPrompt({
    message,
    primaryElement,
    referencedElement,
    compareElements,
    level: payload?.level || "ap",
    stage: payload?.stage || "guided",
    quizContext: payload?.quizContext || null,
    history: payload?.history || [],
  });

  try {
    const rawResult = await callProvider(config, prompt, signal, llmInvoker);
    const sanitized = sanitizeTutorResponse(rawResult, activeElements);
    return {
      ok: true,
      mode: "live_ai",
      provider: config.provider,
      model: config.model,
      sourceBadge: `Live AI (${config.provider} · ${config.model})`,
      response: sanitized,
    };
  } catch (err) {
    if (err?.name === "AbortError" || signal?.aborted) {
      return {
        ok: false,
        status: 499,
        errorCode: "CANCELLED",
        error: "Tutor request was cancelled. Your message is still in the box so you can edit or retry.",
      };
    }
    const status = Number(err?.status || err?.response?.status) || 502;
    if (status === 429) {
      return {
        ok: false,
        status: 429,
        errorCode: "RATE_LIMITED",
        retryAfterSeconds: 15,
        error: "The AI provider reported a rate limit (429). Your message is preserved — wait a moment and retry.",
      };
    }
    if (status === 401 || status === 403) {
      return {
        ok: false,
        status: 503,
        errorCode: "PROVIDER_UNCONFIGURED",
        error:
          "Live AI provider credentials are missing or unauthorized on this server. Configure GEMINI_API_KEY / OPENAI_API_KEY on the server, or use the Guided Socratic Coach (Local Dataset — Not Live AI).",
      };
    }
    return {
      ok: false,
      status: 502,
      errorCode: "UPSTREAM_ERROR",
      error: "The AI provider could not complete the request right now. Your message is preserved so you can retry.",
    };
  }
}

/**
 * Node HTTP `(req, res)` middleware for Vite `configureServer` and `server/tutorServer.mjs`.
 */
export async function handleTutorNodeRequest(req, res, options = {}) {
  const url = new URL(req.url || "/", "http://localhost");
  const env = options.env || {};

  if (req.method === "GET" && url.pathname.endsWith("/status")) {
    const cfg = resolveProviderConfig(env, req.headers || {}, options.llmInvoker);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        configured: cfg.configured,
        provider: cfg.provider,
        model: cfg.model,
        reason: cfg.reason || null,
      })
    );
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, errorCode: "METHOD_NOT_ALLOWED", error: "Use POST /api/tutor" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  let body = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, errorCode: "INVALID_JSON", error: "Request body must be valid JSON." }));
    return;
  }

  const controller = new AbortController();
  req.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });

  const clientKey = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "local";
  const result = await runTutorTurn(body, {
    env,
    requestHeaders: req.headers || {},
    clientKey,
    signal: controller.signal,
    llmInvoker: options.llmInvoker,
  });

  res.statusCode = result.ok ? 200 : result.status || 500;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(result));
}