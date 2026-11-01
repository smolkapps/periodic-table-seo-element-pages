/**
 * Chemistry Tutor Live AI Client (`src/lib/tutorClient.js`).
 *
 * Working Default on Branch (`chemistry-tutor-journey`):
 * - Uses Base44's built-in `base44.integrations.Core.InvokeLLM` integration (consuming the
 *   workspace's existing Base44 integration credits with `model: "automatic"` at 1 credit/call)
 *   so the live AI tutor works immediately in preview without requiring external API keys.
 *
 * Portable Server Adapter Option (`server/tutorAdapter.mjs`):
 * - If `VITE_TUTOR_API_URL` is set (or when self-hosting with `npm run start:server` and
 *   `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`), routes requests to `/api/tutor`.
 * - Never bundles external provider API keys in frontend code.
 * - Handles offline detection, request cancellation (`AbortController`), rate limits (`429`),
 *   and provider-unconfigured (`503`) states honestly while preserving the learner's draft.
 */
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import {
  MAX_MESSAGE_CHARS,
  getElementBySlug,
  resolveComparisonSlugs,
  detectReferencedElement,
  checkChemistrySafety,
  getAllowedCitations,
  buildModelCaveat,
  buildTutorPrompt,
  TUTOR_RESPONSE_JSON_SCHEMA,
  sanitizeTutorResponse,
} from "@/lib/tutorEngine";

const metaEnv = /** @type {any} */ (import.meta).env || {};
const CUSTOM_TUTOR_ENDPOINT = metaEnv.VITE_TUTOR_API_URL || "";

const CLIENT_RATE_WINDOW_MS = 60_000;
const CLIENT_MAX_REQUESTS_PER_MINUTE = 15;
let clientRequestTimestamps = [];

function checkClientRateLimit(now = Date.now()) {
  clientRequestTimestamps = clientRequestTimestamps.filter((ts) => now - ts < CLIENT_RATE_WINDOW_MS);
  if (clientRequestTimestamps.length >= CLIENT_MAX_REQUESTS_PER_MINUTE) {
    const oldest = clientRequestTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((CLIENT_RATE_WINDOW_MS - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  clientRequestTimestamps.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
}

function buildHeaders(extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (appParams?.token) {
    headers["Authorization"] = `Bearer ${appParams.token}`;
  }
  if (appParams?.appId) {
    headers["X-Base44-App-Id"] = String(appParams.appId);
  }
  return headers;
}

function isBase44InvokeAvailable() {
  return Boolean(base44?.integrations?.Core?.InvokeLLM);
}

export async function fetchTutorProviderStatus(signal) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      ok: false,
      configured: false,
      provider: "offline",
      model: null,
      reason: "Browser is currently offline.",
    };
  }

  // If a custom external portable adapter URL is configured, check it first
  if (CUSTOM_TUTOR_ENDPOINT) {
    try {
      const res = await fetch(`${CUSTOM_TUTOR_ENDPOINT}/status`, {
        method: "GET",
        headers: buildHeaders(),
        signal,
      });
      const contentType = res.headers?.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const st = await res.json();
        if (st?.configured) return st;
      }
    } catch {
      // Fall through to built-in Base44 InvokeLLM check
    }
  }

  if (isBase44InvokeAvailable()) {
    return {
      ok: true,
      configured: true,
      provider: "Base44 InvokeLLM",
      model: "automatic",
      reason: null,
    };
  }

  return {
    ok: false,
    configured: false,
    provider: "unconfigured",
    model: null,
    reason: "No live AI provider is configured.",
  };
}

/**
 * @param {Record<string, any>} payload
 * @param {{ signal?: AbortSignal | null, simulateError?: string | null, customInvoker?: Function | null }} [options]
 */
export async function sendTutorMessageToServer(
  payload,
  { signal = null, simulateError = null, customInvoker = null } = {}
) {
  if (simulateError === "offline" || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return {
      ok: false,
      status: 0,
      errorCode: "OFFLINE",
      error:
        "You appear to be offline (no network connection). Your typed question is preserved below — reconnect and press Retry, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
    };
  }

  if (simulateError === "provider_unconfigured") {
    return {
      ok: false,
      status: 503,
      errorCode: "PROVIDER_UNCONFIGURED",
      error:
        "Live AI provider is currently unconfigured (simulated 503 state). Your typed question is preserved below — switch back to Normal Connection to use Base44 InvokeLLM, or use the Guided Socratic Coach (Local Dataset — Not Live AI).",
    };
  }

  if (simulateError === "rate_limited") {
    return {
      ok: false,
      status: 429,
      errorCode: "RATE_LIMITED",
      retryAfterSeconds: 15,
      error:
        "Rate limit reached for Live AI Tutor requests (HTTP 429). Your typed question is preserved — wait 15 seconds and retry, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
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

  const rate = checkClientRateLimit();
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      errorCode: "RATE_LIMITED",
      retryAfterSeconds: rate.retryAfterSeconds,
      error: `Too many requests in a short window. Please wait ${rate.retryAfterSeconds}s and press Retry, or switch to the Guided Socratic Coach.`,
    };
  }

  const primaryElement = getElementBySlug(payload?.elementSlug || "oxygen") || getElementBySlug("oxygen");
  const referencedElement = detectReferencedElement(message, primaryElement) || primaryElement;
  const compareElements =
    Array.isArray(payload?.compareSlugs) && payload.compareSlugs.length >= 2
      ? resolveComparisonSlugs(payload.compareSlugs)
      : [];
  const activeElements = [];
  for (const el of [referencedElement, primaryElement, ...compareElements].filter(Boolean)) {
    if (!activeElements.some((x) => x.slug === el.slug)) activeElements.push(el);
  }

  // Enforce chemistry safety guardrail before invoking any model
  const safety = checkChemistrySafety(message);
  if (!safety.safe) {
    return {
      ok: true,
      mode: "safety_guardrail",
      provider: "safety_filter",
      model: "deterministic",
      sourceBadge: "Chemistry Safety Guardrail",
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

  // Optional portable server endpoint path when VITE_TUTOR_API_URL is explicitly configured
  if (CUSTOM_TUTOR_ENDPOINT) {
    try {
      const res = await fetch(CUSTOM_TUTOR_ENDPOINT, {
        method: "POST",
        headers: buildHeaders(),
        signal,
        body: JSON.stringify(payload),
      });
      const contentType = res.headers?.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
      if (data && typeof data === "object") {
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            status: res.status,
            errorCode: data.errorCode || (res.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR"),
            retryAfterSeconds: data.retryAfterSeconds || null,
            error: data.error || `Tutor server returned HTTP ${res.status}.`,
          };
        }
        return data;
      }
    } catch (err) {
      if (err?.name === "AbortError" || signal?.aborted) {
        return {
          ok: false,
          status: 499,
          errorCode: "CANCELLED",
          error: "Request cancelled. Your typed question is still in the box so you can edit or retry.",
        };
      }
    }
  }

  // Working default in this branch: Base44 built-in InvokeLLM integration
  const invoker =
    typeof customInvoker === "function"
      ? customInvoker
      : isBase44InvokeAvailable()
      ? (invokeParams) => base44.integrations.Core.InvokeLLM(invokeParams)
      : null;

  if (!invoker) {
    return {
      ok: false,
      status: 503,
      errorCode: "PROVIDER_UNCONFIGURED",
      error:
        "No live AI provider is configured. Connect Base44 InvokeLLM or configure GEMINI_API_KEY / OPENAI_API_KEY on the portable server adapter, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
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
    if (signal?.aborted) {
      const abortErr = new Error("Aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }

    const rawResult = await new Promise((resolve, reject) => {
      const onAbort = () => {
        const abortErr = new Error("Aborted");
        abortErr.name = "AbortError";
        reject(abortErr);
      };
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      Promise.resolve(
        invoker({
          prompt,
          response_json_schema: TUTOR_RESPONSE_JSON_SCHEMA,
        })
      )
        .then((res) => {
          if (signal) signal.removeEventListener("abort", onAbort);
          resolve(res);
        })
        .catch((err) => {
          if (signal) signal.removeEventListener("abort", onAbort);
          reject(err);
        });
    });

    const sanitized = sanitizeTutorResponse(rawResult, activeElements);
    return {
      ok: true,
      mode: "live_ai",
      provider: "Base44 InvokeLLM",
      model: "automatic",
      sourceBadge: "Live AI (Base44 InvokeLLM)",
      response: sanitized,
    };
  } catch (err) {
    if (err?.name === "AbortError" || signal?.aborted) {
      return {
        ok: false,
        status: 499,
        errorCode: "CANCELLED",
        error: "Request cancelled. Your typed question is still in the box so you can edit or retry.",
      };
    }
    const status = Number(err?.status || err?.response?.status) || 502;
    if (status === 429) {
      return {
        ok: false,
        status: 429,
        errorCode: "RATE_LIMITED",
        retryAfterSeconds: 15,
        error:
          "Rate limit or credit limit reached for Live AI Tutor requests (429). Your typed question is preserved — wait a moment and retry, or switch to the Guided Socratic Coach (Local Dataset — Not Live AI).",
      };
    }
    return {
      ok: false,
      status,
      errorCode: "UPSTREAM_ERROR",
      error:
        err?.message ||
        "Base44 InvokeLLM could not complete the request right now. Your typed question is preserved so you can retry or use the Guided Socratic Coach.",
    };
  }
}