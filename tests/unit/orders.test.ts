import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { createOrder, initCustomerOrders, computeWanted, serveOrder, buyOrderRequirement, getCurrentZoneKey } from "../../src/core/actions/orders";
import { CUSTOMERS_BY_ZONE } from "../../src/core/rules/customers";
import type { GameState } from "../../src/core/types";
import { fixedCtx, item, emptyBoard } from "./helpers";
import { createCtx } from "../../src/core/ctx";

let s: GameState;
beforeEach(() => {
  s = createInitialState(fixedCtx());
});

describe("주문 생성", () => {
  test("공방에서는 최대 Lv.4, 공방 완성 뒤(하버 입장 레벨)에는 최대 Lv.5 + 하버 손님", () => {
    s.playerLv = 6;
    const ctx = createCtx();
    let max = 0;
    for (let i = 0; i < 200; i++) for (const r of createOrder(s, ctx, i % 3).reqs) max = Math.max(max, r.level);
    expect(max).toBe(4);
    for (const id of ["alc_cauldron", "alc_bookcase", "alc_herbtable", "alc_window", "alc_counter"]) s.rooms[id].done = true;
    expect(getCurrentZoneKey(s)).toBe("harbor");
    const harborNames = new Set(CUSTOMERS_BY_ZONE.harbor.map((c) => c.name));
    max = 0;
    for (let i = 0; i < 200; i++) {
      const o = createOrder(s, ctx, i % 3);
      expect(harborNames.has(o.customer.name)).toBe(true);
      for (const r of o.reqs) max = Math.max(max, r.level);
    }
    expect(max).toBe(5);
  });
  test("보상 코인 = Σ 2^lv × 4 + 15, 초기 주문 3개", () => {
    const o = createOrder(s, fixedCtx(), 0, [{ chain: "tea", level: 3 }]);
    expect(o.coins).toBe(8 * 4 + 15);
    initCustomerOrders(s, fixedCtx());
    expect(s.orders.map((o) => o.reqs)).toEqual([
      [{ chain: "potion", level: 3 }],
      [{ chain: "potion", level: 2 }, { chain: "herb", level: 1 }],
      [{ chain: "grimoire", level: 2 }, { chain: "bakery", level: 2 }],
    ]);
  });
});

describe("주문 완료·구매", () => {
  beforeEach(() => {
    emptyBoard(s);
    s.orders = [createOrder(s, fixedCtx(), 0, [{ chain: "tea", level: 2 }, { chain: "herb", level: 1 }])];
  });
  test("재료가 모두 있으면 완료: 재료 제거, 코인·XP, 새 주문", () => {
    s.board[3] = item("tea", 2);
    s.board[9] = item("herb", 1);
    const w = computeWanted(s);
    expect(w.status[0].allReady).toBe(true);
    expect(w.wantedUids.size).toBe(2);
    const coins = s.orders[0].coins;
    const ev = serveOrder(s, fixedCtx([0.9]), { orderIdx: 0 });
    expect(ev.find((e) => e.type === "orderServed")).toMatchObject({ orderIdx: 0, cells: [3, 9], coins, bonusCell: null });
    expect(s.board[3]).toBeNull();
    expect(s.coins).toBe(350 + coins);
    expect(s.xp).toBe(5 + 3 * (2 + 1)); // orderXP: 5 + 3×요구 레벨 합
    expect(s.orders[0].reqs).not.toEqual([{ chain: "tea", level: 2 }, { chain: "herb", level: 1 }]);
  });
  test("재료가 부족하면 아무 일도 없음, 8% 미만이면 번개 조각", () => {
    s.board[3] = item("tea", 2);
    expect(serveOrder(s, fixedCtx(), { orderIdx: 0 })).toEqual([]);
    s.board[9] = item("herb", 1);
    const ev = serveOrder(s, fixedCtx([0.05]), { orderIdx: 0 });
    const served = ev.find((e) => e.type === "orderServed");
    expect(served && served.type === "orderServed" && served.bonusCell).not.toBeNull();
  });
  test("💎 구매: 보드 → 보관함 → 둘 다 가득이면 거부(보석 그대로)", () => {
    s.gems = 30;
    expect(buyOrderRequirement(s, fixedCtx(), { orderIdx: 0, reqIdx: 0 })[1]).toMatchObject({ type: "itemBought", where: "board", price: 4 });
    expect(s.gems).toBe(26);
    s.board = s.board.map((c) => c ?? item("potion", 1));
    expect(buyOrderRequirement(s, fixedCtx(), { orderIdx: 0, reqIdx: 1 })[1]).toMatchObject({ type: "itemBought", where: "bag", price: 2 });
    s.bag = new Array(6).fill(0).map(() => item("potion", 1));
    expect(buyOrderRequirement(s, fixedCtx(), { orderIdx: 0, reqIdx: 1 })).toEqual([{ type: "rejected", reason: "boardFull" }]);
    expect(s.gems).toBe(24);
    s.gems = 1;
    s.bag = [];
    expect(buyOrderRequirement(s, fixedCtx(), { orderIdx: 0, reqIdx: 1 })).toEqual([{ type: "rejected", reason: "notEnoughGems" }]);
  });
});
