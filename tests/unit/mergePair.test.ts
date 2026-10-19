import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { findMergePair, moveOrMerge } from "../../src/core/actions/board";
import type { GameState } from "../../src/core/types";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.7: 막혔을 때 보여 줄 합성 힌트 — 실제로 moveOrMerge가 합치는 쌍만 고른다
describe("findMergePair", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
  });

  test("합칠 것이 없으면 null", () => {
    s.board[0] = item("tea", 1);
    s.board[1] = item("tea", 2);
    s.board[2] = gen("potion", 1);
    expect(findMergePair(s)).toBeNull();
  });

  test("활성 재료 둘을 거미줄·생성기보다 먼저, 같은 순위면 낮은 레벨 먼저", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[2] = item("tea", 2, { state: "cobweb" });
    s.board[3] = item("tea", 2);
    s.board[10] = item("herb", 3);
    s.board[11] = item("herb", 3);
    s.board[20] = item("bakery", 2);
    s.board[21] = item("bakery", 2);
    expect(findMergePair(s)).toEqual([20, 21]);
  });

  test("활성 재료가 짝이 없으면 같은 그림의 거미줄 칸으로 (거미줄이 받는 쪽)", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 1);
    s.board[5] = item("tea", 2, { state: "cobweb" });
    s.board[9] = item("tea", 2);
    expect(findMergePair(s)).toEqual([9, 5]);
  });

  test("거미줄 둘끼리는 합칠 수 없다", () => {
    s.board[5] = item("tea", 2, { state: "cobweb" });
    s.board[6] = item("tea", 2, { state: "cobweb" });
    expect(findMergePair(s)).toBeNull();
  });

  test("재료가 없으면 같은 등급 생성기 (★3은 제외)", () => {
    s.board[0] = gen("potion", 3);
    s.board[1] = gen("potion", 3);
    expect(findMergePair(s)).toBeNull();
    s.board[2] = gen("herb", 1);
    s.board[3] = gen("herb", 1);
    expect(findMergePair(s)).toEqual([2, 3]);
  });

  test("최대 레벨·수집품(코인·번개 조각)·봉인 상자는 제외", () => {
    s.board[0] = item("tea", 8);
    s.board[1] = item("tea", 8);
    s.board[2] = item("coin", 1);
    s.board[3] = item("coin", 1);
    s.board[4] = item("energy", 1);
    s.board[5] = item("energy", 1);
    s.board[6] = item("herb", 1, { state: "crate" });
    s.board[7] = item("herb", 1);
    expect(findMergePair(s)).toBeNull();
  });

  test("새 게임 시작 보드에는 힌트가 있고, 고른 쌍은 실제로 합쳐진다", () => {
    const fresh = createInitialState(fixedCtx());
    const pair = findMergePair(fresh)!;
    expect(pair).not.toBeNull();
    const ev = moveOrMerge(fresh, fixedCtx(), { from: pair[0], to: pair[1] });
    expect(ev.some((e) => e.type === "merged")).toBe(true);
  });
});
