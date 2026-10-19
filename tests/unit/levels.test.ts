import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { gainXP } from "../../src/core/actions/progress";
import { renovate } from "../../src/core/actions/castle";
import { getZoneProgress, serveOrder, createOrder } from "../../src/core/actions/orders";
import { moveOrMerge, storeToBag } from "../../src/core/actions/board";
import { ROOMS } from "../../src/core/rules/rooms";
import { CHAIN_UNLOCK_LEVEL, ZONE_REQUIRED_LEVEL, bagSize, levelUpReward, mergeXP, orderXP, unlockedChains, unlocksAt, xpToNext } from "../../src/core/rules/levels";
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
  test("해금 레벨에 닿으면 새 체인 생성기를 지급", () => {
    s.playerLv = CHAIN_UNLOCK_LEVEL.candle - 1;
    const ev: GameEvent[] = [];
    gainXP(s, ev, xpToNext(s.playerLv));
    expect(ev.some((e) => e.type === "chainUnlocked" && e.chain === "candle")).toBe(true);
    expect(s.board.some((c) => c?.isGenerator && c.chain === "candle")).toBe(true);
  });
});

describe("해금표", () => {
  test("체인: 촛불 Lv6, 비단 Lv12", () => {
    expect(unlockedChains(5)).not.toContain("candle");
    expect(unlockedChains(6)).toContain("candle");
    expect(unlockedChains(11)).not.toContain("silk");
    expect(unlockedChains(12)).toEqual(expect.arrayContaining(["potion", "grimoire", "herb", "bakery", "tea", "candle", "silk"]));
  });
  test("보관함: 6 → Lv5 8 → Lv10 10 → Lv15 12", () => {
    expect([1, 5, 10, 15, 30].map(bagSize)).toEqual([6, 8, 10, 12, 12]);
  });
  test("구역 입장 레벨과 해금 문구", () => {
    expect(ZONE_REQUIRED_LEVEL).toMatchObject({ alchemy: 1, harbor: 6, garden: 11, banquet: 14 });
    expect(unlocksAt(6).some((t) => t.includes("하버"))).toBe(true);
    expect(unlocksAt(5).some((t) => t.includes("보관함"))).toBe(true);
    expect(unlocksAt(6).some((t) => t.includes("촛불"))).toBe(true);
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
  test("해금 레벨을 넘긴 세이브는 불러올 때 새 체인 생성기를 받고, 그 전 레벨은 받지 않음", () => {
    s.playerLv = 5;
    ensureGenerators(s);
    expect(s.board.some((c) => c?.isGenerator && c.chain === "candle")).toBe(false);
    s.playerLv = 12;
    ensureGenerators(s);
    expect(s.board.filter((c) => c?.isGenerator && (c.chain === "candle" || c.chain === "silk")).length).toBe(2);
    ensureGenerators(s);
    expect(s.board.filter((c) => c?.isGenerator && c.chain === "candle").length).toBe(1);
  });
  test("해금 전에는 주문에 새 체인이 나오지 않고, 해금 뒤에는 나옴", () => {
    const seen = (lv: number) => {
      s.playerLv = lv;
      const set = new Set<string>();
      for (let i = 0; i < 300; i++) for (const r of mkOrder(s, fixedCtx([Math.random(), Math.random(), Math.random(), Math.random()]), i % 3).reqs) set.add(r.chain);
      return set;
    };
    expect(seen(5).has("candle")).toBe(false);
    expect(seen(6).has("candle")).toBe(true);
    expect(seen(11).has("silk")).toBe(false);
    expect(seen(12).has("silk")).toBe(true);
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
    const pool = unlockedChains(20);
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
  test("보드와 보관함이 꽉 차 있어도 해금 체인 생성기는 보관함에 들어감", () => {
    s.board = s.board.map(() => item("tea", 1));
    for (let i = 0; i < bagSize(CHAIN_UNLOCK_LEVEL.candle); i++) s.bag.push(item("tea", 1));
    s.playerLv = CHAIN_UNLOCK_LEVEL.candle - 1;
    const ev: GameEvent[] = [];
    gainXP(s, ev, xpToNext(s.playerLv));
    expect([...s.board, ...s.bag].some((c) => c?.isGenerator && c.chain === "candle")).toBe(true);
  });
  test("주문 요구 레벨은 2 이상 (★2·★3 생성기도 만들 수 있게)", () => {
    let seed = 3;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 500; i++) for (const r of rollOrderReqs("garden", unlockedChains(10), rng)) expect(r.level).toBeGreaterThanOrEqual(2);
  });
});
