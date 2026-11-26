import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data': path.resolve(monorepoRoot, 'packages/data'),
    },
  },
  server: {
    fs: {
      allow: [monorepoRoot],
    },
  },
});
