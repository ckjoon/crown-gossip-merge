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

  test("생성기가 아직 없으면 바로 나오는 단계 없음 (합성으로만)", () => {
    const l = itemLineage(s, "tea", 1);
    expect(l.source).toMatchObject({ kind: "generator", chain: "tea", tier: 0 });
    expect(l.steps[0].how).toBe("merge");
  });

  test("마법 광석은 가마솥 부산물 — 등급 단계로 바로, 배속 상한까지는 ⚡배속으로", () => {
    s.board[0] = gen("potion", 1);
    const l = itemLineage(s, "gem", 1);
    expect(l.source).toMatchObject({ kind: "byproduct", chain: "potion" });
    expect(l.steps.map((x) => x.how)).toEqual(["spawn", "boost", "boost", "merge", "merge", "merge", "merge", "merge"].slice(0, l.steps.length));
    s.board[0] = gen("potion", 3);
    expect(itemLineage(s, "gem", 1).steps.map((x) => x.how).slice(0, 7)).toEqual(["below", "below", "spawn", "boost", "boost", "boost", "merge"].slice(0, Math.min(7, l.steps.length)));
  });

  test("생성기가 없는 체인(부산물 포함)은 전부 합성으로만", () => {
    s.board[0] = item("candle", 3);
    expect(new Set(itemLineage(s, "candle", 3).steps.map((x) => x.how))).toEqual(new Set(["merge"]));
    expect(new Set(itemLineage(s, "gem", 2).steps.map((x) => x.how))).toEqual(new Set(["merge"]));
  });

  test("생성기 화면은 고른 생성기 등급 기준", () => {
    s.board[0] = gen("potion", 1);
    s.board[1] = gen("potion", 2);
    expect(itemLineage(s, "potion", 0, 1).steps.slice(0, 3).map((x) => x.how)).toEqual(["spawn", "spawn", "boost"]);
    expect(itemLineage(s, "potion", 0).steps.slice(0, 3).map((x) => x.how)).toEqual(["below", "spawn", "spawn"]);
  });

  test("조합품은 단계끼리 합치지 않고 각자 조합으로", () => {
    expect(itemLineage(s, "combo", 1).source).toMatchObject({ kind: "recipe" });
    expect(new Set(itemLineage(s, "combo", 1).steps.map((x) => x.how))).toEqual(new Set(["recipe"]));
  });

  test("번개 조각은 주문·합성 보너스, 코인 조각은 합성 보너스로만", () => {
    expect(itemLineage(s, "energy", 1).source).toEqual({ kind: "drop", fromOrders: true });
    expect(itemLineage(s, "coin", 2).source).toEqual({ kind: "drop", fromOrders: false });
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
