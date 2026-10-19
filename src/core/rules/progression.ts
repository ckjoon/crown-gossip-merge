// progression.ts — 구역 진행·주문 상한·생성기 배출·배속 부스트·재화 환산 같은 순수 게임 규칙 모음 (v2.5 progression.js 이전)

import { ZONE_REQUIRED_LEVEL, LEVEL_UP_GEMS } from "./levels";

export type ZoneKey = "alchemy" | "harbor" | "garden" | "banquet" | "cellar" | "tower";
export type Boost = 1 | 2 | 4;

// 마녀의 성 구역 순서 (세이브 호환을 위해 기존 키 유지)
export const ZONE_ORDER: ZoneKey[] = ["alchemy", "harbor", "garden", "banquet", "cellar", "tower"];
// 구역별 손님 주문 요구 레벨 상한
export const ORDER_LEVEL_CAP: Record<ZoneKey, number> = { alchemy: 4, harbor: 5, garden: 6, banquet: 8, cellar: 8, tower: 8 };
// 장소 복구 비용(🪙)을 화(章) 순서로 (v3.10: 예전엔 spot.cost × 구역 단가라 구역이 바뀔 때마다 싸졌다가 다시 올랐다)
// 제1~2화는 첫걸음이라 싸게, 제3화부터는 화마다 약 9%씩 매끄럽게 오른다 (balance.test의 봇으로 확인)
export const SPOT_COIN_COST: readonly number[] = [
  1000, 2000, 3000, 3300, 3600,
  3900, 4300, 4700, 5100, 5600,
  6100, 6600, 7300, 7900, 8700,
  9500, 10300, 11300, 12300, 13500,
  14700, 16100, 17600, 19200, 21000,
  22900, 25000, 27300, 29900, 32600
];
// 생성기 등급(★)별 한 번에 나오게 할 수 있는 최대 재료 레벨
export const GENERATOR_TIER_CAP: Record<number, number> = { 1: 3, 2: 5, 3: 6 };
// 배속별 추가 단계 (×2 = +1단계, ×4 = +2단계)
export const BOOST_STEPS: Record<Boost, number> = { 1: 0, 2: 1, 4: 2 };
export const BOOST_CYCLE: Boost[] = [1, 2, 4];
export const LEGACY_STAR_TO_COINS = 100;

export const GEM_REWARDS = { holidayMission: 5, zoneComplete: 50, levelUp: LEVEL_UP_GEMS } as const;
// 번개 드롭 (v3.10: 번개가 너무 안 나와서 상향 — 예전엔 합성 Lv.4 이상 12%·그중 절반 번개, 주문 8%)
// 합성 결과 레벨별 보너스 조각 확률: Lv.3 이하 없음, Lv.4 15%, Lv.5 20%, Lv.6 이상 25%
export function mergeBonusChance(resultLv: number): number {
  return resultLv >= 6 ? 0.25 : resultLv === 5 ? 0.2 : resultLv === 4 ? 0.15 : 0;
}
// 보너스 조각이 번개일 확률 (나머지는 코인 조각)
export const MERGE_BONUS_ENERGY_SHARE = 0.7;
// 주문 완료 때 번개 조각 Lv.1이 나올 확률
export const ORDER_ENERGY_CHANCE = 0.2;

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
  // 이야기 순서상 뒤 구역을 이미 진행한 세이브(v2)는 앞 구역을 레벨로 잠그지 않는다
  const laterDone = rooms.map((_, i) => rooms.slice(i + 1).some((r) => r.spots.some((sp) => sp.done)));
  let ri = -1;

  for (const room of rooms) {
    const key = room.key as ZoneKey;
    const allDone = room.spots.length > 0 && room.spots.every((s) => s.done);
    const anyDone = room.spots.some((s) => s.done);
    ri++;
    const lvOk = anyDone || laterDone[ri] || playerLv >= (ZONE_REQUIRED_LEVEL[key] ?? 1);
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

export function getSpotCoinCost(chapter: number): number {
  return SPOT_COIN_COST[Math.min(SPOT_COIN_COST.length, Math.max(1, Math.floor(chapter) || 1)) - 1];
}

// 구역 대표 체인: 그 구역 주문에 40% 확률로 먼저 뽑힌다 (해금돼 있을 때만)
export const ZONE_FAVORED_CHAIN: Partial<Record<ZoneKey, string>> = { cellar: "candle", tower: "silk" };

// 체인·레벨은 랜덤, 상한만 구역이 결정 (첫 요구 Lv.2~상한, 55% 확률로 한 단계 낮은 두 번째 요구)
export function rollOrderReqs<C extends string>(zoneKey: string, coreChains: readonly C[], rng: () => number = Math.random): Array<{ chain: C; level: number }> {
  const cap = getOrderLevelCap(zoneKey);
  const fav = ZONE_FAVORED_CHAIN[zoneKey as ZoneKey] as C | undefined;
  const favOk = fav !== undefined && coreChains.includes(fav);
  const pick = () => (favOk && rng() < 0.4 ? fav! : coreChains[Math.min(coreChains.length - 1, Math.floor(rng() * coreChains.length))]);
  const lv1 = Math.min(cap, 2 + Math.floor(rng() * (cap - 1)));
  const reqs = [{ chain: pick(), level: lv1 }];
  if (rng() < 0.55) {
    // 두 번째 요구도 Lv.2 이상: ★2·★3 생성기는 Lv.1을 만들지 못한다
    reqs.push({ chain: pick(), level: Math.max(2, lv1 - 1) });
  }
  return reqs;
}

function clampTier(tier: number): number {
  return Math.min(3, Math.max(1, Math.floor(tier) || 1));
}

// 등급별로 바로 나오는 재료 단계(기본 배출)와 배속을 쓸 때 최대 단계 — 생성기 체인 지도 표시용 (rollBaseSpawn과 같은 범위)
export function spawnRange(tier: number): { min: number; max: number; boostMax: number } {
  const t = clampTier(tier);
  const base = t === 1 ? { min: 1, max: 2 } : t === 2 ? { min: 2, max: 3 } : { min: 2, max: 4 };
  return { ...base, boostMax: GENERATOR_TIER_CAP[t] };
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
