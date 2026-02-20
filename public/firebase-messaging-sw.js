/* eslint-env serviceworker */
/* global firebase */

// === PWA Cache Management (network-first) ===
const CACHE_VERSION = 'savorcue-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Skip firebase/google API calls from caching
  if (request.url.includes('googleapis.com') || request.url.includes('gstatic.com')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// === Firebase Cloud Messaging ===
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDwWpe7nZClO7F98uGScNYi0OS-gnY2O9c",
  authDomain: "savorcue.firebaseapp.com",
  projectId: "savorcue",
  storageBucket: "savorcue.firebasestorage.app",
  messagingSenderId: "607906099746",
  appId: "1:607906099746:web:e367d284149cd8038b107b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'SavorCue';
  const body = payload.notification?.body || 'How full are you right now?';

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    tag: 'savorcue-prompt',
    renotify: true,
    requireInteraction: true,
  });
});
