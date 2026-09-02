import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { autoSeedIfEmpty } from './utils/seedTurfs';
import { autoSeedAdmin } from './utils/seedAdmin';

autoSeedIfEmpty().catch(console.warn);
autoSeedAdmin().catch(console.warn);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[PWA] Service Worker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  });
}

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