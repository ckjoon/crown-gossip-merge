// pwa.ts — 서비스 워커 등록. 새 버전이 활성화되면(이전 버전이 있던 경우만) 모달·연출이 없는 순간에 새로고침한다

import { ui } from "./ui.svelte";

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (!hadController) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const tryReload = () => {
      if (reloading) return;
      if (ui.modal === null && !ui.inputLocked && !ui.cutscene && !ui.stylePick) {
        reloading = true;
        location.reload();
      } else {
        setTimeout(tryReload, 1500);
      }
    };
    tryReload();
  });
}
