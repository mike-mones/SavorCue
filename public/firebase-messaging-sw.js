/* eslint-env serviceworker */
/* global firebase */
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
