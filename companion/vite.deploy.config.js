import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Our static deployment needs neither the editor's injection nor its proxy.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  define: { 'import.meta.env.VITE_PACKAGED': JSON.stringify('true') },
});
