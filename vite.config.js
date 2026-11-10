import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { validateAndResolveFirebaseConfig } from './lib/firebaseEnv';

export default defineConfig(({ mode }) => {
  // Load mode-specific environment variables at build-time
  const env = loadEnv(mode, process.cwd(), '');

  // Perform fail-closed validation for staging and production builds
  if (mode === 'staging' || mode === 'production') {
    validateAndResolveFirebaseConfig(env, mode);
  }

  return {
    plugins: [
      react(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      hmr: false,
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || env.GOOGLE_MAPS_PLATFORM_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});