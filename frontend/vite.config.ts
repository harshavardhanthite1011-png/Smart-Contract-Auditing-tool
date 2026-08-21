import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        '.',
        '../contracts/managed/ContractAuditor'
      ]
    }
  },
  resolve: {
    alias: {
      '@contract': path.resolve(__dirname, '../contracts/managed/ContractAuditor/contract')
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext'
  }
});
