import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { coachStep } from "../../src/views/ui/coach";
import { ROOMS } from "../../src/core/rules/rooms";
import { getSpotCoinCost } from "../../src/core/rules/progression";
import type { GameState } from "../../src/core/types";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.7 첫 복구 코치: 저장 없이 지금 상태만 보고 "다음에 할 일" 하나를 고른다
describe("coachStep", () => {
  let s: GameState;
  const first = ROOMS.alchemy.spots[0];
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    s.orders = [{ ...s.orders[0], reqs: [{ chain: "tea", level: 5 }] }];
  });

  test("새 게임: 합칠 쌍이 있으면 merge (그 두 칸)", () => {
    const c = coachStep(s)!;
    expect(c.step).toBe("merge");
    expect(c.cells).toHaveLength(2);
  });

  test("합칠 쌍이 없고 빈칸·번개가 있으면 spawn — 주문이 원하는 체인의 생성기를 가리킴", () => {
    emptyBoard(s);
    s.board[3] = gen("potion");
    s.board[9] = gen("tea");
    const c = coachStep(s)!;
    expect(c.step).toBe("spawn");
    expect(c.cells).toEqual([9]);
  });

  test("완성할 수 있는 주문이 있으면 다른 무엇보다 serve (그 주문 번호)", () => {
    s.board[47] = item("tea", 5);
    s.coins = 999999;
    const c = coachStep(s)!;
    expect(c.step).toBe("serve");
    expect(c.order).toBe(0);
  });

  test("코인이 제1화 비용 이상이면 castle", () => {
    s.coins = getSpotCoinCost(1);
    expect(coachStep(s)!.step).toBe("castle");
  });

  test("보드가 꽉 차고 합칠 쌍이 없으면 stuck (보관·판매 안내), 번개가 없으면 기다리라는 안내", () => {
    emptyBoard(s);
    s.orders = [];
    s.board[0] = gen("potion");
    // 칸마다 (체인, 레벨)이 모두 달라 합칠 쌍이 없는 꽉 찬 보드
    s.board.forEach((c, i) => {
      if (!c) s.board[i] = item((["tea", "herb", "potion", "bakery", "grimoire", "candle", "silk", "gem"] as const)[i % 8], 1 + Math.floor(i / 8));
    });
    const c = coachStep(s)!;
    expect(c.step).toBe("stuck");
    expect(c.text).toContain("보관");
    s.energy = 0;
    s.board[5] = null;
    expect(coachStep(s)!.text).toContain("번개");
  });

  test("제1화를 복구했으면 코치 없음", () => {
    s.rooms[first.id].done = true;
    expect(coachStep(s)).toBeNull();
  });
});

test("v3.7 리뷰: 코치는 주문에 쓰일 재료를 합치라고 하지 않는다 — 다른 쌍이 없으면 생성기", () => {
  const s = createInitialState(fixedCtx());
  emptyBoard(s);
  s.board[3] = gen("tea");
  s.board[0] = item("potion", 2);
  s.board[1] = item("potion", 2, { state: "cobweb" });
  s.orders = [{ ...s.orders[0], reqs: [{ chain: "potion", level: 2 }, { chain: "tea", level: 6 }] }];
  const c = coachStep(s)!;
  expect(c.step).toBe("spawn");
  expect(c.cells).toEqual([3]);
});

test("v3.7.1: 보드에 생성기가 없고 보관함에 있으면 보관함에서 꺼내라고 안내 (꽉 찼다고 하지 않음)", () => {
  const s = createInitialState(fixedCtx());
  emptyBoard(s);
  s.orders = [];
  s.board[0] = item("tea", 1);
  s.bag = [gen("potion")];
  const c = coachStep(s)!;
  expect(c.step).toBe("stuck");
  expect(c.text).toContain("보관함에서");
  expect(c.text).not.toContain("꽉");
});

import { coachFor } from "../../src/views/ui/coach";
test("v3.7.1: coachFor는 같은 상태면 한 번만 계산 (여러 화면이 공유)", () => {
  const s = createInitialState(fixedCtx());
  expect(coachFor(s)).toBe(coachFor(s));
  const t = { ...s };
  expect(coachFor(t)).toEqual(coachFor(s));
});
