import { test, expect } from "vitest";
import { createInitialState } from "../../src/core/state";
import { newUid } from "../../src/core/ctx";
import { COLS, ROWS } from "../../src/core/types";
import { fixedCtx } from "./helpers";

test("v2.5와 같은 초기값", () => {
  const s = createInitialState(fixedCtx());
  expect(s).toMatchObject({ playerLv: 1, xp: 0, energy: 100, energyCountdown: 300, coins: 350, gems: 10, boostMultiplier: 1, currentThemeKey: "alchemy", lastSeenVersion: null });
  expect(s.settings).toEqual({ sound: true, reduceMotion: false });
  expect(s.holiday).toMatchObject({ activeHolidayId: "halloween", targetLv: 3, freeSpawns: 12, completedCount: 0 });
  expect(s.orders).toEqual([]);
  expect(Object.keys(s.rooms).length).toBe(20);
  expect(Object.values(s.rooms).every((r) => !r.done && r.styleIdx === 0)).toBe(true);
});

test("초기 보드: 바깥 테두리 상자, 안쪽 고리 거미줄, 생성기 6개와 시작 재료 4개", () => {
  const s = createInitialState(fixedCtx());
  const at = (r: number, c: number) => s.board[r * COLS + c];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const outer = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
    if (outer) expect(at(r, c)?.state).toBe("crate");
  }
  expect(at(1, 1)?.state).toBe("cobweb");
  expect(s.board.filter((c) => c?.isGenerator).map((c) => c!.chain).sort()).toEqual(["bakery", "grimoire", "herb", "potion", "potion", "tea"]);
  expect(at(2, 2)).toMatchObject({ isGenerator: true, chain: "potion", level: 1, state: "active" });
  expect(at(4, 4)).toMatchObject({ isGenerator: false, chain: "tea", level: 3, state: "active" });
  expect(new Set(s.board.filter(Boolean).map((c) => c!.uid)).size).toBe(s.board.filter(Boolean).length);
});

test("newUid는 상태의 순번으로 고유 id 생성", () => {
  const s = createInitialState(fixedCtx());
  const a = newUid(s);
  const b = newUid(s);
  expect(a).not.toBe(b);
  expect(a.startsWith("u")).toBe(true);
});
