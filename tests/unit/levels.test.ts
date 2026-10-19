import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { gainXP } from "../../src/core/actions/progress";
import { renovate } from "../../src/core/actions/castle";
import { getZoneProgress, serveOrder, createOrder } from "../../src/core/actions/orders";
import { moveOrMerge, storeToBag } from "../../src/core/actions/board";
import { ROOMS } from "../../src/core/rules/rooms";
import { CHAIN_UNLOCK_ZONE, ZONE_REQUIRED_LEVEL, bagSize, levelUpReward, mergeXP, orderXP, unlockedChains, unlocksAt, xpToNext } from "../../src/core/rules/levels";
import type { GameState, ZoneKey } from "../../src/core/types";
import type { GameEvent } from "../../src/core/events";
import { emptyBoard, fixedCtx, item } from "./helpers";

let s: GameState;
beforeEach(() => {
  s = createInitialState(fixedCtx());
  emptyBoard(s);
});

const finishZone = (z: ZoneKey) => ROOMS[z].spots.forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));

describe("경험치 곡선과 출처", () => {
  test("필요 경험치는 가파르게 늘어남", () => {
    expect(xpToNext(1)).toBe(150);
    expect(xpToNext(2)).toBe(282);
    expect(xpToNext(10)).toBe(2202);
    expect(xpToNext(20)).toBe(6762);
  });
  test("합성 경험치 = 결과 레벨, 주문 경험치 = 5 + 3×요구 레벨 합", () => {
    expect(mergeXP(2)).toBe(2);
    expect(mergeXP(8)).toBe(8);
    expect(orderXP([{ chain: "tea", level: 3 }, { chain: "herb", level: 2 }])).toBe(20);
  });
  test("합성하면 결과 레벨만큼 경험치", () => {
    s.board[0] = item("tea", 4);
    s.board[1] = item("tea", 4);
    moveOrMerge(s, fixedCtx([0.99]), { from: 0, to: 1 });
    expect(s.xp).toBe(5);
  });
  test("주문 완료 경험치는 요구 레벨에 비례", () => {
    s.orders[0] = { ...createOrder(s, fixedCtx(), 0, [{ chain: "tea", level: 3 }]), coins: 10 };
    s.board[5] = item("tea", 3);
    serveOrder(s, fixedCtx([0.99]), { orderIdx: 0 });
    expect(s.xp).toBe(14);
  });
});

describe("레벨업 보상", () => {
  test("매 레벨 코인 25×L·번개 5·💎3, 생성기 파츠는 짝수 레벨만", () => {
    expect(levelUpReward(2)).toEqual({ coins: 50, energy: 5, gems: 3, genPart: true });
    expect(levelUpReward(3)).toEqual({ coins: 75, energy: 5, gems: 3, genPart: false });
    const ev: GameEvent[] = [];
    const e0 = s.energy;
    gainXP(s, ev, 150);
    expect(s.playerLv).toBe(2);
    expect(s.energy).toBe(e0 + 5);
    expect(ev.filter((e) => e.type === "generatorPartGranted").length).toBe(1);
    const ev3: GameEvent[] = [];
    gainXP(s, ev3, xpToNext(2));
    expect(s.playerLv).toBe(3);
    expect(ev3.filter((e) => e.type === "generatorPartGranted").length).toBe(0);
  });
  test("v3.8: 레벨이 올라도 새 체인 생성기는 생기지 않음 (구역 완성 보상으로 옮김)", () => {
    s.playerLv = 5;
    const ev: GameEvent[] = [];
    gainXP(s, ev, xpToNext(5) + xpToNext(6) + xpToNext(7));
    expect(s.playerLv).toBe(8);
    expect(ev.some((e) => e.type === "chainUnlocked")).toBe(false);
    expect([...s.board, ...s.bag].some((c) => c?.isGenerator && (c.chain === "candle" || c.chain === "silk"))).toBe(false);
  });
});

describe("해금표", () => {
  test("v3.8 체인: 촛불은 공방 완성, 비단은 하버 완성 — 이미 그 생성기를 가진 세이브는 계속 열림", () => {
    expect(CHAIN_UNLOCK_ZONE).toEqual({ candle: "alchemy", silk: "harbor" });
    s.playerLv = 30;
    expect(unlockedChains(s)).not.toContain("candle");
    finishZone("alchemy");
    expect(unlockedChains(s)).toContain("candle");
    expect(unlockedChains(s)).not.toContain("silk");
    finishZone("harbor");
    expect(unlockedChains(s)).toEqual(expect.arrayContaining(["potion", "grimoire", "herb", "bakery", "tea", "candle", "silk"]));
    const old = createInitialState(fixedCtx());
    old.bag.push({ uid: "g", state: "active", isGenerator: true, chain: "silk", level: 1 });
    expect(unlockedChains(old)).toContain("silk");
  });
  test("v3.8: 구역 마지막 장소를 복구하면 그 구역 보상 생성기를 받음 (보드·보관함이 꽉 차도)", () => {
    s.playerLv = 30;
    s.coins = 10_000_000;
    ROOMS.alchemy.spots.slice(0, 4).forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));
    s.board = s.board.map(() => item("tea", 1));
    for (let i = 0; i < bagSize(30); i++) s.bag.push(item("tea", 1));
    const ev = renovate(s, fixedCtx(), { spotId: ROOMS.alchemy.spots[4].id, styleIdx: 0 });
    const zi = ev.findIndex((e) => e.type === "zoneCompleted");
    const ci = ev.findIndex((e) => e.type === "chainUnlocked" && e.chain === "candle");
    expect(zi).toBeGreaterThanOrEqual(0);
    expect(ci).toBeGreaterThan(zi);
    expect([...s.board, ...s.bag].some((c) => c?.isGenerator && c.chain === "candle")).toBe(true);
  });
  test("보관함: 6 → Lv5 8 → Lv10 10 → Lv15 12", () => {
    expect([1, 5, 10, 15, 30].map(bagSize)).toEqual([6, 8, 10, 12, 12]);
  });
  test("구역 입장 레벨과 해금 문구", () => {
    expect(ZONE_REQUIRED_LEVEL).toMatchObject({ alchemy: 1, harbor: 6, garden: 11, banquet: 14 });
    expect(unlocksAt(6).some((t) => t.includes("하버"))).toBe(true);
    expect(unlocksAt(5).some((t) => t.includes("보관함"))).toBe(true);
    expect(unlocksAt(6).some((t) => t.includes("촛불"))).toBe(false);
  });
  test("보관함은 레벨에 맞춰 늘어남", () => {
    for (let i = 0; i < 6; i++) s.bag.push(item("tea", 1));
    s.board[0] = item("tea", 1);
    expect(storeToBag(s, fixedCtx(), { cell: 0 })[0]).toMatchObject({ type: "rejected" });
    s.playerLv = 5;
    expect(storeToBag(s, fixedCtx(), { cell: 0 }).some((e) => e.type === "rejected")).toBe(false);
    expect(s.bag.length).toBe(7);
  });
});

describe("구역 입장 레벨", () => {
  test("공방을 다 깨도 Lv5면 하버는 잠김, 복구 거절, 주문은 공방 기준", () => {
    finishZone("alchemy");
    s.playerLv = 5;
    s.coins = 99999;
    const zp = getZoneProgress(s);
    expect(zp.accessibleKeys).toEqual(["alchemy"]);
    expect(zp.nextSpotId).toBe(ROOMS.harbor.spots[0].id);
    expect(zp.nextSpotLockedLv).toBe(6);
    expect(zp.currentZoneKey).toBe("alchemy");
    expect(renovate(s, fixedCtx(), { spotId: ROOMS.harbor.spots[0].id, styleIdx: 0 })[0]).toMatchObject({ type: "rejected", reason: "levelLocked" });
    s.playerLv = 6;
    const zp4 = getZoneProgress(s);
    expect(zp4.accessibleKeys).toEqual(["alchemy", "harbor"]);
    expect(zp4.nextSpotLockedLv).toBeNull();
    expect(zp4.currentZoneKey).toBe("harbor");
  });
  test("레벨보다 진행이 앞선 기존 세이브는 진행한 구역이 그대로 열려 있음", () => {
    finishZone("alchemy");
    finishZone("harbor");
    s.rooms[ROOMS.garden.spots[0].id] = { done: true, styleIdx: 0 };
    s.playerLv = 3;
    const zp = getZoneProgress(s);
    expect(zp.accessibleKeys).toEqual(["alchemy", "harbor", "garden"]);
    expect(zp.currentZoneKey).toBe("garden");
    expect(zp.nextSpotLockedLv).toBeNull();
  });
  test("구역 완성 시 다음 구역이 레벨로 잠겨 있으면 공개 연출 없음", () => {
    ROOMS.alchemy.spots.slice(0, 4).forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));
    s.playerLv = 2;
    s.coins = 99999;
    const ev = renovate(s, fixedCtx(), { spotId: ROOMS.alchemy.spots[4].id, styleIdx: 0 });
    expect(ev.find((e) => e.type === "zoneCompleted")).toMatchObject({ revealKey: null });
  });
});

import { ensureGenerators } from "../../src/services/save/restore";
import { createOrder as mkOrder } from "../../src/core/actions/orders";

describe("새 체인 해금 (세이브·주문)", () => {
  test("보상 구역을 완성한 세이브는 불러올 때 새 체인 생성기를 받고, 레벨만 높으면 받지 않음 (v3.8)", () => {
    s.playerLv = 30;
    ensureGenerators(s);
    expect(s.board.some((c) => c?.isGenerator && c.chain === "candle")).toBe(false);
    finishZone("alchemy");
    finishZone("harbor");
    ensureGenerators(s);
    expect(s.board.filter((c) => c?.isGenerator && (c.chain === "candle" || c.chain === "silk")).length).toBe(2);
    ensureGenerators(s);
    expect(s.board.filter((c) => c?.isGenerator && c.chain === "candle").length).toBe(1);
  });
  test("해금 전에는 주문에 새 체인이 나오지 않고, 보상 구역을 완성하면 나옴 (v3.8)", () => {
    s.playerLv = 30;
    const seen = (zone: ZoneKey | null) => {
      if (zone) finishZone(zone);
      const set = new Set<string>();
      for (let i = 0; i < 300; i++) for (const r of mkOrder(s, fixedCtx([Math.random(), Math.random(), Math.random(), Math.random()]), i % 3).reqs) set.add(r.chain);
      return set;
    };
    expect(seen(null).has("candle")).toBe(false);
    expect(seen("alchemy").has("candle")).toBe(true);
    expect(seen(null).has("silk")).toBe(false);
    expect(seen("harbor").has("silk")).toBe(true);
  });
});

import { ALL_SPOTS_IN_ORDER } from "../../src/core/rules/rooms";
import { CUSTOMERS_BY_ZONE } from "../../src/core/rules/customers";
import { ZONE_ORDER, rollOrderReqs } from "../../src/core/rules/progression";
import { characterIdForName } from "../../src/core/rules/characters";

describe("새 구역: 지하 저장고·달빛 마탑 (제21~30화)", () => {
  test("6구역 30화, 새 구역 입장 레벨 17·21, 대사 화자는 모두 등록된 캐릭터", () => {
    expect(ZONE_ORDER).toEqual(["alchemy", "harbor", "garden", "banquet", "cellar", "tower"]);
    expect(ALL_SPOTS_IN_ORDER.length).toBe(30);
    expect(ALL_SPOTS_IN_ORDER[20].spot.id).toBe("cel_wine");
    expect(ZONE_REQUIRED_LEVEL).toMatchObject({ cellar: 17, tower: 21 });
    for (const e of ALL_SPOTS_IN_ORDER.slice(20)) {
      expect(e.spot.dialogues.length, e.spot.id).toBeGreaterThanOrEqual(2);
      for (const d of e.spot.dialogues) expect(["selene", "quinn", "nero", "quinn_nero", "lucian", "margaret", "oberon", "arthur"]).toContain(d.characterId);
    }
    for (const z of ["cellar", "tower"] as const) {
      expect(CUSTOMERS_BY_ZONE[z].length).toBeGreaterThanOrEqual(4);
      for (const c of CUSTOMERS_BY_ZONE[z]) expect(characterIdForName(c.name), c.name).not.toBeNull();
    }
  });
  test("새 구역 주문은 그 구역 대표 체인(저장고 촛불·마탑 비단)이 자주 나옴", () => {
    finishZone("alchemy");
    finishZone("harbor");
    const pool = unlockedChains(s);
    const count = (zone: string, chain: string) => {
      let n = 0;
      let seed = 1;
      const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 400; i++) for (const r of rollOrderReqs(zone, pool, rng)) if (r.chain === chain) n++;
      return n;
    };
    expect(count("cellar", "candle")).toBeGreaterThan(count("banquet", "candle") * 2);
    expect(count("tower", "silk")).toBeGreaterThan(count("banquet", "silk") * 2);
  });
});

describe("버그 수정: 해금 생성기 유실·만들 수 없는 주문", () => {
  test("주문 요구 레벨은 2 이상 (★2·★3 생성기도 만들 수 있게)", () => {
    let seed = 3;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 500; i++) for (const r of rollOrderReqs("garden", unlockedChains(s), rng)) expect(r.level).toBeGreaterThanOrEqual(2);
  });
});

describe("리뷰 반영", () => {
  test("다음 구역이 레벨로 잠긴 채 구역을 완성하면 zoneCompleted에 필요 레벨이 실림 (완결 아님)", () => {
    ROOMS.alchemy.spots.slice(0, 4).forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));
    s.playerLv = 2;
    s.coins = 99999;
    const ev = renovate(s, fixedCtx(), { spotId: ROOMS.alchemy.spots[4].id, styleIdx: 0 });
    expect(ev.find((e) => e.type === "zoneCompleted")).toMatchObject({ revealKey: null, nextLockedLv: 6 });
  });
  test("보드가 꽉 차 있어도 해금된 새 체인 생성기는 불러올 때 보관함으로 지급", () => {
    s.board = s.board.map(() => item("tea", 1));
    finishZone("alchemy");
    finishZone("harbor");
    ensureGenerators(s);
    const all = [...s.board, ...s.bag];
    expect(all.some((c) => c?.isGenerator && c.chain === "candle")).toBe(true);
    expect(all.some((c) => c?.isGenerator && c.chain === "silk")).toBe(true);
  });
  test("이야기 순서상 뒤 구역을 이미 진행한 v2 세이브는 앞 구역이 레벨로 잠기지 않음", () => {
    finishZone("alchemy");
    s.rooms[ROOMS.garden.spots[0].id] = { done: true, styleIdx: 0 };
    s.playerLv = 4;
    const zp = getZoneProgress(s);
    expect(zp.accessibleKeys).toEqual(["alchemy", "harbor", "garden"]);
    expect(zp.nextSpotId).toBe(ROOMS.harbor.spots[0].id);
    expect(zp.nextSpotLockedLv).toBeNull();
  });
});

// v3.8: 구역 완성 보상 생성기를 건네주는 장면 (반응 말풍선은 46자에서 잘림)
import { CHAIN_GIFT } from "../../src/core/rules/levels";
import { CHARACTERS } from "../../src/core/rules/characters";
test("새 체인마다 건네주는 캐릭터와 짧은 대사가 있음", () => {
  for (const c of ["candle", "silk"] as const) {
    expect(CHARACTERS[CHAIN_GIFT[c].characterId], c).toBeTruthy();
    expect(CHAIN_GIFT[c].line.length, c).toBeLessThanOrEqual(46);
  }
});

test("v3.8 리뷰: 구역 완성 선물은 같은 복구의 레벨업 파츠보다 먼저 — 선물 장면이 빠지지 않음", () => {
  s.playerLv = 13;
  s.xp = xpToNext(13) - 1; // 이번 복구 경험치로 Lv.14 (짝수 → 파츠)
  s.coins = 10_000_000;
  finishZone("alchemy");
  ROOMS.harbor.spots.slice(0, 4).forEach((sp) => (s.rooms[sp.id] = { done: true, styleIdx: 0 }));
  s.board[0] = { uid: "c", state: "active", isGenerator: true, chain: "candle", level: 1 };
  const ev = renovate(s, fixedCtx(), { spotId: ROOMS.harbor.spots[4].id, styleIdx: 0 });
  expect(ev.some((e) => e.type === "chainUnlocked" && e.chain === "silk")).toBe(true);
  const gi = ev.findIndex((e) => e.type === "chainUnlocked");
  const li = ev.findIndex((e) => e.type === "levelUp");
  expect(gi).toBeLessThan(li === -1 ? Infinity : li);
});

test("v3.8 리뷰: 보드와 보관함(최대 칸)이 모두 꽉 차도 구역 완성 보상 생성기는 불러올 때 보관함으로 (주문만 나오고 생성기가 없는 상태 방지)", () => {
  s.board = s.board.map(() => item("tea", 1));
  for (let i = 0; i < 12; i++) s.bag.push(item("tea", 1));
  finishZone("alchemy");
  ensureGenerators(s);
  expect(s.bag.some((c) => c.isGenerator && c.chain === "candle")).toBe(true);
});
