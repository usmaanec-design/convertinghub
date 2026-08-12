/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJson from './package.json';
import { execSync } from 'node:child_process';

let commitHash = 'development';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // fallback if git is not available or not a git repo
}

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  server: {
    proxy: {
      '/api/libreoffice': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/*.test.{ts,tsx}']
  },
  worker: { format: 'es' }
});
