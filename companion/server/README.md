# Elementa Server-Side Chemistry Tutor Adapter

In the Base44 app and preview on this branch, Elementa uses Base44's built-in `InvokeLLM` integration (`src/lib/tutorClient.js`) as the working default so Live AI replies work out of the box using existing Base44 integration credits.

For future self-hosted or exported deployments outside Base44, Elementa also includes a portable server-side adapter (`server/tutorAdapter.mjs` and `server/tutorServer.mjs`).

## Ownership & Privacy Guarantees

1. **No Frontend API Keys**: Provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `TUTOR_API_KEY`) are read only on the Node server and are never bundled into `dist/` or exposed to the browser.
2. **No Cloud Database Required**: Study progress (`elementa_*_v3`) and saved tutor sessions (`elementa_tutor_sessions_v1`) live in the learner's browser `localStorage` with JSON export/import.
3. **No Fake AI Responses**:
   - **Live AI Provider (`/api/tutor`)** calls the configured server-side LLM and badges every response with the actual provider and model (`Live AI (gemini · gemini-2.5-pro)`). If no provider is configured, or if the user is offline or rate-limited, the server returns an honest `503 PROVIDER_UNCONFIGURED` / `429 RATE_LIMITED` error and preserves the learner's typed message.
   - **Guided Socratic Coach (`src/lib/tutorEngine.js`)** runs locally using deterministic rules over the 118-element dataset and is explicitly badged **`Guided Socratic Coach (Local Dataset — Not Live AI)`**.
4. **Canonical Citation Whitelist**: `sanitizeTutorResponse` filters all model-returned citation URLs against the verified dataset links (`IUPAC CIAAW`, `NIST ASD`, `PubChem`, `Royal Society of Chemistry`) for the active elements, preventing hallucinated links.

## Running Independently After Exporting from Base44

### 1. Local Development (`npm run dev`)
Vite's dev server automatically mounts `server/tutorAdapter.mjs` at `POST /api/tutor` and `GET /api/tutor/status`.

```bash
cp .env.example .env
# Add GEMINI_API_KEY=... (or OPENAI_API_KEY / ANTHROPIC_API_KEY) to .env
npm install
npm run dev
```

### 2. Standalone Production Server (`npm run start:server`)
Build the static client once, then run the dependency-free Node HTTP server (`server/tutorServer.mjs`), which serves both `dist/` and `/api/tutor`:

```bash
npm run build
GEMINI_API_KEY="your-gemini-key" TUTOR_MODEL="gemini-2.5-pro" npm run start:server
```

### 3. Using an OpenAI-Compatible Endpoint (Ollama, vLLM, OpenRouter)
```bash
TUTOR_PROVIDER="openai_compatible" \
TUTOR_API_URL="http://localhost:11434/v1" \
TUTOR_API_KEY="ollama" \
TUTOR_MODEL="qwen2.5:14b" \
npm run start:server
`