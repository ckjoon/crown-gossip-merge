import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { moveOrMerge } from "../../src/core/actions/board";
import { serveOrder } from "../../src/core/actions/orders";
import { tickEnergy } from "../../src/core/actions/progress";
import { levelUpReward } from "../../src/core/rules/levels";
import { mergeBonusChance, MERGE_BONUS_ENERGY_SHARE, ORDER_ENERGY_CHANCE } from "../../src/core/rules/progression";
import { generatorName, generatorCellFor } from "../../src/core/codex";
import { ENERGY_REGEN_SEC } from "../../src/core/types";
import type { GameState } from "../../src/core/types";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.10: 번개가 너무 안 나온다 — 자연 충전 2분(Gossip Harbor와 같은 속도), 드롭·레벨업 번개 상향
describe("번개 흐름", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });

  test("자연 충전은 2분마다 1개", () => {
    expect(ENERGY_REGEN_SEC).toBe(120);
    s.energy = 50;
    tickEnergy(s, fixedCtx(), { seconds: 600 });
    expect(s.energy).toBe(55);
  });

  test("레벨업 번개는 +20", () => {
    expect(levelUpReward(5).energy).toBe(20);
  });

  test("합성 보너스: 결과 Lv.4 15%·Lv.5 20%·Lv.6 이상 25%, 그중 70%가 번개", () => {
    expect([3, 4, 5, 6, 8].map(mergeBonusChance)).toEqual([0, 0.15, 0.2, 0.25, 0.25]);
    expect(MERGE_BONUS_ENERGY_SHARE).toBe(0.7);
    s.board[0] = item("potion", 4);
    s.board[1] = item("potion", 4);
    // 0.19 < 20% → 드롭, 0.65 < 70% → 번개
    const ev = moveOrMerge(s, fixedCtx([0.19, 0.65]), { from: 0, to: 1 });
    const b = ev.find((e) => e.type === "bonusDropped");
    expect(b && b.type === "bonusDropped" && b.item.chain).toBe("energy");
  });

  test("Lv.4 결과는 15% 이상이면 드롭 없음", () => {
    s.board[0] = item("potion", 3);
    s.board[1] = item("potion", 3);
    const ev = moveOrMerge(s, fixedCtx([0.16]), { from: 0, to: 1 });
    expect(ev.find((e) => e.type === "bonusDropped")).toBeUndefined();
  });

  test("주문 완료 번개 조각 20%", () => {
    expect(ORDER_ENERGY_CHANCE).toBe(0.2);
    s.board[3] = item("tea", 2);
    s.orders = [{ id: "a", customer: { name: "a", face: "x", line: "" }, reqs: [{ chain: "tea", level: 2 }], coins: 10 }, ...s.orders.slice(1)];
    const ev = serveOrder(s, fixedCtx([0.19]), { orderIdx: 0 });
    const served = ev.find((e) => e.type === "orderServed");
    expect(served && served.type === "orderServed" && served.bonusCell).not.toBeNull();
  });
});

// 주문 카드 안내는 지금 가진 생성기 등급의 이름으로, 그 재료를 만들 수 있는 생성기를 골라 줌
describe("주문 안내의 생성기", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });

  test("이름은 가진 최고 등급, 없으면 ★1 이름", () => {
    s.board[0] = gen("potion", 2);
    s.board[1] = gen("potion", 1);
    expect(generatorName(s, "potion")).toBe("황금 연금술 가마솥");
    expect(generatorName(s, "tea")).toBe(generatorName({ board: [], bag: [] }, "tea"));
  });

  test("요구 레벨을 바로 만들 수 있는 가장 높은 등급 생성기 칸, 없으면 아무 그 체인 생성기", () => {
    s.board[0] = gen("potion", 1);
    s.board[5] = gen("potion", 3);
    expect(generatorCellFor(s, "potion", 1)).toBe(0); // ★3은 Lv.1을 못 만듦
    expect(generatorCellFor(s, "potion", 3)).toBe(5);
    expect(generatorCellFor(s, "potion", 8)).toBe(5);
    expect(generatorCellFor(s, "tea", 2)).toBe(-1);
  });
});
