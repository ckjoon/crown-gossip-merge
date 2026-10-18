// RewardDirector.ts — 장소 복구·구역 완성의 보상 연출 순서를 조율한다
// spotRestored → (입력 잠금) 복구 순간 3D 연출 → "제N화 복구 완료!" 리본 → 캐릭터 반응 → 컷신
//   → (zoneCompleted면) 구역 완성 배너 + 전후 대비 둘러보기 + 💎 비행 → 다음 구역 공개 → (입력 해제)

import type { Store, CommitInfo } from "../../core/store";
import type { GameEvent } from "../../core/events";
import type { SoundEngine } from "../../services/audio";
import { findSpot, ROOMS } from "../../core/rules/rooms";
import { getCastleView } from "../castle/registry";
import { elementCenter, type FxLayer } from "../fx/FxLayer";
import { say, ui } from "../ui/ui.svelte";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let skipZone: (() => void) | null = null;
export function skipZoneShowcase(): void {
  skipZone?.();
}

export function attachRewardDirector(store: Store, fx: FxLayer, sfx: SoundEngine): () => void {
  let queue: Promise<void> = Promise.resolve();

  const onCommit = ({ events }: CommitInfo) => {
    const restored = events.find((e) => e.type === "spotRestored") as Extract<GameEvent, { type: "spotRestored" }> | undefined;
    const restyled = events.find((e) => e.type === "spotRestyled") as Extract<GameEvent, { type: "spotRestyled" }> | undefined;
    const zone = events.find((e) => e.type === "zoneCompleted") as Extract<GameEvent, { type: "zoneCompleted" }> | undefined;
    if (restyled) {
      getCastleView()?.constructionBurst(restyled.spotId, 12);
      sfx.serve();
      return;
    }
    if (!restored) return;
    // 가구는 연출이 직접 떨어뜨리므로, 상태 동기화로 먼저 그려지지 않게 잡아 둔다
    const view = getCastleView();
    if (view) view.holdSpot = restored.spotId;
    ui.inputLocked = true;
    queue = queue.then(() => play(restored, zone)).catch(() => {}).finally(() => {
      ui.inputLocked = false;
      ui.reward = null;
    });
  };

  async function play(r: Extract<GameEvent, { type: "spotRestored" }>, z?: Extract<GameEvent, { type: "zoneCompleted" }>) {
    const view = getCastleView();
    const found = findSpot(r.spotId)!;
    sfx.serve();
    if (view) await view.playRestore(r.spotId, store.get().rooms);

    ui.reward = { kind: "ribbon", chapter: r.chapter, name: found.spot.name, chips: ["+35 XP", "🔥 생성기 파츠"] };
    sfx.reward();
    await wait(1400);

    const first = found.spot.dialogues[0];
    if (first) {
      ui.reward = { kind: "reaction", characterId: first.characterId, line: first.line.length > 46 ? `${first.line.slice(0, 46)}…` : first.line };
      await wait(1500);
    }
    ui.reward = null;

    await new Promise<void>((resolve) => {
      ui.cutscene = { spotId: r.spotId, step: 0, onFinish: resolve };
    });

    if (!z) return;
    const title = `🎉 ${ROOMS[z.zoneKey].shortName} 완성!`;
    ui.reward = { kind: "zone", title, gems: z.gems };
    sfx.reward();
    const showcase = view ? view.playZoneShowcase() : Promise.resolve();
    skipZone = () => view?.skipShowcase();
    const to = elementCenter(document.querySelector('[data-fx-target="gems"]'));
    if (to) for (let k = 0; k < 6; k++) fx.fly("💎", { x: window.innerWidth / 2 + (k - 3) * 14, y: window.innerHeight * 0.35 }, to, { size: 26, delay: 0.6 + k * 0.08, duration: 0.7 });
    await showcase;
    skipZone = null;
    ui.reward = null;

    if (z.revealKey) {
      ui.castleMap = true;
      ui.revealZone = z.revealKey;
      say("🗺️ 새 구역 공개", `${ROOMS[z.revealKey].shortName}이(가) 열렸어요! 성 지도에서 핀을 눌러 입장하세요.`);
      setTimeout(() => (ui.revealZone = null), 3000);
    } else {
      say("👑 마녀의 성 완전 복원", "모든 구역을 완성했어요! 셀레네의 성이 다시 빛나기 시작했어요.");
    }
  }

  return store.onCommit(onCommit);
}
