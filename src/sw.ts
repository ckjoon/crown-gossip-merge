/// <reference lib="webworker" />
// sw.ts — 서비스 워커: 빌드 결과물을 미리 캐시해 오프라인에서도 실행 (3D 모델은 처음 볼 때 캐시). v2 시절 캐시만 지우고 세이브(IndexedDB·localStorage)는 건드리지 않는다

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
// 쿼리(?e2e, 공유 링크 등)가 붙은 주소도 미리 캐시한 페이지로 응답 (오프라인 실행)
precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/.*/] });

// public/models 파일을 같은 경로로 바꾸면 이 이름을 올린다 (예전 모델 캐시는 activate 때 삭제)
const MODEL_CACHE = "crown-gossip-models-v1";

// 3D 모델(약 10MB)은 설치 때 한꺼번에 받지 않고, 처음 본 구역부터 캐시해 두었다가 오프라인에서도 쓴다
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/models/"),
  new CacheFirst({ cacheName: MODEL_CACHE, plugins: [new ExpirationPlugin({ maxEntries: 400 })] }),
);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("crown-gossip-pwa-v") || (k.startsWith("crown-gossip-models-v") && k !== MODEL_CACHE)).map((k) => caches.delete(k))))
  );
});

// v3.13 번개 가득 알림: 서버(QStash 예약)가 보낸 푸시를 폰 알림으로. 누르면 열린 게임 창으로, 없으면 새로 연다
self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; tag?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    // 형식이 다르면 기본 문구
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "⚡ 번개가 가득 찼어요!", {
      body: data.body ?? "성으로 돌아와 재료를 만들어 볼까요?",
      tag: data.tag ?? "energy-full",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const win = list.find((c) => new URL(c.url).origin === self.location.origin);
      return win ? win.focus() : self.clients.openWindow("/");
    }),
  );
});
