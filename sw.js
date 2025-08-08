
const CACHE_NAME = 'km-northern-elite-v1';
const FILES_TO_CACHE = [
  '/km_northern_elite.html',
  '/manifest.json'
];
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keyList => Promise.all(keyList.map(key => {
      if(key !== CACHE_NAME) return caches.delete(key);
    })))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (evt) => {
  evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request)));
});
