import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { renovate, selectZone } from "../../src/core/actions/castle";
import type { GameState } from "../../src/core/types";
import { fixedCtx } from "./helpers";

let s: GameState;
beforeEach(() => {
  s = createInitialState(fixedCtx());
  s.coins = 10000;
});
const ALC = ["alc_cauldron", "alc_bookcase", "alc_herbtable", "alc_window", "alc_counter"];

describe("구역 선택", () => {
  test("잠긴 구역 거부, 입장 가능 구역 선택", () => {
    expect(selectZone(s, fixedCtx(), { zoneKey: "banquet" })).toEqual([{ type: "rejected", reason: "locked" }]);
    expect(selectZone(s, fixedCtx(), { zoneKey: "alchemy" })).toEqual([{ type: "zoneSelected", zoneKey: "alchemy" }]);
  });
});

describe("장소 복구", () => {
  test("다음 화가 아니면 거부, 코인 부족 거부(코인 그대로)", () => {
    expect(renovate(s, fixedCtx(), { spotId: "alc_bookcase", styleIdx: 0 })).toEqual([{ type: "rejected", reason: "notNextChapter" }]);
    s.coins = 299;
    expect(renovate(s, fixedCtx(), { spotId: "alc_cauldron", styleIdx: 0 })).toEqual([{ type: "rejected", reason: "notEnoughCoins" }]);
    expect(s.coins).toBe(299);
    expect(s.rooms.alc_cauldron.done).toBe(false);
  });
  test("정상 복구(제1화 비용 1×800): 코인 −800, 완료·스타일, XP 35, 생성기 파츠, spotRestored", () => {
    const ev = renovate(s, fixedCtx(), { spotId: "alc_cauldron", styleIdx: 2 });
    expect(s.coins).toBe(9200);
    expect(s.rooms.alc_cauldron).toEqual({ done: true, styleIdx: 2 });
    expect(s.xp).toBe(35);
    expect(ev.find((e) => e.type === "spotRestored")).toEqual({ type: "spotRestored", spotId: "alc_cauldron", zoneKey: "alchemy", chapter: 1, coinCost: 800, styleIdx: 2 });
    expect(ev.some((e) => e.type === "generatorPartGranted")).toBe(true);
  });
  test("구역 마지막 장소: 💎50 + zoneCompleted(revealKey harbor) — 하버 입장 레벨(6) 이상", () => {
    s.playerLv = 6;
    for (const id of ALC.slice(0, 4)) s.rooms[id].done = true;
    const gems = s.gems;
    const ev = renovate(s, fixedCtx(), { spotId: "alc_counter", styleIdx: 0 });
    expect(s.gems).toBe(gems + 50);
    expect(ev.find((e) => e.type === "zoneCompleted")).toEqual({ type: "zoneCompleted", zoneKey: "alchemy", gems: 50, revealKey: "harbor" });
  });
  test("v2식 진행(하버 이미 완성)에서 공방 완성 → 공개 대상은 온실", () => {
    s.playerLv = 11;
    for (const id of ALC.slice(0, 4)) s.rooms[id].done = true;
    for (const id of ["hb_espresso", "hb_parasol", "hb_fountain", "hb_bakery", "hb_arch"]) s.rooms[id].done = true;
    const ev = renovate(s, fixedCtx(), { spotId: "alc_counter", styleIdx: 0 });
    expect(ev.find((e) => e.type === "zoneCompleted")).toMatchObject({ revealKey: "garden" });
  });
  test("마지막 구역 완성은 revealKey null", () => {
    s.playerLv = 20;
    s.coins = 99999;
    for (const id of Object.keys(s.rooms)) s.rooms[id].done = id !== "tw_crown";
    const ev = renovate(s, fixedCtx(), { spotId: "tw_crown", styleIdx: 0 });
    expect(ev.find((e) => e.type === "zoneCompleted")).toMatchObject({ zoneKey: "tower", revealKey: null });
  });
  test("이미 복구한 장소의 스타일 변경은 무료", () => {
    s.rooms.alc_cauldron = { done: true, styleIdx: 0 };
    const coins = s.coins;
    expect(renovate(s, fixedCtx(), { spotId: "alc_cauldron", styleIdx: 1 })).toEqual([{ type: "spotRestyled", spotId: "alc_cauldron", styleIdx: 1 }]);
    expect(s.coins).toBe(coins);
    expect(s.rooms.alc_cauldron.styleIdx).toBe(1);
  });
});
