import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          name: 'Pitchly',
          short_name: 'Pitchly',
          description: 'Book and manage football pitches in Uganda',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#0D0D0D',
          theme_color: '#0D0D0D',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml' }
          ]
        }
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});