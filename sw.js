// sw.js — PWA Service Worker (Network-First + Cache Fallback)
// 새 버전이 배포되면 즉시 최신 코드를 받아오되, 오프라인 상태에서는 캐시로 동작하며 IndexedDB/LocalStorage 세이브 데이터는 절대 건드리지 않습니다.

const CACHE_NAME = "crown-gossip-pwa-v4";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/db.js",
  "/sprites.js",
  "/interior3d.js",
  "/game.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/vendor/three.min.js",
  "/vendor/gsap.min.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-First 전략: 온라인이면 항상 최신 업데이트 반영, 오프라인이면 캐시 반환
  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && networkRes.type === "basic") {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(event.request))
  );
});
