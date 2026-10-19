import { test, expect, vi } from "vitest";
import { createInitialState } from "../../src/core/state";
import { createStore } from "../../src/core/store";
import { renovate } from "../../src/core/actions/castle";
import { ROOMS } from "../../src/core/rules/rooms";
import { attachFeedback } from "../../src/views/ui/feedback";
import { ui } from "../../src/views/ui/ui.svelte";
import type { SoundEngine } from "../../src/services/audio";
import { fixedCtx } from "./helpers";

// v3.8 리뷰: 구역 완성 선물 생성기를 "진화 파츠 획득"으로 미리 알리지 않음 (선물 장면이 알림). 구역 생성기 파츠는 그대로 알림
test("선물 생성기 지급은 진화 파츠 안내를 띄우지 않음", () => {
  vi.useFakeTimers();
  const s = createInitialState(fixedCtx());
  s.coins = 9_999_999;
  ROOMS.alchemy.spots.slice(0, 4).forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));
  const store = createStore(s, fixedCtx());
  const sfx = new Proxy({}, { get: () => () => {} }) as unknown as SoundEngine;
  attachFeedback(store, sfx);
  const said: string[] = [];
  store.onEvent(() => said.push(`${ui.dialogue.speaker}|${ui.dialogue.text}`));
  store.dispatch(renovate, { spotId: ROOMS.alchemy.spots[4].id, styleIdx: 0 });
  expect(said.some((t) => t.includes("촛대") && t.includes("파츠"))).toBe(false);
  expect(said.some((t) => t.includes("파츠"))).toBe(true); // 구역 생성기 파츠 안내는 있음
});
