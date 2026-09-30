import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker safely with error handler to prevent unhandled rejection in iframes
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        console.log('PWA Service Worker registered:', swUrl, registration?.scope);
      },
      onRegisterError(error) {
        console.warn('PWA Service Worker registration not available in this context:', error);
      },
    });
  } catch (err) {
    console.warn('Service worker setup notice:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
