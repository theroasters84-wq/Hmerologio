const CACHE_NAME = 'fasting-calendar-v7'; // Ενημερωμένη έκδοση cache για το νέο όνομα της εφαρμογής
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './pathmata/interactions.js',
    './dedomena/calendar_data.json'
];

// Εγκατάσταση του Service Worker και Caching
self.addEventListener('install', event => {
    self.skipWaiting(); // Αναγκάζουμε το νέο service worker να ενεργοποιηθεί αμέσως
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Η Cache άνοιξε με επιτυχία');
                // Χρησιμοποιούμε μεμονωμένα cache.add για να μην σκάει όλη η διαδικασία αν λείπει 1 αρχείο
                return Promise.allSettled(
                    urlsToCache.map(url => cache.add(url)
                        .catch(err => console.error(`Αποτυχία caching για το ${url}:`, err)))
                );
            })
    );
});

// Intercept των Network Requests για offline υποστήριξη
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Διαγραφή παλιών caches κατά το Activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Αναλαμβάνει τον έλεγχο της σελίδας αμέσως
    );
});