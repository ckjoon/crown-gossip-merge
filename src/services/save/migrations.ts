// migrations.ts — v2(schemaVersion 3 이하) 기록 → v4 상태 + 한 번만 하는 세이브 정리
// 정리: 번개 100 초과분(50개당 💎1, 최대 💎30), 레거시 조합품 → 🪙, v2.4에서 완성한 구역 💎50 소급, 이벤트 무료 생성 12회로, 별 → 🪙

import type { Ctx } from "../../core/ctx";
import { getZoneProgress } from "../../core/actions/orders";
import { CHAINS } from "../../core/rules/chains";
import { convertLegacyStars, GEM_REWARDS, sanitizeBoost } from "../../core/rules/progression";
import { ENERGY_REGEN_SEC, NATURAL_ENERGY_CAP, type GameState, type ZoneKey } from "../../core/types";
import {
  applyOfflineEnergy,
  asObj,
  ensureGenerators,
  fixCurrentTheme,
  fixUidSeq,
  newGame,
  num,
  reassignAllUids,
  regenerateComboOrders,
  restoreBag,
  restoreBoard,
  restoreHoliday,
  restoreOrders,
} from "./restore";

export interface MigrationReport {
  energyTrimmed: number;
  gemsFromEnergy: number;
  comboRemoved: number;
  coinsFromCombo: number;
  zonesBackfilled: ZoneKey[];
  gemsFromZones: number;
  freeSpawnsTrimmed: boolean;
  coinsFromStars: number;
}

const MAX_GEMS_FROM_ENERGY = 30;
const ENERGY_PER_GEM = 50;
const HOLIDAY_FREE_SPAWN_CAP = 12;

function comboSell(level: number): number {
  const items = CHAINS.combo.items;
  return items[Math.min(Math.max(1, level), items.length) - 1].sell ?? 0;
}

export function migrateV2ToV4(data: Record<string, unknown>, updatedAt: number, now: number, ctx: Ctx): { state: GameState; report: MigrationReport } {
  const s = newGame(ctx);
  const report: MigrationReport = {
    energyTrimmed: 0,
    gemsFromEnergy: 0,
    comboRemoved: 0,
    coinsFromCombo: 0,
    zonesBackfilled: [],
    gemsFromZones: 0,
    freeSpawnsTrimmed: false,
    coinsFromStars: 0,
  };

  // 1. v2 필드 복원 (v2.5 mergeWithDefaultState 규칙)
  s.playerLv = num(data.playerLv, 1, 1);
  s.xp = num(data.xp, 0);
  s.coins = num(data.coins, s.coins);
  const isV25 = typeof data.gems === "number";
  s.gems = num(data.gems, s.gems);
  s.energy = num(data.energy, s.energy);
  const cd = num(data.energyCountdown, ENERGY_REGEN_SEC, 1);
  s.energyCountdown = cd <= ENERGY_REGEN_SEC ? cd : ENERGY_REGEN_SEC;
  applyOfflineEnergy(s, updatedAt, now);

  restoreBoard(s, data.board, now);
  restoreBag(s, data.bag, now);
  fixUidSeq(s, 0);
  reassignAllUids(s);
  ensureGenerators(s);
  // v2.4: 가마솥이 1개뿐이고 아직 보조 가마솥을 받지 않았다면 지급
  const cauldrons = s.board.filter((it) => it && it.isGenerator && it.chain === "potion");
  if (cauldrons.length === 1 && cauldrons[0]!.level < 2 && !data.cauldronPartGranted) {
    const empty = s.board.findIndex((it) => it === null);
    if (empty !== -1) s.board[empty] = { uid: `gen_bonus_potion_${now}`, state: "active", isGenerator: true, chain: "potion", level: 1 };
  }
  s.cauldronPartGranted = true;

  restoreOrders(s, data.orders);
  restoreHoliday(s, data.eventState);
  reassignAllUids(s);

  const rooms = asObj(data.interiorRooms);
  if (rooms) {
    for (const zone of Object.values(rooms)) {
      const z = asObj(zone);
      if (!z) continue;
      for (const [spotId, v] of Object.entries(z)) {
        const o = asObj(v);
        if (o && s.rooms[spotId]) s.rooms[spotId] = { done: !!o.done, styleIdx: Math.min(2, num(o.styleIdx, 0)) };
      }
    }
  }
  // 구역 완성 보상 생성기(v3.8)는 복구 기록을 읽은 뒤에야 알 수 있으므로 한 번 더
  ensureGenerators(s);
  s.boostMultiplier = sanitizeBoost(data.boostMultiplier);
  s.settings = { sound: data.soundEnabled !== false, reduceMotion: false };
  s.lastSeenVersion = typeof data.lastSeenVersion === "string" ? data.lastSeenVersion : null;

  // 2. 세이브 정리 (한 번만)
  report.coinsFromStars = convertLegacyStars(data.stars);
  s.coins += report.coinsFromStars;

  if (s.energy > NATURAL_ENERGY_CAP) {
    report.energyTrimmed = s.energy - NATURAL_ENERGY_CAP;
    report.gemsFromEnergy = Math.min(MAX_GEMS_FROM_ENERGY, Math.floor(report.energyTrimmed / ENERGY_PER_GEM));
    s.energy = NATURAL_ENERGY_CAP;
    s.energyCountdown = ENERGY_REGEN_SEC;
    s.gems += report.gemsFromEnergy;
  }

  s.board = s.board.map((c) => {
    if (c && c.chain === "combo") {
      report.comboRemoved += 1;
      report.coinsFromCombo += comboSell(c.level);
      return null;
    }
    return c;
  });
  s.bag = s.bag.filter((c) => {
    if (c.chain !== "combo") return true;
    report.comboRemoved += 1;
    report.coinsFromCombo += comboSell(c.level);
    return false;
  });
  s.coins += report.coinsFromCombo;
  regenerateComboOrders(s, ctx);

  // v2.4 세이브(보석 필드 없음)는 이미 완성한 구역의 💎 보상을 받은 적이 없다
  if (!isV25) {
    report.zonesBackfilled = [...getZoneProgress(s).completedKeys];
    report.gemsFromZones = report.zonesBackfilled.length * GEM_REWARDS.zoneComplete;
    s.gems += report.gemsFromZones;
  }

  if (s.holiday.freeSpawns > HOLIDAY_FREE_SPAWN_CAP) {
    s.holiday.freeSpawns = HOLIDAY_FREE_SPAWN_CAP;
    report.freeSpawnsTrimmed = true;
  }

  fixCurrentTheme(s, data.currentThemeKey);
  return { state: s, report };
}
