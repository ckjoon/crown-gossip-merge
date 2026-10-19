import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { moveOrMerge } from "../../src/core/actions/board";
import { gainXP, pickPartChain } from "../../src/core/actions/progress";
import { fitOrdersToGenerators, initCustomerOrders } from "../../src/core/actions/orders";
import { trimSurplusGenerators } from "../../src/core/actions/progress";
import { generatorUnits, GEN_UNITS_MAX, xpToNext, orderCoins } from "../../src/core/rules/levels";
import type { GameState } from "../../src/core/types";
import type { GameEvent } from "../../src/core/events";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.9: 생성기는 체인당 ★3 하나까지 (파츠 한도), 주문은 지금 생성기가 만들 수 있는 단계만
describe("생성기 한도 — 체인당 ★3 하나", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });

  test("파츠 단위: ★1=1, ★2=2, ★3=4 (보드+보관함), 한도는 4", () => {
    s.board[0] = gen("potion", 2);
    s.bag = [gen("potion", 1)];
    expect(generatorUnits(s, "potion")).toBe(3);
    expect(GEN_UNITS_MAX).toBe(4);
  });

  test("파츠 체인 고르기: 원하는 체인이 가득 차면 한도가 남은 다음 체인, 모두 가득이면 null", () => {
    for (const c of ["potion", "grimoire", "herb", "bakery", "tea"] as const) s.board.push(gen(c, 3));
    s.board = s.board.slice(-56);
    expect(pickPartChain(s, "potion")).toBeNull();
    s.board[s.board.findIndex((c) => c?.chain === "herb")] = gen("herb", 2);
    expect(pickPartChain(s, "potion")).toBe("herb");
    expect(pickPartChain(s, "herb")).toBe("herb");
  });

  test("레벨업 파츠는 ★3를 이미 가진 체인에는 주지 않음", () => {
    for (const [i, c] of (["potion", "grimoire", "herb", "bakery", "tea"] as const).entries()) s.board[i] = gen(c, 3);
    s.playerLv = 1;
    const ev: GameEvent[] = [];
    gainXP(s, ev, xpToNext(1)); // → Lv.2 (짝수 레벨 파츠)
    expect(s.playerLv).toBe(2);
    expect(ev.find((e) => e.type === "generatorPartGranted")).toBeUndefined();
    expect(ev.find((e) => e.type === "levelUp")).toMatchObject({ genChain: null });
    expect(s.board.filter((c) => c?.isGenerator).length).toBe(5);
  });

  test("예전 세이브의 남는 생성기: ★3가 있는 체인의 나머지 생성기는 정리하고 파츠당 코인으로 돌려줌", () => {
    s.board[0] = gen("potion", 3);
    s.board[1] = gen("potion", 3);
    s.board[2] = gen("potion", 1);
    s.bag = [gen("potion", 2), gen("tea", 3)];
    s.board[3] = gen("tea", 2); // tea는 보관함에 ★3 → 보드 ★2는 남는 것
    s.board[4] = gen("herb", 2);
    s.board[5] = gen("herb", 2); // ★3가 없으면 그대로 (합치면 ★3)
    const c0 = s.coins;
    const out = trimSurplusGenerators(s, []);
    expect(s.board[0]).toMatchObject({ chain: "potion", level: 3 });
    expect(s.board[1]).toBeNull();
    expect(s.board[2]).toBeNull();
    expect(s.board[3]).toBeNull();
    expect(s.board[4]).not.toBeNull();
    expect(s.bag.map((b) => `${b.chain}${b.level}`)).toEqual(["tea3"]);
    const potion = out.find((o) => o.chain === "potion")!;
    expect(potion.count).toBe(3);
    expect(s.coins - c0).toBe(out.reduce((n, o) => n + o.coins, 0));
    expect(potion.coins).toBeGreaterThan(0);
  });
});

describe("주문은 만들 수 있는 단계만", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });

  test("새 게임 첫 주문에 Lv.1 요구가 없음", () => {
    const t = createInitialState(fixedCtx());
    initCustomerOrders(t, fixedCtx());
    for (const o of t.orders) for (const r of o.reqs) expect(r.level).toBeGreaterThanOrEqual(2);
    // 시작 보드만으로 바로 완성되는 주문은 없음 (첫 걸음은 생성기 탭부터)
    const active = t.board.filter((c) => c && c.state === "active" && !c.isGenerator);
    for (const o of t.orders) expect(o.reqs.every((r) => active.some((c) => c!.chain === r.chain && c!.level === r.level))).toBe(false);
  });

  test("★1 생성기가 없는 체인의 Lv.1 요구는 Lv.2로 바뀌고 코인도 다시 계산 — 남은 Lv.1 재료 몫만큼은 그대로", () => {
    s.board[0] = gen("herb", 2);
    s.board[1] = gen("tea", 1);
    s.board[2] = item("herb", 1);
    s.orders = [
      { id: "a", customer: s.orders[0]?.customer ?? ({} as never), reqs: [{ chain: "herb", level: 1 }, { chain: "tea", level: 1 }], coins: 1 },
      { id: "b", customer: {} as never, reqs: [{ chain: "herb", level: 1 }], coins: 1 },
    ];
    const n = fitOrdersToGenerators(s);
    expect(n).toBe(1);
    expect(s.orders[0].reqs).toEqual([{ chain: "herb", level: 1 }, { chain: "tea", level: 1 }]); // 보드 Lv.1 herb로 채울 수 있음
    expect(s.orders[0].coins).toBe(1);
    expect(s.orders[1].reqs).toEqual([{ chain: "herb", level: 2 }]);
    expect(s.orders[1].coins).toBe(orderCoins([{ chain: "herb", level: 2 }]));
  });

  test("마지막 ★1이 진화하면 그 체인 Lv.1 주문이 Lv.2로 바뀌고(ordersAdjusted) Lv.1 재료는 모두 흡수", () => {
    s.board[0] = gen("herb", 1);
    s.board[1] = gen("herb", 1);
    s.board[5] = item("herb", 1);
    s.orders = [{ id: "a", customer: {} as never, reqs: [{ chain: "herb", level: 1 }, { chain: "herb", level: 1 }], coins: 1 }];
    const ev = moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    // Lv.1 하나는 보드에 있어 그 몫은 남기고, 나머지 하나만 Lv.2로
    expect(s.orders[0].reqs.map((r) => r.level).sort()).toEqual([1, 2]);
    expect(ev.find((e) => e.type === "ordersAdjusted")).toMatchObject({ count: 1 });
    expect(s.board[5]).toMatchObject({ chain: "herb", level: 1 });
  });
});

import { restoreState } from "../../src/services/save/restore";
describe("불러올 때 정리", () => {
  test("★3 둘인 세이브는 하나만 남기고 코인으로, ★1 가마솥이 사라져 못 만드는 Lv.1 주문은 Lv.2로", () => {
    const s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
    for (const [i, c] of (["grimoire", "herb", "bakery", "tea"] as const).entries()) s.board[i] = gen(c, 1);
    s.board[10] = gen("potion", 3);
    s.board[11] = gen("potion", 3);
    s.board[12] = gen("potion", 1);
    const cust = { name: "a", face: "x", line: "" };
    s.orders = [
      { id: "o1", customer: cust, reqs: [{ chain: "potion", level: 1 }], coins: 23 },
      { id: "o2", customer: cust, reqs: [{ chain: "tea", level: 2 }], coins: 31 },
      { id: "o3", customer: cust, reqs: [{ chain: "herb", level: 3 }], coins: 47 },
    ];
    const c0 = s.coins;
    const { state, tidy } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: 1_800_000_000_000, data: JSON.parse(JSON.stringify(s)) }, 1_800_000_000_000, fixedCtx());
    expect(state.board.filter((c) => c?.isGenerator && c.chain === "potion").length).toBe(1);
    expect(tidy.trimmed[0]).toMatchObject({ chain: "potion", count: 2, coins: 5 * 40 });
    expect(state.coins).toBe(c0 + 200);
    expect(tidy.adjusted).toBe(1);
    expect(state.orders[0].reqs[0]).toEqual({ chain: "potion", level: 2 });
  });
});
