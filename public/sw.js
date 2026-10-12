// Service worker cleanup - safe unregister without reload loop
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().catch(() => {})
  );
});
