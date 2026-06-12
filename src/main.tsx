/// <reference types="vite-plugin-pwa/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      for (const name of names) caches.delete(name);
    });
  }
  
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered and cache cleared');
    }
  });
}
console.log('App version: 2.0.3-AggressiveCacheFix');
// registerSW({ immediate: true }); // Disabled permanently

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
