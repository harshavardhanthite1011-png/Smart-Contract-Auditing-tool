import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      allow: [
        '.',
        '../contracts/managed/PrivateVoting'
      ]
    }
  },
  resolve: {
    alias: {
      '@contract': path.resolve(import.meta.dirname, '../contracts/managed/PrivateVoting/contract')
    }
  },
  optimizeDeps: {
    rolldownOptions: {
      // no options needed, just replacing esbuildOptions
    }
  },
  build: {
    target: 'esnext'
  }
});
