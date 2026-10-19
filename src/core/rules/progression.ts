// progression.ts — 구역 진행·주문 상한·생성기 배출·배속 부스트·재화 환산 같은 순수 게임 규칙 모음 (v2.5 progression.js 이전)

import { ZONE_REQUIRED_LEVEL } from "./levels";

export type ZoneKey = "alchemy" | "harbor" | "garden" | "banquet";
export type Boost = 1 | 2 | 4;

// 마녀의 성 구역 순서 (세이브 호환을 위해 기존 키 유지)
export const ZONE_ORDER: ZoneKey[] = ["alchemy", "harbor", "garden", "banquet"];
// 구역별 손님 주문 요구 레벨 상한
export const ORDER_LEVEL_CAP: Record<ZoneKey, number> = { alchemy: 4, harbor: 5, garden: 6, banquet: 8 };
// 장소 복구 비용 = spot.cost × 구역 단가(🪙)
export const ZONE_COIN_UNIT: Record<ZoneKey, number> = { alchemy: 150, harbor: 300, garden: 600, banquet: 1200 };
// 생성기 등급(★)별 한 번에 나오게 할 수 있는 최대 재료 레벨
export const GENERATOR_TIER_CAP: Record<number, number> = { 1: 3, 2: 5, 3: 6 };
// 배속별 추가 단계 (×2 = +1단계, ×4 = +2단계)
export const BOOST_STEPS: Record<Boost, number> = { 1: 0, 2: 1, 4: 2 };
export const BOOST_CYCLE: Boost[] = [1, 2, 4];
export const LEGACY_STAR_TO_COINS = 100;

export const GEM_REWARDS = { holidayMission: 5, zoneComplete: 50, levelUp: 3 } as const;
export const GEM_SHOP_ENERGY: ReadonlyArray<{ gems: number; energy: number }> = [
  { gems: 10, energy: 50 },
  { gems: 25, energy: 150 },
];
export const STARTING_GEMS = 10;
// 명절 이벤트 미션: 번개는 주지 않고(무한 번개 방지), 💎는 이벤트당 앞 10회 미션까지만 지급
export const HOLIDAY_MISSION_GEM_CAP = 10;

export interface ZoneProgress {
  currentZoneKey: ZoneKey;
  accessibleKeys: ZoneKey[];
  completedKeys: ZoneKey[];
  nextSpotId: string | null;
  nextSpotLockedLv: number | null; // 다음 이야기 장소의 구역이 레벨로 잠겨 있으면 필요 레벨
  chapterById: Record<string, number>;
  totalChapters: number;
}

// rooms: [{ key, spots: [{ id, done }] }] (ZONE_ORDER 순서). playerLv가 구역 입장 레벨(levels.ts)에 못 미치면
// 아직 손대지 않은 그 구역은 잠긴다 (이미 진행한 구역은 레벨과 상관없이 열림 — 세이브 호환)
export function computeZoneProgress(rooms: Array<{ key: string; spots: Array<{ id: string; done: boolean }> }>, playerLv = Infinity): ZoneProgress {
  const completedKeys: ZoneKey[] = [];
  const accessibleKeys: ZoneKey[] = [];
  const chapterById: Record<string, number> = {};
  let currentZoneKey: ZoneKey | null = null;
  let nextSpotId: string | null = null;
  let nextSpotLockedLv: number | null = null;
  let chapter = 0;
  let blocked = false; // 앞 구역이 레벨로 잠겨 그 뒤로는 새로 열리지 않음

  for (const room of rooms) {
    const key = room.key as ZoneKey;
    const allDone = room.spots.length > 0 && room.spots.every((s) => s.done);
    const anyDone = room.spots.some((s) => s.done);
    const lvOk = anyDone || playerLv >= (ZONE_REQUIRED_LEVEL[key] ?? 1);
    for (const s of room.spots) {
      chapter++;
      chapterById[s.id] = chapter;
      if (!s.done && nextSpotId === null) {
        nextSpotId = s.id;
        if (!lvOk) nextSpotLockedLv = ZONE_REQUIRED_LEVEL[key];
      }
    }
    if (allDone) completedKeys.push(key);
    if (!lvOk && !allDone) blocked = true;
    if (!allDone && currentZoneKey === null && !blocked) currentZoneKey = key;
    // 현재 구역까지는 모두 입장 가능, 그 뒤는 이미 진행한 장소가 있는 구역만 (v2.4.0 세이브 호환)
    if (anyDone || (!blocked && (currentZoneKey === null || currentZoneKey === key))) {
      accessibleKeys.push(key);
    }
  }

  if (currentZoneKey === null) {
    // 모두 완성했거나 다음 구역이 레벨로 잠김 → 마지막으로 입장 가능한 구역
    currentZoneKey = accessibleKeys.length > 0 ? accessibleKeys[accessibleKeys.length - 1] : ZONE_ORDER[0];
  }
  return { currentZoneKey, accessibleKeys, completedKeys, nextSpotId, nextSpotLockedLv, chapterById, totalChapters: chapter };
}

export function getNextZoneKey(zoneKey: ZoneKey): ZoneKey | null {
  const i = ZONE_ORDER.indexOf(zoneKey);
  return i >= 0 && i < ZONE_ORDER.length - 1 ? ZONE_ORDER[i + 1] : null;
}

export function getOrderLevelCap(zoneKey: string): number {
  return ORDER_LEVEL_CAP[zoneKey as ZoneKey] || ORDER_LEVEL_CAP.alchemy;
}

export function getSpotCoinCost(zoneKey: string, baseCost: number): number {
  return Math.max(1, Math.floor(baseCost || 1)) * (ZONE_COIN_UNIT[zoneKey as ZoneKey] || ZONE_COIN_UNIT.alchemy);
}

// 체인·레벨은 랜덤, 상한만 구역이 결정 (첫 요구 Lv.2~상한, 55% 확률로 한 단계 낮은 두 번째 요구)
export function rollOrderReqs<C extends string>(zoneKey: string, coreChains: readonly C[], rng: () => number = Math.random): Array<{ chain: C; level: number }> {
  const cap = getOrderLevelCap(zoneKey);
  const pick = () => coreChains[Math.min(coreChains.length - 1, Math.floor(rng() * coreChains.length))];
  const lv1 = Math.min(cap, 2 + Math.floor(rng() * (cap - 1)));
  const reqs = [{ chain: pick(), level: lv1 }];
  if (rng() < 0.55) {
    reqs.push({ chain: pick(), level: Math.max(1, lv1 - 1) });
  }
  return reqs;
}

function clampTier(tier: number): number {
  return Math.min(3, Math.max(1, Math.floor(tier) || 1));
}

export function getGeneratorTierCap(tier: number): number {
  return GENERATOR_TIER_CAP[clampTier(tier)];
}

// 등급별 기본 배출 (rare=true면 부산물 체인)
export function rollBaseSpawn(tier: number, rareChance: number, rng: () => number = Math.random): { rare: boolean; level: number } {
  const t = clampTier(tier);
  const hasRare = rareChance > 0;
  if (t === 1) {
    if (hasRare && rng() < rareChance) return { rare: true, level: 1 };
    return { rare: false, level: rng() < 0.18 ? 2 : 1 };
  }
  if (t === 2) {
    if (hasRare && rng() < 0.2) return { rare: true, level: 2 };
    return { rare: false, level: rng() < 0.35 ? 3 : 2 };
  }
  if (hasRare && rng() < 0.22) return { rare: true, level: 3 };
  const r = rng();
  return { rare: false, level: r < 0.3 ? 4 : r < 0.79 ? 3 : 2 };
}

export function sanitizeBoost(b: unknown): Boost {
  return BOOST_CYCLE.includes(b as Boost) ? (b as Boost) : 1;
}

export function nextBoost(b: unknown): Boost {
  const i = BOOST_CYCLE.indexOf(sanitizeBoost(b));
  return BOOST_CYCLE[(i + 1) % BOOST_CYCLE.length];
}

// 배속 적용: 등급 상한과 번개 잔량에 맞춰 실제로 올릴 단계(steps)와 번개 소모(2^steps)를 계산. 번개가 1 미만이면 null
export function resolveBoost(baseLevel: number, boost: unknown, cap: number, energy: number): { level: number; steps: number; cost: number } | null {
  if (!(energy >= 1)) return null;
  const want = BOOST_STEPS[sanitizeBoost(boost)];
  let steps = Math.max(0, Math.min(want, cap - baseLevel));
  while (steps > 0 && Math.pow(2, steps) > energy) steps--;
  return { level: baseLevel + steps, steps, cost: Math.pow(2, steps) };
}

// completedBefore: 이번 미션 이전까지 완료한 미션 수
export function getHolidayMissionReward(completedBefore: number): { energy: number; gems: number; freeSpawns: number } {
  const gems = completedBefore < HOLIDAY_MISSION_GEM_CAP ? GEM_REWARDS.holidayMission : 0;
  return { energy: 0, gems, freeSpawns: 0 };
}

export function getItemGemPrice(level: number): number {
  return Math.max(1, Math.floor(level) || 1) * 2;
}

export function convertLegacyStars(stars: unknown): number {
  return typeof stars === "number" && stars > 0 ? Math.floor(stars) * LEGACY_STAR_TO_COINS : 0;
}
