import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline access
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any active service workers in development to avoid stale caching & preamble issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Successfully unregistered stale service worker in development');
          }
        });
      }
    });
    // Clear caches to prevent stale cache hits during dev
    if (window.caches) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully with scope: ', registration.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed: ', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
