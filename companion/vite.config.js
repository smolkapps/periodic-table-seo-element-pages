import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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