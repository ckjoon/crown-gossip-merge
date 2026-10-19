import { describe, test, expect } from "vitest";
import v24 from "../fixtures/v2.4-save.json";
import v25 from "../fixtures/v2.5-save.json";
import { restoreState } from "../../src/services/save/restore";
import { encodeBackup, decodeBackup } from "../../src/services/save/backup";
import { createInitialState } from "../../src/core/state";
import { TOTAL_CELLS } from "../../src/core/types";
import { fixedCtx } from "./helpers";
import type { SaveRecord } from "../../src/services/save/repository";

const NOW = 1_800_000_000_000;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe("v2.4 세이브 → v4 (세이브 정리)", () => {
  const { state, report, isNew } = restoreState(clone(v24) as SaveRecord, NOW, fixedCtx());
  test("정리 보고서", () => {
    expect(isNew).toBe(false);
    expect(report).toEqual({ energyTrimmed: 900, gemsFromEnergy: 18, comboRemoved: 3, coinsFromCombo: 140, zonesBackfilled: ["alchemy"], gemsFromZones: 50, freeSpawnsTrimmed: true, coinsFromStars: 400 });
  });
  test("정리 결과 상태", () => {
    expect(state.energy).toBe(100);
    expect(state.gems).toBe(10 + 18 + 50);
    expect(state.coins).toBe(500 + 400 + 140);
    expect(state.board.some((c) => c?.chain === "combo")).toBe(false);
    expect(state.bag.some((c) => c.chain === "combo")).toBe(false);
    expect(state.orders.length).toBe(3);
    expect(state.orders.some((o) => o.reqs.some((r) => r.chain === "combo"))).toBe(false);
    expect(state.orders.every((o) => !("stars" in o))).toBe(true);
    expect(state.holiday.freeSpawns).toBe(12);
    expect(state.holiday.completedCount).toBe(2);
    expect(state.rooms.alc_counter).toEqual({ done: true, styleIdx: 1 });
    expect(state.rooms.gd_pond).toEqual({ done: true, styleIdx: 2 });
    expect(state.rooms.hb_arch).toEqual({ done: false, styleIdx: 0 });
    expect(state.currentThemeKey).toBe("harbor");
    expect(state.settings).toEqual({ sound: true, reduceMotion: false });
    expect(state.playerLv).toBe(4);
    expect(state.board[0]).toMatchObject({ state: "crate", chain: "tea" });
    expect(state.lastSeenVersion).toBe("v2.4.0");
  });
});

describe("v2.5 세이브 → v4", () => {
  const { state, report } = restoreState(clone(v25) as SaveRecord, NOW, fixedCtx());
  test("정리 대상 없음", () => {
    expect(report).toEqual({ energyTrimmed: 0, gemsFromEnergy: 0, comboRemoved: 0, coinsFromCombo: 0, zonesBackfilled: [], gemsFromZones: 0, freeSpawnsTrimmed: false, coinsFromStars: 0 });
  });
  test("값 유지", () => {
    expect(state).toMatchObject({ gems: 13, boostMultiplier: 2, energy: 80, coins: 1234, playerLv: 6, currentThemeKey: "harbor" });
    expect(state.settings.sound).toBe(false);
    expect(state.board[17]).toMatchObject({ isGenerator: true, chain: "potion", level: 2 });
    expect(state.orders[1].reqs).toEqual([{ chain: "bakery", level: 3 }]);
  });
  test("오프라인 10분 경과 → 번개 +2", () => {
    const later = restoreState(clone(v25) as SaveRecord, NOW + 10 * 60 * 1000, fixedCtx()).state;
    expect(later.energy).toBe(82);
  });
});

describe("v4 왕복과 손상 값", () => {
  test("새 게임 저장본은 그대로 복원 (정리 없음)", () => {
    const s = createInitialState(fixedCtx());
    s.orders = [];
    const rec: SaveRecord = { id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) };
    const { state, report } = restoreState(rec, NOW, fixedCtx());
    expect(report).toBeNull();
    expect(state.board).toEqual(s.board);
    expect(state.rooms).toEqual(s.rooms);
    expect(state.uidSeq).toBeGreaterThanOrEqual(s.uidSeq);
    expect(state.orders.length).toBe(3);
  });
  test("손상 값은 안전한 기본값으로", () => {
    const s = createInitialState(fixedCtx()) as unknown as Record<string, unknown>;
    Object.assign(s, { gems: Infinity, coins: -5, boostMultiplier: 3, board: [1, 2, 3], energy: "x", rooms: null, currentThemeKey: "banquet" });
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: s }, NOW, fixedCtx());
    expect(state.gems).toBe(10);
    expect(state.coins).toBe(350);
    expect(state.boostMultiplier).toBe(1);
    expect(state.board.length).toBe(TOTAL_CELLS);
    expect(state.energy).toBe(100);
    expect(Object.keys(state.rooms).length).toBe(30);
    expect(state.currentThemeKey).toBe("alchemy");
  });
  test("필수 생성기가 없으면 빈칸에 보충", () => {
    const s = createInitialState(fixedCtx());
    s.board = s.board.map((c) => (c?.isGenerator && c.chain === "tea" ? null : c));
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) }, NOW, fixedCtx());
    expect(state.board.some((c) => c?.isGenerator && c.chain === "tea")).toBe(true);
  });
  test("기록이 없으면 새 게임", () => {
    const r = restoreState(null, NOW, fixedCtx());
    expect(r.isNew).toBe(true);
    expect(r.state.orders.length).toBe(3);
    expect(r.state.holiday.board[12]?.isGenerator).toBe(true);
  });
});

describe("백업 코드", () => {
  test("v2 형식 백업 코드도 읽고, v4는 왕복", () => {
    const v2code = btoa(encodeURIComponent(JSON.stringify(v24)));
    expect(decodeBackup(v2code)?.schemaVersion).toBe(3);
    const rec: SaveRecord = { id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: { a: 1 } };
    expect(decodeBackup(encodeBackup(rec))).toEqual(rec);
    expect(decodeBackup("not base64 !!")).toBeNull();
  });
});

describe("리뷰 수정: uid 고유성·공짜 생성기·이상한 체인 이름", () => {
  const allUids = (s: ReturnType<typeof restoreState>["state"]) => [
    ...s.board.filter(Boolean).map((c) => c!.uid),
    ...s.bag.map((c) => c.uid),
    ...s.holiday.board.filter(Boolean).map((c) => c!.uid),
    ...s.orders.map((o) => o.id),
  ];
  test("v2 세이브의 중복 uid는 마이그레이션에서 모두 새로 발급", () => {
    const rec = clone(v24) as SaveRecord & { data: { board: Array<{ uid: string } | null> } };
    rec.data.board[24]!.uid = "dup";
    rec.data.board[25]!.uid = "dup";
    const { state } = restoreState(rec, NOW, fixedCtx());
    const uids = allUids(state);
    expect(new Set(uids).size).toBe(uids.length);
  });
  test("v4 기록의 중복 uid도 복원 시 정리", () => {
    const s = createInitialState(fixedCtx());
    s.board[10] = { uid: "same", state: "active", isGenerator: false, chain: "tea", level: 1 };
    s.board[11] = { uid: "same", state: "active", isGenerator: false, chain: "tea", level: 1 };
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) }, NOW, fixedCtx());
    const uids = allUids(state);
    expect(new Set(uids).size).toBe(uids.length);
    expect(state.board[10]?.chain).toBe("tea");
    expect(state.board[11]?.chain).toBe("tea");
  });
  test("보관함에 넣어 둔 생성기가 있으면 새로 지급하지 않음 (공짜 생성기 방지)", () => {
    const s = createInitialState(fixedCtx());
    const idx = s.board.findIndex((c) => c?.isGenerator && c.chain === "herb");
    s.bag.push(s.board[idx]!);
    s.board[idx] = null;
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) }, NOW, fixedCtx());
    const herbGens = [...state.board, ...state.bag].filter((c) => c?.isGenerator && c.chain === "herb").length;
    expect(herbGens).toBe(1);
  });
  test("자동 지급 생성기 uid도 고유", () => {
    const s = createInitialState(fixedCtx());
    s.board = s.board.map((c) => (c?.isGenerator ? null : c));
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) }, NOW, fixedCtx());
    const uids = allUids(state);
    expect(new Set(uids).size).toBe(uids.length);
  });
  test("상속 키 이름의 체인(constructor 등)은 버리고 오류 없이 복원", () => {
    const s = createInitialState(fixedCtx()) as unknown as { board: unknown[] };
    s.board[30] = { uid: "x", state: "active", isGenerator: false, chain: "constructor", level: 2 };
    const { state } = restoreState({ id: "main_save_v1", schemaVersion: 4, updatedAt: NOW, data: clone(s) }, NOW, fixedCtx());
    expect(state.board[30]).toBeNull();
  });
});
