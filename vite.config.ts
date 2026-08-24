/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJson from './package.json';
import { execSync } from 'node:child_process';

import { VitePWA } from 'vite-plugin-pwa';

let commitHash = 'development';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // fallback if git is not available or not a git repo
}

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    },
    proxy: {
      '/api/libreoffice': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: [
          '**/sitemap.xml',
          '**/robots.txt',
          '**/google*.html'
        ],
        navigateFallbackDenylist: [
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
          /^\/google.*\.html$/
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/convertinghub-backend\.onrender\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    sourcemap: false,
    minify: 'esbuild'
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
