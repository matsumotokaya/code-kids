import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const yearInSeconds = 60 * 60 * 24 * 365;

// Every Vite project defaults to 5173, so they all collide on one machine.
// This app pins its own port and uses strictPort so a conflict fails loudly
// instead of silently drifting to 5174, 6173 and so on.
const DEV_PORT = 4649;
const PREVIEW_PORT = 4650;

export default defineConfig({
  server: { host: true, port: DEV_PORT, strictPort: true },
  preview: { host: true, port: PREVIEW_PORT, strictPort: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'コードキッズ',
        short_name: 'コードキッズ',
        description: 'カードをならべてロボットをうごかす、こどものためのプログラミングあそび',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#bde9ff',
        theme_color: '#bde9ff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: yearInSeconds },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 80, maxAgeSeconds: yearInSeconds },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
