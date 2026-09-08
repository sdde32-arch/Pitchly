import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { autoSeedIfEmpty } from './utils/seedTurfs';
import { autoSeedAdmin } from './utils/seedAdmin';
import { registerSW } from 'virtual:pwa-register';

autoSeedIfEmpty().catch(console.warn);
autoSeedAdmin().catch(console.warn);

// Register service worker with auto update support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New content available, service worker ready to update.');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline with service worker caching.');
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration error:', error);
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);