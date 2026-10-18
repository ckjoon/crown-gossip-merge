import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../../src/core/state";
import { initHolidayBoard, holidaySpawn, holidayMoveOrMerge, holidayClaimMission, holidaySendToMain } from "../../src/core/actions/holiday";
import type { GameState } from "../../src/core/types";
import { fixedCtx } from "./helpers";

let s: GameState;
beforeEach(() => {
  s = createInitialState(fixedCtx());
  initHolidayBoard(s, fixedCtx());
});

describe("명절 이벤트", () => {
  test("초기 보드: 가운데 생성기, 아이템 4개, 목표 Lv.3, 무료 12회", () => {
    expect(s.holiday.board[12]?.isGenerator).toBe(true);
    expect(s.holiday.board.filter((c) => c && !c.isGenerator).length).toBe(4);
    expect(s.holiday).toMatchObject({ targetLv: 3, freeSpawns: 12 });
  });
  test("무료 생성 후 번개 1 소모, 보드 가득이면 거부", () => {
    holidaySpawn(s, fixedCtx([0.5]), undefined);
    expect(s.holiday.freeSpawns).toBe(11);
    s.holiday.freeSpawns = 0;
    const ev = holidaySpawn(s, fixedCtx([0.5]), undefined);
    expect(ev.find((e) => e.type === "holidaySpawned")).toMatchObject({ free: false });
    expect(s.energy).toBe(99);
    s.holiday.board = s.holiday.board.map((c, i) => c ?? { uid: `x${i}`, isGenerator: false, level: 1 });
    expect(holidaySpawn(s, fixedCtx(), undefined)).toEqual([{ type: "rejected", reason: "eventBoardFull" }]);
  });
  test("같은 레벨 합성, 빈칸 이동, 다른 레벨 교체", () => {
    expect(holidayMoveOrMerge(s, fixedCtx(), { from: 6, to: 7 })).toEqual([{ type: "holidayMerged", from: 6, to: 7, level: 2 }]);
    expect(s.holiday.board[7]?.level).toBe(2);
    expect(holidayMoveOrMerge(s, fixedCtx(), { from: 7, to: 0 })).toEqual([{ type: "holidayMoved", from: 7, to: 0 }]);
  });
  test("미션: 번개 없음, 💎5(10회까지), 본게임 재료, 목표 순환", () => {
    s.holiday.board[0] = { uid: "m", isGenerator: false, level: 3 };
    const energy = s.energy;
    const ev = holidayClaimMission(s, fixedCtx(), undefined);
    expect(ev.find((e) => e.type === "holidayMissionCompleted")).toMatchObject({ gems: 5, mainChain: "bakery", mainLv: 3 });
    expect(s.gems).toBe(15);
    expect(s.energy).toBe(energy);
    expect(s.holiday.targetLv).toBe(4);
    expect(s.holiday.freeSpawns).toBe(12);
    s.holiday.completedCount = 10;
    s.holiday.targetLv = 3;
    s.holiday.board[0] = { uid: "m2", isGenerator: false, level: 3 };
    holidayClaimMission(s, fixedCtx(), undefined);
    expect(s.gems).toBe(15);
    expect(holidayClaimMission(s, fixedCtx(), undefined)).toEqual([{ type: "rejected", reason: "missionNotReady" }]);
  });
  test("본게임으로 보내기: 번개 없이 재료만", () => {
    const energy = s.energy;
    const ev = holidaySendToMain(s, fixedCtx(), { cell: 6 });
    expect(ev.find((e) => e.type === "holidaySent")).toMatchObject({ mainChain: "potion", mainLv: 1 });
    expect(s.energy).toBe(energy);
    expect(s.holiday.board[6]).toBeNull();
  });
});
