// holiday.ts — 명절 이벤트 5×5 보드: 생성(무료 횟수 → 번개 1), 합성·이동, 미션(💎는 이벤트당 10회까지, 번개 없음), 본게임으로 보내기

import { newUid, type Ctx } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { getHolidayConfig } from "../rules/holidays";
import { getHolidayMissionReward } from "../rules/progression";
import { BAG_SIZE, EVENT_CELLS, type ChainId, type GameState } from "../types";
import { findNearestEmptyCell } from "./board";

export function initHolidayBoard(s: GameState, _ctx: Ctx): void {
  const b = new Array(EVENT_CELLS).fill(null);
  b[12] = { uid: newUid(s), isGenerator: true, level: 1 };
  b[6] = { uid: newUid(s), isGenerator: false, level: 1 };
  b[7] = { uid: newUid(s), isGenerator: false, level: 1 };
  b[11] = { uid: newUid(s), isGenerator: false, level: 2 };
  b[13] = { uid: newUid(s), isGenerator: false, level: 2 };
  s.holiday.board = b;
  s.holiday.targetLv = 3;
  s.holiday.freeSpawns = 12;
}

function hasMainSpace(s: GameState): boolean {
  return s.board.some((c) => c === null) || s.bag.length < BAG_SIZE;
}

function sendToMainGame(s: GameState, chain: ChainId, level: number): void {
  const it = { uid: newUid(s), state: "active" as const, isGenerator: false, chain, level };
  const cell = findNearestEmptyCell(s, 27, () => 0);
  if (cell !== -1) s.board[cell] = it;
  else s.bag.push(it);
}

export const holidaySpawn: Action<void> = (s, ctx) => {
  const empties: number[] = [];
  s.holiday.board.forEach((it, i) => !it && empties.push(i));
  if (empties.length === 0) return [rejected("eventBoardFull")];
  const ev: GameEvent[] = [];
  const free = s.holiday.freeSpawns > 0;
  if (free) s.holiday.freeSpawns -= 1;
  else if (!spend(s, ev, "energy", 1, "holidaySpawn")) return [rejected("noEnergy")];
  const cell = empties[Math.floor(ctx.rng() * empties.length)];
  const level = ctx.rng() < 0.2 ? 2 : 1;
  s.holiday.board[cell] = { uid: newUid(s), isGenerator: false, level };
  ev.push({ type: "holidaySpawned", cell, level, free });
  return ev;
};

export const holidayMoveOrMerge: Action<{ from: number; to: number }> = (s, _ctx, { from, to }) => {
  const b = s.holiday.board;
  const src = b[from];
  const dst = b[to];
  if (!src || from === to) return [];
  if (!dst) {
    b[to] = src;
    b[from] = null;
    return [{ type: "holidayMoved", from, to }];
  }
  const maxLv = getHolidayConfig(s.holiday.activeHolidayId).items.length;
  if (!src.isGenerator && !dst.isGenerator && src.level === dst.level && src.level < maxLv) {
    b[from] = null;
    b[to] = { uid: newUid(s), isGenerator: false, level: src.level + 1 };
    return [{ type: "holidayMerged", from, to, level: src.level + 1 }];
  }
  b[to] = src;
  b[from] = dst;
  return [{ type: "holidayMoved", from, to }];
};

export const holidayClaimMission: Action<void> = (s) => {
  const h = getHolidayConfig(s.holiday.activeHolidayId);
  const idx = s.holiday.board.findIndex((it) => it && !it.isGenerator && it.level >= s.holiday.targetLv);
  if (idx === -1) return [rejected("missionNotReady")];
  if (!hasMainSpace(s)) return [rejected("boardFull")];
  const it = s.holiday.board[idx]!;
  const meta = h.items[Math.min(it.level - 1, h.items.length - 1)];
  s.holiday.board[idx] = null;
  const ev: GameEvent[] = [];
  const reward = getHolidayMissionReward(s.holiday.completedCount);
  grant(s, ev, "gems", reward.gems, "holidayMission");
  sendToMainGame(s, meta.mainChain, meta.mainLv);
  s.holiday.completedCount += 1;
  s.holiday.targetLv = (s.holiday.completedCount % 3) + 3;
  ev.push({ type: "holidayMissionCompleted", gems: reward.gems, mainChain: meta.mainChain, mainLv: meta.mainLv });
  return ev;
};

export const holidaySendToMain: Action<{ cell: number }> = (s, _ctx, { cell }) => {
  const it = s.holiday.board[cell];
  if (!it || it.isGenerator) return [rejected("nothingSelected")];
  if (!hasMainSpace(s)) return [rejected("boardFull")];
  const h = getHolidayConfig(s.holiday.activeHolidayId);
  const meta = h.items[Math.min(it.level - 1, h.items.length - 1)];
  s.holiday.board[cell] = null;
  sendToMainGame(s, meta.mainChain, meta.mainLv);
  return [{ type: "holidaySent", cell, mainChain: meta.mainChain, mainLv: meta.mainLv }];
};

export const selectHoliday: Action<{ id: string }> = (s, _ctx, { id }) => {
  if (getHolidayConfig(id).id !== id) return [];
  s.holiday.activeHolidayId = id;
  return [];
};
