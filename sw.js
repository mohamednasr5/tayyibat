/* ══════════════════════════════════════════════════════════
   Service Worker — طيبات PWA
   يدعم: Android/Chrome + iOS/Safari + Samsung + Desktop
══════════════════════════════════════════════════════════ */
const CACHE_NAME = 'tayyibat-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-180.png'
];

/* ── التثبيت: تخزين الملفات الأساسية في الكاش ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

/* ── التفعيل: حذف الكاش القديم ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── قواعد الجلب ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* 1. طلبات Firebase — دائماً من الشبكة */
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('googleapis')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  /* 2. طلبات AI API — دائماً من الشبكة بلا كاش */
  if (url.hostname.includes('pollinations') ||
      url.hostname.includes('openrouter') ||
      url.hostname.includes('openai') ||
      url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  /* 3. الخطوط والمكتبات الخارجية — شبكة أولاً ثم كاش */
  if (url.hostname.includes('fonts.') ||
      url.hostname.includes('cdnjs') ||
      url.hostname.includes('gstatic')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* 4. باقي الطلبات (HTML, CSS, JS, Icons) — كاش أولاً ثم شبكة */
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

/* ── Push Notifications (للمستقبل) ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'طيبات', {
      body: data.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-96.png',
      dir: 'rtl',
      lang: 'ar'
    })
  );
});
