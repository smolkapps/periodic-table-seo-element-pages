/**
 * Standalone Exportable Production Server for Elementa (`server/tutorServer.mjs`).
 *
 * Usage after exporting from Base44:
 *   npm run build
 *   GEMINI_API_KEY="your-key" TUTOR_MODEL="gemini-2.5-pro" node server/tutorServer.mjs
 *
 * Serves:
 *   - POST /api/tutor         (Server-side AI provider adapter; keys never leave the server)
 *   - GET  /api/tutor/status  (Provider readiness status without exposing secrets)
 *   - GET  /*                 (Static SPA assets from ./dist)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleTutorNodeRequest } from "./tutorAdapter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function readServerProviderEnv() {
  return {
    TUTOR_PROVIDER: process.env.TUTOR_PROVIDER,
    TUTOR_MODEL: process.env.TUTOR_MODEL,
    TUTOR_API_URL: process.env.TUTOR_API_URL,
    TUTOR_API_KEY: process.env.TUTOR_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    PORT: process.env.PORT,
  };
}

export function createElementaServer(customOptions = {}) {
  const env = customOptions.env || readServerProviderEnv();

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");

    if (url.pathname === "/api/tutor" || url.pathname === "/api/tutor/status") {
      await handleTutorNodeRequest(req, res, { env, llmInvoker: customOptions.llmInvoker });
      return;
    }

    // Serve static build from ./dist if present
    const safeSubpath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
    let candidate = path.join(DIST_DIR, safeSubpath);

    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      candidate = path.join(candidate, "index.html");
    }

    if (!fs.existsSync(candidate) || !candidate.startsWith(DIST_DIR)) {
      candidate = path.join(DIST_DIR, "index.html");
    }

    if (!fs.existsSync(candidate)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Static build not found. Run `npm run build` first.");
      return;
    }

    const ext = path.extname(candidate).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    fs.createReadStream(candidate).pipe(res);
  });
}

// Start listener when invoked directly (`node server/tutorServer.mjs`)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4173;
  const server = createElementaServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Elementa server listening on http://localhost:${port}`);
  });
}