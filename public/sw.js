// Service worker mínimo: solo existencia + registro ya hace la web
// instalable. La caché es "network-first" con fallback a caché dinámica,
// para no tener que listar a mano los nombres con hash que genera Vite en
// cada build (cambian en cada despliegue).
const CACHE_NAME = 'color-game-v1';
const APP_SHELL = ['/', '/manifest.json', '/favicon.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('/') : undefined))
      )
  );
});

// Recordatorio del Desafío Diario: la app (visible o en segundo plano vía
// Periodic Background Sync, donde el navegador lo soporte) decide si toca
// avisar y llama a self.registration.showNotification directamente; este
// listener solo cubre el evento de clic para enfocar/abrir la app.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const existing = clientsArr.find(c => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-streak-check') {
    event.waitUntil(checkStreakAndNotify());
  }
});

async function checkStreakAndNotify() {
  try {
    const clientsArr = await self.clients.matchAll({ type: 'window' });
    if (clientsArr.length > 0) return; // ya está abierta, no hace falta avisar

    // El SW no tiene acceso directo a localStorage; se apoya en IndexedDB
    // simple que main.js sincroniza (ver syncDailyFlagForSW en main.js).
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('colorGameSW', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('flags');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const lastPlayedDate = await new Promise((resolve, reject) => {
      const tx = db.transaction('flags', 'readonly');
      const req = tx.objectStore('flags').get('lastPlayedDailyDate');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (lastPlayedDate === todayStr) return;

    await self.registration.showNotification('🔥 No pierdas tu racha', {
      body: 'Tu Desafío Diario de Color Game te espera.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'daily-streak',
    });
  } catch (_) {
    // Sin soporte de IndexedDB/notificaciones: no hacer nada, la app
    // funciona igual sin el recordatorio.
  }
}
