import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function elementaTutorServerPlugin() {
  const attachMiddleware = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url ? req.url.split('?')[0] : '';
      if (pathname === '/api/tutor' || pathname === '/api/tutor/status') {
        const { handleTutorNodeRequest } = await import('./server/tutorAdapter.mjs');
        const env = {
          TUTOR_PROVIDER: process.env.TUTOR_PROVIDER,
          TUTOR_MODEL: process.env.TUTOR_MODEL,
          TUTOR_API_URL: process.env.TUTOR_API_URL,
          TUTOR_API_KEY: process.env.TUTOR_API_KEY,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          BASE44_APP_ID: process.env.BASE44_APP_ID,
          VITE_BASE44_APP_ID: process.env.VITE_BASE44_APP_ID,
          VITE_BASE44_APP_BASE_URL: process.env.VITE_BASE44_APP_BASE_URL,
        };
        await handleTutorNodeRequest(req, res, { env });
        return;
      }
      next();
    });
  };

  return {
    name: 'elementa-tutor-server-adapter',
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  };
}

// https://vite.dev/config/
// VITE_PACKAGED=true builds relative asset URLs for file-backed targets
// (iOS/Android shells, browser extension). Web/PWA builds keep absolute paths.
export default defineConfig(({ command }) => ({
  base:
    process.env.VITE_BASE_URL ||
    (command === 'build' || process.env.VITE_PACKAGED === 'true' || process.env.VITE_STANDALONE === 'true'
      ? './'
      : '/'),
  plugins: [
    elementaTutorServerPlugin(),
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: false,
      visualEditAgent: true
    }),
    react(),
  ]
}));