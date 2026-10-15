// Service Worker pour PillFlow - Notifications Web Push

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Écoute des événements Push reçus du serveur
self.addEventListener('push', (event) => {
  let data = {
    title: '💊 PillFlow - Rappel de pilule',
    body: "C'est l'heure de prendre votre pilule !",
    tag: 'pill-reminder',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.svg',
    badge: data.badge || '/icons/icon-192.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'pill-reminder',
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/' },
    actions: data.actions || [
      {
        action: 'take_pill',
        title: "💊 J'ai pris ma pilule",
      },
      {
        action: 'open_app',
        title: "Ouvrir l'application",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic sur la notification ou sur une action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  if (action === 'take_pill') {
    event.waitUntil(
      fetch('/api/pills/quick-take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'push_action',
          timestamp: new Date().toISOString(),
        }),
      })
        .then(() => {
          return self.registration.showNotification('✅ Pilule validée !', {
            body: 'Votre prise a été enregistrée avec succès. Bonne journée ! 🌸',
            icon: '/icons/icon-192.svg',
            tag: 'pill-confirmed',
            silent: true,
          });
        })
        .catch(() => {
          // En cas d'erreur réseau, ouvrir l'application
          return self.clients.openWindow(targetUrl);
        })
    );
  } else {
    // Ouvrir ou focaliser l'onglet existant de l'application
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});
