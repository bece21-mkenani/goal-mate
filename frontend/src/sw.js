import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing' 
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// This is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// --- Caching for Google Fonts (from our old config) ---
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// --- NEW: Push Notification Event Listener ---
self.addEventListener('push', (event) => {
  const data = event.data.json(); // Our payload: { title, body, data }

  const title = data.title || "StudyBuddy";
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Icon for the notification
    badge: '/icon-192x192.png',
    data: {
      urlToOpen: data.data.urlToOpen || '/', // URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// --- NEW: Notification Click Handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.urlToOpen || '/';
  
  // Open the app/URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if the app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});