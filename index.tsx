import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Performance boot marker for diagnosing initialization milestones
if (typeof window !== 'undefined') {
  (window as any).__PITCHLY_BOOT_TIME__ = performance.now();
  console.log('[Pitchly Boot] 🚀 [1/3] Script execution started in index.tsx at', new Date().toISOString());
}

// Handle direct /install visits when using HashRouter
if (typeof window !== 'undefined' && window.location.pathname === '/install' && !window.location.hash) {
  window.location.replace(`${window.location.origin}/#/install`);
}

// Register PWA Service Worker in production only; in development unregister and clear caches
if (typeof window !== 'undefined') {
  if (import.meta.env.PROD) {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service worker registered successfully with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service worker registration notice:', err);
          });
      });
    }
  } else {
    // Development mode: unregister any active service worker and clear cache storage
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((ok) => {
            if (ok) console.log('[PWA Dev] Unregistered service worker:', registration.scope);
          });
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key).then(() => {
            console.log('[PWA Dev] Cleared cache bucket:', key);
          });
        }
      });
    }
  }
}

// Mount React immediately
console.log('[Pitchly Boot] 🎯 [2/3] Locating root DOM container element (#root)...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Pitchly Boot] ❌ Fatal: Could not find #root element in document DOM');
  throw new Error("Could not find root element to mount to");
}

console.log('[Pitchly Boot] ⚛️ [3/3] Creating React 18 root and initiating <App /> render...');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
