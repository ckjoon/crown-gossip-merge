/// <reference lib="webworker" />
// sw.ts — 서비스 워커: 빌드 결과물 전체를 미리 캐시해 오프라인에서도 실행. v2 시절 캐시만 지우고 세이브(IndexedDB·localStorage)는 건드리지 않는다

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
// 쿼리(?e2e, 공유 링크 등)가 붙은 주소도 미리 캐시한 페이지로 응답 (오프라인 실행)
precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/.*/] });

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("crown-gossip-pwa-v")).map((k) => caches.delete(k))))
  );
});
