import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing' 
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

precacheAndRoute(self.__WB_MANIFEST || []);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, 
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
        maxAgeSeconds: 60 * 60 * 24 * 365, 
      }),
    ],
  })
);

/*=== PUSH NOTIFICATIONS ===*/
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const title = data.title || "StudyBuddy";
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', 
    badge: '/icon-192x192.png',
    data: {
      urlToOpen: data.data.urlToOpen || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/*=== NOTIFICATION CLICK HANDLER ===*/
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); 

  const urlToOpen = event.notification.data.urlToOpen || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});