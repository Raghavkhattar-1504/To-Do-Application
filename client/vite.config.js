import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Loaded with loadEnv (rather than a bare `process.env` read) so that
// API_PROXY_TARGET can come from client/.env, client/.env.local, or a real
// shell environment variable. Vite does not populate process.env from .env
// files for the config file on its own, only loadEnv does.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': env.API_PROXY_TARGET || 'http://localhost:5000',
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
    },
  };
});
