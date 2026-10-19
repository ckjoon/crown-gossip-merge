import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { moveOrMerge } from "../../src/core/actions/board";
import type { GameState } from "../../src/core/types";
import type { GameEvent } from "../../src/core/events";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.8: 생성기가 진화해 그 체인에 ★1이 하나도 안 남으면 더는 만들 수 없는 Lv.1 재료를 생성기가 흡수
describe("생성기 진화 흡수", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });
  const absorbed = (ev: GameEvent[]) => ev.find((e) => e.type === "absorbed") as Extract<GameEvent, { type: "absorbed" }> | undefined;

  test("마지막 ★1 둘이 ★2가 되면 그 체인 Lv.1(보드·보관함·거미줄)을 흡수하고 개당 Lv.1 판매가 코인을 줌(경험치는 없음), 다른 체인·Lv.2는 그대로", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[10] = item("potion", 1);
    s.board[11] = item("potion", 1, { state: "cobweb" });
    s.board[12] = item("potion", 2);
    s.board[13] = item("tea", 1);
    s.bag = [item("potion", 1), item("herb", 1)];
    const c0 = s.coins;
    const ev = moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    expect(s.board[1]).toMatchObject({ isGenerator: true, chain: "potion", level: 2 });
    const a = absorbed(ev)!;
    expect(a).toMatchObject({ chain: "potion", generator: 1, bag: 1 });
    expect([...a.cells].sort()).toEqual([10, 11]);
    expect(s.board[10]).toBeNull();
    expect(s.board[11]).toBeNull();
    expect(s.board[12]).toMatchObject({ chain: "potion", level: 2 });
    expect(s.board[13]).toMatchObject({ chain: "tea", level: 1 });
    expect(s.bag.map((b) => b.chain)).toEqual(["herb"]);
    expect(s.coins).toBe(c0 + a.coins);
    expect(a.coins).toBe(3); // 3개 × Lv.1 판매가(1)
  });

  test("흡수한 거미줄 칸 옆 봉인 상자는 열림", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[15] = item("potion", 1, { state: "cobweb" });
    s.board[16] = item("tea", 2, { state: "crate" });
    const ev = moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    expect(s.board[16]?.state).toBe("cobweb");
    expect(ev.some((e) => e.type === "cratesOpened" && e.cells.includes(16))).toBe(true);
  });

  test("같은 체인 ★1 생성기가 아직 있으면(보드든 보관함이든) 흡수하지 않음", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[10] = item("potion", 1);
    s.bag = [gen("potion", 1)];
    const ev = moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    expect(absorbed(ev)).toBeUndefined();
    expect(s.board[10]).toMatchObject({ chain: "potion", level: 1 });
  });

  test("흡수할 Lv.1이 없으면 이벤트 없음", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    expect(absorbed(moveOrMerge(s, fixedCtx(), { from: 0, to: 1 }))).toBeUndefined();
  });
});

describe("v3.8 리뷰", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
  });
  test("열린 주문이 요구하는 Lv.1은 남겨 둠 (요구 개수만큼)", () => {
    s.board[0] = gen("herb", 1);
    s.board[1] = gen("herb", 1);
    s.board[10] = item("herb", 1);
    s.board[11] = item("herb", 1);
    s.orders = [{ ...s.orders[0], reqs: [{ chain: "herb", level: 1 }] }];
    moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    expect(s.board.filter((c) => c && !c.isGenerator && c.chain === "herb" && c.level === 1).length).toBe(1);
  });
  test("흡수한 거미줄 옆 상자가 같은 체인 Lv.1 거미줄로 바뀌면 그것도 흡수", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[15] = item("potion", 1, { state: "cobweb" });
    s.board[16] = item("potion", 1, { state: "crate" });
    moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    expect(s.board[16]).toBeNull();
  });
});
