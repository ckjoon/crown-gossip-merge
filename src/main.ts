// main.ts — 조립: 세이브 불러오기(마이그레이션) → store → 자동 저장 → UI·보드·성 마운트 → 타이머

import "./views/ui/styles/legacy.css";
import "./views/ui/styles/v3.css";
import { mount } from "svelte";
import App from "./views/ui/App.svelte";
import { createCtx } from "./core/ctx";
import { createStore } from "./core/store";
import { tickEnergy } from "./core/actions/progress";
import { SoundEngine } from "./services/audio";
import { createRepository } from "./services/save/repository";
import { restoreState, hasReportContent } from "./services/save/restore";
import { createAutosave } from "./services/save/autosave";
import { setApp } from "./views/ui/context";
import { ui } from "./views/ui/ui.svelte";
import { attachFeedback } from "./views/ui/feedback";
import { preloadTextures } from "./views/art/textures";
import { FxLayer } from "./views/fx/FxLayer";
import { attachJuice } from "./views/fx/juice";
import { getMainBoard } from "./views/board/registry";
import { captureInstallPrompt } from "./views/ui/install";

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function boot(): Promise<void> {
  captureInstallPrompt();
  const ctx = createCtx();
  const repo = createRepository(typeof indexedDB !== "undefined" ? indexedDB : null, safeLocalStorage());
  const record = await repo.load();
  const { state, report, isNew } = restoreState(record, Date.now(), ctx);
  const store = createStore(state, ctx);
  const sfx = new SoundEngine();
  sfx.enabled = state.settings.sound;
  const autosave = createAutosave(store, repo, { debounceMs: 300, now: () => Date.now() });
  setApp({ store, sfx, repo, autosave, migrationReport: hasReportContent(report) ? report : null });
  if (isNew || report) void autosave.flush();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void autosave.flush();
  });
  window.addEventListener("pagehide", () => void autosave.flush());
  store.subscribe((s) => (sfx.enabled = s.settings.sound));
  attachFeedback(store, sfx);

  setInterval(() => {
    store.dispatch(tickEnergy, { seconds: 1 }, { transient: true });
    ui.clock = Date.now();
  }, 1000);

  if (import.meta.env.DEV || location.search.includes("e2e")) {
    Object.assign(window as object, { __game: store, __board: () => getMainBoard() });
  }

  await preloadTextures();
  mount(App, { target: document.getElementById("app")! });
  const fx = new FxLayer();
  await fx.init();
  attachJuice(store, fx, sfx);
}

void boot();
