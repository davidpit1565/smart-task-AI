import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Smart Tasks AI',
        short_name: 'SmartTasks',
        description: 'AI-assisted smart task management and productivity app',
        theme_color: '#0A0E14',
        background_color: '#0A0E14',
        display: 'standalone',
        start_url: '/',
        icons: [
          // PNG first and listed for every size — this is what gets picked for
          // Android/Chrome "Add to Home Screen" and is universally supported.
          // The SVG entries are additional, for browsers that prefer a crisp
          // vector icon over raster; both point at the same artwork.
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
        // Long-press the installed icon for these — real, works today, no native shell needed.
        shortcuts: [
          { name: 'Today', url: '/?screen=today', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Inbox', url: '/?screen=inbox', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
        // Registers the app as an OS share target (Android/ChromeOS today; iOS Safari doesn't
        // support share_target yet). Sharing a link/text to the installed app creates a task from
        // it — see core/deepLink.ts for the parsing contract this pairs with.
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
