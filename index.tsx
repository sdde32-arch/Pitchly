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

// Register PWA Service Worker for app shell caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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

// Run background tasks safely after mount
setTimeout(() => {
  import('./utils/seedTurfs')
    .then(({ autoSeedIfEmpty }) => {
      console.log('[Pitchly Boot] 🌱 Running autoSeedIfEmpty check...');
      return autoSeedIfEmpty();
    })
    .catch((err) => console.warn('Turf seeding notice:', err));

  import('./utils/seedAdmin')
    .then(({ autoSeedAdmin }) => {
      console.log('[Pitchly Boot] 👤 Running autoSeedAdmin check...');
      return autoSeedAdmin();
    })
    .catch((err) => console.warn('Admin seeding notice:', err));
}, 1000);
