// main.ts — 조립: 세이브 불러오기(마이그레이션) → store → 자동 저장 → UI·보드·성 마운트 → 타이머

import "./views/ui/styles/legacy.css";
import "./views/ui/styles/v3.css";
import { mount } from "svelte";
import App from "./views/ui/App.svelte";
import { createCtx } from "./core/ctx";
import { createStore } from "./core/store";
import { tickEnergy, markVersionSeen } from "./core/actions/progress";
import { APP_VERSION } from "./core/rules/versionHistory";
import { SoundEngine } from "./services/audio";
import { createRepository } from "./services/save/repository";
import { restoreState, hasReportContent } from "./services/save/restore";
import { createAutosave } from "./services/save/autosave";
import { setApp } from "./views/ui/context";
import { ui, say } from "./views/ui/ui.svelte";
import { getGeneratorTierMeta } from "./core/rules/chains";
import { attachFeedback } from "./views/ui/feedback";
import { preloadTextures } from "./views/art/textures";
import { FxLayer } from "./views/fx/FxLayer";
import { attachJuice } from "./views/fx/juice";
import { getMainBoard } from "./views/board/registry";
import { getCastleView } from "./views/castle/registry";
import { captureInstallPrompt } from "./views/ui/install";
import { attachRewardDirector } from "./views/reward/RewardDirector";
import { registerServiceWorker } from "./views/ui/pwa";

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
  let restored: ReturnType<typeof restoreState>;
  try {
    restored = restoreState(record, Date.now(), ctx);
  } catch (err) {
    // 복원 중 예외가 나도 빈 화면이 되지 않게 새 게임으로 시작하되, 원래 기록은 따로 보관한다
    console.error("세이브 복원 실패, 새 게임으로 시작", err);
    try {
      localStorage.setItem("crown_gossip_save_broken_backup", JSON.stringify(record));
    } catch {
      // 보관 실패는 무시
    }
    restored = restoreState(null, Date.now(), ctx);
  }
  const { state, report, isNew, granted, tidy } = restored;
  const store = createStore(state, ctx);
  // 처음 하는 사람에게는 지난 업데이트 노트를 띄우지 않는다 (다음 버전부터 보여 줌)
  if (isNew) store.dispatch(markVersionSeen, { version: APP_VERSION });
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
    Object.assign(window as object, { __game: store, __board: () => getMainBoard(), __castle: () => getCastleView() });
  }

  await preloadTextures();
  mount(App, { target: document.getElementById("app")! });
  // 불러오면서 구역 완성 보상 생성기를 새로 받았으면 알려 준다 (업데이트로 보상이 생긴 경우 등)
  // 업데이트 노트 등 모달이 떠 있으면 닫힌 뒤에
  const announce = (text: string) => (ui.modal !== null ? setTimeout(() => announce(text), 600) : say("대마녀 셀레네", text));
  if (granted.length) announce(`구역을 완성한 보상으로 새 생성기를 놓아 두었어 — ${granted.map((c) => getGeneratorTierMeta(c, 1).name).join(", ")}. 탭해서 새 재료를 만들어 봐!`);
  // v3.9: 같은 체인에 ★★★가 있으면 나머지 생성기는 쓸모없는 중복 → 불러올 때 정리하고 코인으로 돌려줌. 대화 바는 한 줄이라 한 번에 알림
  const tidyLines: string[] = [];
  if (tidy.trimmed.length) {
    const n = tidy.trimmed.reduce((k, t) => k + t.count, 0);
    const coins = tidy.trimmed.reduce((k, t) => k + t.coins, 0);
    tidyLines.push(`★★★가 있는 체인의 겹치는 생성기 ${n}개를 ${coins}🪙로 바꿔 두었어 (체인마다 ★★★ 하나면 충분해)`);
  }
  if (tidy.adjusted) tidyLines.push(`더 만들 수 없는 Lv.1 주문 ${tidy.adjusted}건은 Lv.2로 바꿨어`);
  if (tidyLines.length) setTimeout(() => announce(tidyLines.join(" · ")), granted.length ? 6000 : 0);
  const fx = new FxLayer();
  await fx.init();
  attachJuice(store, fx, sfx);
  attachRewardDirector(store, fx, sfx);
  registerServiceWorker();
}

void boot();
