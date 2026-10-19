// levels.ts — 플레이어 레벨 규칙: 필요 경험치 곡선, 경험치 출처, 레벨업 보상, 레벨이 여는 것(구역 입장·보관함·새 체인)
// v3.5: 예전 곡선(50+20(L-1))과 큰 레벨업 보상(번개 10)이 눈덩이처럼 굴러 금방 다 깨지던 문제를 고친다

import type { ChainId, CoreChain, ExtraChain, OrderReq, ZoneKey } from "../types";

export const CORE_GEN_CHAINS: CoreChain[] = ["potion", "grimoire", "herb", "bakery", "tea"];

// 다음 레벨까지 필요한 경험치 (L1 80 → L10 926 → L20 3006)
export function xpToNext(lv: number): number {
  const n = Math.max(1, Math.floor(lv)) - 1;
  return 80 + 40 * n + 6 * n * n;
}

// 재료 합성: 결과 레벨만큼 (높은 단계일수록 가치)
export function mergeXP(resultLv: number): number {
  return Math.max(1, Math.floor(resultLv));
}
export const GEN_EVOLVE_XP = 15;
export const RESTORE_XP = 35;

// 주문 완료: 5 + 3 × 요구 레벨 합
export function orderXP(reqs: OrderReq[]): number {
  return 5 + 3 * reqs.reduce((sum, r) => sum + r.level, 0);
}

export interface LevelUpReward {
  coins: number;
  energy: number;
  gems: number;
  genPart: boolean;
}

// 💎3은 규칙상 고정. 번개는 5로 줄여 생성 → 경험치 → 번개 눈덩이를 끊는다. 생성기 파츠는 짝수 레벨만
export function levelUpReward(newLv: number): LevelUpReward {
  return { coins: 25 * newLv, energy: 5, gems: 3, genPart: newLv % 2 === 0 };
}

// 구역 입장 레벨 (이미 장소를 하나라도 복구한 구역은 레벨과 상관없이 입장 가능 — 세이브 호환)
export const ZONE_REQUIRED_LEVEL: Record<ZoneKey, number> = { alchemy: 1, harbor: 4, garden: 8, banquet: 12, cellar: 16, tower: 20 };

// 새 체인은 이 레벨이 되면 ★1 생성기를 주고 주문에 나오기 시작한다
export const CHAIN_UNLOCK_LEVEL: Record<ExtraChain, number> = { candle: 6, silk: 12 };

const BAG_STEPS: [number, number][] = [
  [5, 8],
  [10, 10],
  [15, 12],
];
export const BAG_BASE = 6;
export const BAG_MAX = 12;

export function bagSize(lv: number): number {
  let size = BAG_BASE;
  for (const [at, n] of BAG_STEPS) if (lv >= at) size = n;
  return size;
}

// 생성기를 가진 체인 중 이 레벨에서 쓸 수 있는 것 (주문 재료 후보이자 생성기 파츠 순환 대상)
export function unlockedChains(lv: number): Array<CoreChain | ExtraChain> {
  const extras = (Object.keys(CHAIN_UNLOCK_LEVEL) as ExtraChain[]).filter((c) => lv >= CHAIN_UNLOCK_LEVEL[c]);
  return [...CORE_GEN_CHAINS, ...extras];
}

export function isExtraChain(c: ChainId): c is ExtraChain {
  return Object.hasOwn(CHAIN_UNLOCK_LEVEL, c);
}

const ZONE_LABEL: Record<ZoneKey, string> = {
  alchemy: "🔮 마녀의 공방",
  harbor: "🏖️ 하버 오션카페",
  garden: "🌿 보타니컬 온실",
  banquet: "👑 황실 대연회장",
  cellar: "🕯️ 지하 비밀 저장고",
  tower: "🌙 달빛 마탑",
};
const CHAIN_LABEL: Record<ExtraChain, string> = { candle: "🕯️ 마법 촛불", silk: "🧵 요정 비단" };

// 레벨 lv에 도달하면 열리는 것 (레벨 창·레벨업 알림 문구)
export function unlocksAt(lv: number): string[] {
  const out: string[] = [];
  for (const z of Object.keys(ZONE_REQUIRED_LEVEL) as ZoneKey[]) if (ZONE_REQUIRED_LEVEL[z] === lv && lv > 1) out.push(`${ZONE_LABEL[z]} 입장`);
  for (const c of Object.keys(CHAIN_UNLOCK_LEVEL) as ExtraChain[]) if (CHAIN_UNLOCK_LEVEL[c] === lv) out.push(`${CHAIN_LABEL[c]} 생성기`);
  const bag = BAG_STEPS.find(([at]) => at === lv);
  if (bag) out.push(`🎒 보관함 ${bag[1]}칸`);
  return out;
}

// 다음으로 무언가 열리는 레벨과 그 내용
export function nextUnlock(lv: number): { level: number; items: string[] } | null {
  for (let l = lv + 1; l <= 60; l++) {
    const items = unlocksAt(l);
    if (items.length) return { level: l, items };
  }
  return null;
}
