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

// 3D 모델(약 10MB)은 설치 때 한꺼번에 받지 않고, 처음 본 구역부터 캐시해 두었다가 오프라인에서도 쓴다
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/models/"),
  new CacheFirst({ cacheName: "crown-gossip-models-v1", plugins: [new ExpirationPlugin({ maxEntries: 400 })] }),
);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("crown-gossip-pwa-v")).map((k) => caches.delete(k))))
  );
});
