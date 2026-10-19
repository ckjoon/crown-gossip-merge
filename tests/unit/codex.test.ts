import { describe, test, expect } from "vitest";
import { createInitialState } from "../../src/core/state";
import { createStore } from "../../src/core/store";
import { moveOrMerge } from "../../src/core/actions/board";
import { itemSeen, generatorSeen } from "../../src/core/codex";
import { restoreState } from "../../src/services/save/restore";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.9 도감 발견: 보드·보관함에 보인 단계까지만 공개, 봉인 상자 속은 비밀
describe("도감 발견 기록", () => {
  test("새 게임은 시작 보드에 보이는 재료만 발견(봉인 상자 속 제외)", () => {
    const s = createInitialState(fixedCtx());
    const visible = s.board.filter((c) => c && !c.isGenerator && c.state !== "crate");
    for (const c of visible) expect(itemSeen(s, c!.chain, c!.level)).toBe(true);
    expect(itemSeen(s, "potion", 6)).toBe(false);
  });

  test("합성으로 새 단계가 나오면 store가 기록, 내려가지는 않음", () => {
    const s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.codexSeen = { tea: 2 };
    s.board[0] = item("tea", 4);
    s.board[1] = item("tea", 4);
    s.board[2] = item("tea", 1, { state: "crate" });
    const store = createStore(s, fixedCtx());
    store.dispatch(moveOrMerge, { from: 0, to: 1 });
    expect(store.get().codexSeen.tea).toBe(5);
    expect(itemSeen(store.get(), "tea", 3)).toBe(true);
  });

  test("생성기 발견 등급 = 가진 최고 등급", () => {
    const s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [gen("herb", 2)];
    s.board[3] = gen("herb", 1);
    expect(generatorSeen(s, "herb")).toBe(2);
    expect(generatorSeen(s, "silk")).toBe(0);
  });

  test("저장·불러오기 왕복, 이상한 값은 버림", () => {
    const s = createInitialState(fixedCtx());
    s.codexSeen = { potion: 7, tea: 3 };
    const data = JSON.parse(JSON.stringify(s));
    data.codexSeen.bogus = 4;
    data.codexSeen.herb = "x";
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: 1_800_000_000_000, data }, 1_800_000_000_000, fixedCtx());
    expect(state.codexSeen.potion).toBe(7);
    expect(state.codexSeen.tea).toBeGreaterThanOrEqual(3);
    expect("bogus" in state.codexSeen).toBe(false);
  });

  test("기록이 없는 예전 세이브는 보드·보관함으로 채움", () => {
    const s = createInitialState(fixedCtx());
    emptyBoard(s);
    for (const [i, c] of (["potion", "grimoire", "herb", "bakery", "tea"] as const).entries()) s.board[i] = gen(c, 1);
    s.board[9] = item("bakery", 6);
    const data = JSON.parse(JSON.stringify(s));
    delete data.codexSeen;
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: 1_800_000_000_000, data }, 1_800_000_000_000, fixedCtx());
    expect(state.codexSeen.bakery).toBe(6);
  });
});
