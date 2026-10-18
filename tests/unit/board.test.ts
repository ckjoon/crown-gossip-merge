import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { spawnFromGenerator, moveOrMerge, collectItem, unlockCobweb, sortBoard, storeToBag, retrieveFromBag, sellItem, findNearestEmptyCell } from "../../src/core/actions/board";
import { gainXP } from "../../src/core/actions/progress";
import type { GameState } from "../../src/core/types";
import type { GameEvent } from "../../src/core/events";
import { fixedCtx, item, gen, emptyBoard } from "./helpers";

let s: GameState;
beforeEach(() => {
  s = createInitialState(fixedCtx());
  emptyBoard(s);
});
const types = (ev: GameEvent[]) => ev.map((e) => e.type);

describe("생성기", () => {
  test("★1 ×1: Lv.1, 번개 −1, 가장 가까운 빈칸", () => {
    s.board[10] = gen("potion", 1);
    const ev = spawnFromGenerator(s, fixedCtx([0.9, 0.9]), { cell: 10 });
    expect(types(ev)).toEqual(["currencyChanged", "spawned"]);
    const sp = ev.find((e) => e.type === "spawned")!;
    if (sp.type !== "spawned") throw 0;
    expect(sp.item).toMatchObject({ chain: "potion", level: 1, state: "active", isGenerator: false });
    expect(s.energy).toBe(99);
    expect([3, 9, 11, 17]).toContain(sp.to);
  });
  test("★1 ×4: 상한 Lv.3, 번개 −4", () => {
    s.board[10] = gen("grimoire", 1);
    s.boostMultiplier = 4;
    const ev = spawnFromGenerator(s, fixedCtx([0.9]), { cell: 10 });
    const sp = ev.find((e) => e.type === "spawned")!;
    if (sp.type !== "spawned") throw 0;
    expect(sp.item.level).toBe(3);
    expect(sp.boostSteps).toBe(2);
    expect(s.energy).toBe(96);
  });
  test("가마솥 부산물은 마법 광석(gem)", () => {
    s.board[10] = gen("potion", 1);
    const ev = spawnFromGenerator(s, fixedCtx([0.1]), { cell: 10 });
    const sp = ev.find((e) => e.type === "spawned")!;
    if (sp.type !== "spawned") throw 0;
    expect(sp.item.chain).toBe("gem");
  });
  test("번개 0이면 거부, 보드가 가득이면 번개 그대로 거부", () => {
    s.board[10] = gen("tea", 1);
    s.energy = 0;
    expect(spawnFromGenerator(s, fixedCtx(), { cell: 10 })).toEqual([{ type: "rejected", reason: "noEnergy", cell: 10 }]);
    s.energy = 5;
    s.board = s.board.map((c, i) => (i === 10 ? c : item("tea", 1)));
    expect(spawnFromGenerator(s, fixedCtx(), { cell: 10 })).toEqual([{ type: "rejected", reason: "boardFull", cell: 10 }]);
    expect(s.energy).toBe(5);
  });
});

describe("이동·합성", () => {
  test("빈칸 이동, 활성 아이템과 교체", () => {
    s.board[0] = item("tea", 1);
    expect(types(moveOrMerge(s, fixedCtx(), { from: 0, to: 5 }))).toEqual(["moved"]);
    expect(s.board[5]?.chain).toBe("tea");
    s.board[6] = item("herb", 2);
    const ev = moveOrMerge(s, fixedCtx(), { from: 5, to: 6 });
    expect(ev).toEqual([{ type: "moved", from: 5, to: 6, swapped: true }]);
    expect(s.board[5]?.chain).toBe("herb");
  });
  test("같은 재료 합성: 레벨 +1, XP +5", () => {
    s.board[0] = item("potion", 2);
    s.board[1] = item("potion", 2);
    const ev = moveOrMerge(s, fixedCtx([0.9]), { from: 0, to: 1 });
    expect(types(ev)).toContain("merged");
    expect(s.board[0]).toBeNull();
    expect(s.board[1]).toMatchObject({ chain: "potion", level: 3 });
    expect(s.xp).toBe(5);
  });
  test("최대 레벨·레거시 조합품은 합성 안 되고 교체", () => {
    s.board[0] = item("tea", 8);
    s.board[1] = item("tea", 8);
    expect(types(moveOrMerge(s, fixedCtx(), { from: 0, to: 1 }))).toEqual(["moved"]);
    s.board[2] = item("combo", 1);
    s.board[3] = item("combo", 1);
    expect(types(moveOrMerge(s, fixedCtx(), { from: 2, to: 3 }))).toEqual(["moved"]);
  });
  test("생성기 진화 ★1+★1 → ★2 (XP 25), ★3끼리는 교체", () => {
    s.board[0] = gen("herb", 1);
    s.board[1] = gen("herb", 1);
    const ev = moveOrMerge(s, fixedCtx(), { from: 0, to: 1 });
    const m = ev.find((e) => e.type === "merged");
    expect(m && m.type === "merged" && m.generatorEvolved).toBe(true);
    expect(s.board[1]).toMatchObject({ isGenerator: true, level: 2 });
    expect(s.xp).toBe(25);
    s.board[2] = gen("tea", 3);
    s.board[3] = gen("tea", 3);
    expect(types(moveOrMerge(s, fixedCtx(), { from: 2, to: 3 }))).toEqual(["moved"]);
  });
  test("거미줄 위 같은 재료 합성 → 활성화 + 주변 상자가 거미줄로", () => {
    s.board[8] = item("bakery", 1, { state: "cobweb" });
    s.board[1] = item("tea", 2, { state: "crate" });
    s.board[20] = item("bakery", 1);
    const ev = moveOrMerge(s, fixedCtx([0.9]), { from: 20, to: 8 });
    expect(types(ev)).toEqual(expect.arrayContaining(["merged", "cratesOpened"]));
    expect(s.board[8]).toMatchObject({ state: "active", level: 2 });
    expect(s.board[1]?.state).toBe("cobweb");
  });
  test("상자로 드래그 거부, 다른 재료를 거미줄로 드래그 거부, 상자·거미줄은 집을 수 없음", () => {
    s.board[0] = item("tea", 1, { state: "crate" });
    s.board[1] = item("tea", 1);
    s.board[2] = item("herb", 1, { state: "cobweb" });
    expect(moveOrMerge(s, fixedCtx(), { from: 1, to: 0 })).toEqual([{ type: "rejected", reason: "crateLocked", cell: 0 }]);
    expect(moveOrMerge(s, fixedCtx(), { from: 1, to: 2 })).toEqual([{ type: "rejected", reason: "cannotMerge", cell: 2 }]);
    expect(moveOrMerge(s, fixedCtx(), { from: 2, to: 5 })).toEqual([]);
    expect(moveOrMerge(s, fixedCtx(), { from: 1, to: 1 })).toEqual([]);
  });
  test("Lv.4 결과 합성은 12% 확률로 보너스 드롭", () => {
    s.board[0] = item("potion", 3);
    s.board[1] = item("potion", 3);
    const ev = moveOrMerge(s, fixedCtx([0.05, 0.2]), { from: 0, to: 1 });
    expect(types(ev)).toContain("bonusDropped");
    const b = ev.find((e) => e.type === "bonusDropped");
    expect(b && b.type === "bonusDropped" && b.item.chain).toBe("energy");
  });
});

describe("수집·거미줄·정렬·보관함·판매", () => {
  test("코인·번개 수집", () => {
    s.board[4] = item("coin", 2);
    expect(types(collectItem(s, fixedCtx(), { cell: 4 }))).toEqual(["currencyChanged", "collected"]);
    expect(s.coins).toBe(395);
    expect(s.board[4]).toBeNull();
    s.board[5] = item("tea", 1);
    expect(collectItem(s, fixedCtx(), { cell: 5 })).toEqual([]);
  });
  test("거미줄 해제 20🪙: 선택 칸 우선, 없으면 첫 거미줄, 코인 부족 거부", () => {
    s.board[9] = item("tea", 1, { state: "cobweb" });
    s.board[12] = item("tea", 1, { state: "cobweb" });
    unlockCobweb(s, fixedCtx(), { preferred: 12 });
    expect(s.board[12]?.state).toBe("active");
    expect(s.coins).toBe(330);
    unlockCobweb(s, fixedCtx(), { preferred: null });
    expect(s.board[9]?.state).toBe("active");
    expect(unlockCobweb(s, fixedCtx(), { preferred: null })).toEqual([{ type: "rejected", reason: "noCobweb" }]);
    s.coins = 10;
    s.board[13] = item("tea", 1, { state: "cobweb" });
    expect(unlockCobweb(s, fixedCtx(), { preferred: null })).toEqual([{ type: "rejected", reason: "notEnoughCoins" }]);
  });
  test("정렬: 생성기·상자·거미줄은 고정, 재료는 체인 이름순·레벨 내림차순", () => {
    s.board[0] = gen("tea", 1);
    s.board[1] = item("tea", 1);
    s.board[2] = item("herb", 3, { state: "crate" });
    s.board[3] = item("bakery", 1);
    s.board[4] = item("bakery", 3);
    sortBoard(s, fixedCtx(), undefined);
    expect(s.board[0]?.isGenerator).toBe(true);
    expect(s.board[2]?.state).toBe("crate");
    expect([s.board[1], s.board[3], s.board[4]].map((c) => `${c?.chain}${c?.level}`)).toEqual(["bakery3", "bakery1", "tea1"]);
  });
  test("보관함: 6칸까지, 꺼내기는 칸 27 근처", () => {
    for (let i = 0; i < 7; i++) s.board[i] = item("tea", 1);
    for (let i = 0; i < 6; i++) storeToBag(s, fixedCtx(), { cell: i });
    expect(s.bag.length).toBe(6);
    expect(storeToBag(s, fixedCtx(), { cell: 6 })).toEqual([{ type: "rejected", reason: "bagFull", cell: 6 }]);
    const ev = retrieveFromBag(s, fixedCtx(), { bagIdx: 0 });
    expect(ev).toEqual([{ type: "bagRetrieved", to: 27, bagIdx: 0 }]);
    expect(s.bag.length).toBe(5);
  });
  test("판매는 판매가만큼 코인, 생성기는 판매 불가", () => {
    s.board[3] = item("potion", 4);
    sellItem(s, fixedCtx(), { cell: 3 });
    expect(s.coins).toBe(378);
    s.board[4] = gen("potion");
    expect(sellItem(s, fixedCtx(), { cell: 4 })).toEqual([]);
  });
  test("findNearestEmptyCell: 거리순, 가득 차면 −1", () => {
    expect(findNearestEmptyCell(s, 27, () => 0)).toBe(27);
    s.board[27] = item("tea", 1);
    expect([20, 26, 28, 34]).toContain(findNearestEmptyCell(s, 27, () => 0));
    s.board = s.board.map(() => item("tea", 1));
    expect(findNearestEmptyCell(s, 27, () => 0)).toBe(-1);
  });
});

describe("레벨업", () => {
  test("XP가 넘치면 레벨+1, 이월, 💎3 · 번개 10 · 코인 40×lv · 생성기 파츠", () => {
    const ev: GameEvent[] = [];
    gainXP(s, ev, 60);
    expect(s.playerLv).toBe(2);
    expect(s.xp).toBe(10);
    expect(s.gems).toBe(13);
    expect(s.energy).toBe(110);
    expect(s.coins).toBe(430);
    expect(ev.find((e) => e.type === "levelUp")).toMatchObject({ level: 2, coins: 80, energy: 10, gems: 3, genChain: "potion" });
    expect(ev.find((e) => e.type === "generatorPartGranted")).toMatchObject({ chain: "potion", where: "board" });
  });
});

import { getMergeTargets } from "../../src/core/actions/board";

describe("드래그 힌트", () => {
  test("같은 재료(거미줄 포함)와 같은 등급 생성기만 합성 대상", () => {
    s.board[0] = item("tea", 2);
    s.board[1] = item("tea", 2);
    s.board[2] = item("tea", 2, { state: "cobweb" });
    s.board[3] = item("tea", 2, { state: "crate" });
    s.board[4] = item("tea", 3);
    s.board[5] = gen("tea", 1);
    s.board[6] = gen("tea", 1);
    s.board[7] = gen("tea", 3);
    s.board[8] = gen("tea", 3);
    s.board[9] = item("tea", 8);
    s.board[10] = item("tea", 8);
    expect(getMergeTargets(s, 0)).toEqual([1, 2]);
    expect(getMergeTargets(s, 5)).toEqual([6]);
    expect(getMergeTargets(s, 7)).toEqual([]);
    expect(getMergeTargets(s, 9)).toEqual([]);
    expect(getMergeTargets(s, 3)).toEqual([]);
  });
});
