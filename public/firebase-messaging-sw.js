const CACHE_NAME = "primitive-programming-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const appClient = clientList.find((client) => new URL(client.url).origin === self.location.origin);
      if (appClient) {
        appClient.focus();
        appClient.postMessage({ type: "NOTIFICATION_CLICK", url: targetUrl, action: event.action || "open" });
        return;
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && new URL(request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});

self.importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js");
self.importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCS0_Ac002l9NG94xJu506zwxjkfc3z4Gk",
  authDomain: "flexx-management-dashboard.firebaseapp.com",
  projectId: "flexx-management-dashboard",
  storageBucket: "flexx-management-dashboard.firebasestorage.app",
  messagingSenderId: "349175019777",
  appId: "1:349175019777:web:c7846f93db93be9aaa4300",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Primitive Programming";
  const url = data.url || payload.fcmOptions?.link || "/";

  self.registration.showNotification(title, {
    body: notification.body || data.body || "You have a new training update.",
    icon: notification.icon || "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "primitive-programming",
    data: { url },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });
});
