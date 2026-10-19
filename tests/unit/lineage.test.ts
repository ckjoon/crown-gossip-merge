import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { moveOrMerge } from "../../src/core/actions/board";
import { itemLineage } from "../../src/core/codex";
import type { GameState } from "../../src/core/types";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

// v3.11 아이템 계보 화면: 어디서 왔고(생성기·부산물·드롭), 단계마다 어떻게 얻는지, 지금 어디쯤인지
describe("아이템 계보", () => {
  let s: GameState;
  beforeEach(() => {
    s = createInitialState(fixedCtx());
    emptyBoard(s);
    s.bag = [];
    s.codexSeen = {};
  });

  test("생성기 체인: 지금 가진 등급 기준으로 바로 나옴·배속·합성으로만, 못 본 단계는 이름 없음", () => {
    s.board[0] = gen("potion", 2);
    s.codexSeen = { potion: 4 };
    const l = itemLineage(s, "potion", 3);
    expect(l.source).toMatchObject({ kind: "generator", chain: "potion", tier: 2, name: "황금 연금술 가마솥" });
    expect(l.steps.map((x) => x.how)).toEqual(["below", "spawn", "spawn", "boost", "boost", "merge", "merge", "merge"]);
    expect(l.steps[2]).toMatchObject({ level: 3, current: true });
    expect(l.steps[3].name).not.toBeNull();
    expect(l.steps[4].name).toBeNull(); // Lv.5는 아직 못 봄
    expect(l.steps.filter((x) => x.current).length).toBe(1);
  });

  test("생성기가 아직 없으면 ★1 기준", () => {
    const l = itemLineage(s, "tea", 1);
    expect(l.source).toMatchObject({ kind: "generator", chain: "tea", tier: 0 });
    expect(l.steps[0].how).toBe("spawn");
  });

  test("마법 광석은 가마솥 부산물", () => {
    s.board[0] = gen("potion", 1);
    const l = itemLineage(s, "gem", 1);
    expect(l.source).toMatchObject({ kind: "byproduct", chain: "potion" });
  });

  test("번개·코인 조각은 주문·합성 보너스로 나옴", () => {
    expect(itemLineage(s, "energy", 1).source).toMatchObject({ kind: "drop" });
    expect(itemLineage(s, "coin", 2).source).toMatchObject({ kind: "drop" });
  });

  test("열린 주문이 이 재료를 몇 개 원하는지", () => {
    s.orders = [
      { id: "a", customer: { name: "a", face: "x", line: "" }, reqs: [{ chain: "herb", level: 3 }, { chain: "herb", level: 2 }], coins: 1 },
      { id: "b", customer: { name: "a", face: "x", line: "" }, reqs: [{ chain: "herb", level: 3 }], coins: 1 },
    ];
    expect(itemLineage(s, "herb", 3).wanted).toBe(2);
    expect(itemLineage(s, "herb", 4).wanted).toBe(0);
  });
});

// 번개·코인 조각끼리 합쳐도 보너스 조각은 나오지 않음 (조각이 조각을 낳는 건 버그 같음)
test("수집 조각 합성은 보너스 드롭 없음", () => {
  const s = createInitialState(fixedCtx());
  emptyBoard(s);
  s.board[0] = item("energy", 3);
  s.board[1] = item("energy", 3);
  const ev = moveOrMerge(s, fixedCtx([0, 0]), { from: 0, to: 1 });
  expect(ev.find((e) => e.type === "merged")).toBeDefined();
  expect(ev.find((e) => e.type === "bonusDropped")).toBeUndefined();
});
