import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Auto-recover from chunk loading errors on redeployments (e.g. Vercel)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message &&
      (event.message.includes('Loading chunk') ||
        event.message.includes('Failed to fetch dynamically imported module') ||
        event.message.includes('Unable to preload CSS'))
    ) {
      console.warn('Deployment asset mismatch detected, reloading to fetch latest assets...');
      window.location.reload();
    }
  });
}

// Safe Service Worker Registration handling for PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // In development / AI Studio preview iframe, stale SW can cause white screens.
  // Clean up any stale service workers in development mode:
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  } else {
    // Only register active SW in production build
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegisteredSW(swUrl, registration) {
            console.log('PWA Service Worker active:', swUrl, registration?.scope);
          },
          onRegisterError(error) {
            console.warn('PWA Service Worker notice:', error);
          },
        });
      })
      .catch((err) => {
        console.warn('PWA module load notice:', err);
      });
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
