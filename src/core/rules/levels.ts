// levels.ts — 플레이어 레벨 규칙: 필요 경험치 곡선, 경험치 출처, 레벨업 보상, 레벨이 여는 것(구역 입장·보관함·새 체인)
// v3.5: 예전 곡선(50+20(L-1))과 큰 레벨업 보상(번개 10)이 눈덩이처럼 굴러 금방 다 깨지던 문제를 고친다

import type { ChainId, CoreChain, ExtraChain, GameState, OrderReq, SpotState, ZoneKey } from "../types";
import { ROOMS } from "./rooms";

export const CORE_GEN_CHAINS: CoreChain[] = ["potion", "grimoire", "herb", "bakery", "tea"];

// 다음 레벨까지 필요한 경험치 (L1 150 → L10 2202 → L20 6762)
export function xpToNext(lv: number): number {
  const n = Math.max(1, Math.floor(lv)) - 1;
  return 150 + 120 * n + 12 * n * n;
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

// 판매가: 팔아서 버는 코인이 주문보다 훨씬 적게 (예전 판매가는 번개당 코인이 주문만큼 나와 복구 비용을 쉽게 넘었다)
const SELL_BY_LEVEL = [1, 1, 2, 3, 5, 8, 12, 20];
export function sellPrice(level: number): number {
  return SELL_BY_LEVEL[Math.min(SELL_BY_LEVEL.length, Math.max(1, Math.floor(level))) - 1];
}

// 주문 코인: 요구 레벨마다 2^레벨 × 4 + 15
export function orderCoins(reqs: OrderReq[]): number {
  return reqs.reduce((sum, r) => sum + Math.pow(2, r.level) * 4, 0) + 15;
}

export interface LevelUpReward {
  coins: number;
  energy: number;
  gems: number;
  genPart: boolean;
}

// 💎3은 규칙상 고정. 번개는 5로 줄여 생성 → 경험치 → 번개 눈덩이를 끊는다. 생성기 파츠는 짝수 레벨만
// 레벨업 💎 (규칙상 고정 — progression의 GEM_REWARDS.levelUp도 이 값)
export const LEVEL_UP_GEMS = 3;

export function levelUpReward(newLv: number): LevelUpReward {
  return { coins: 25 * newLv, energy: 5, gems: LEVEL_UP_GEMS, genPart: newLv % 2 === 0 };
}

// 구역 입장 레벨 (이미 장소를 하나라도 복구한 구역은 레벨과 상관없이 입장 가능 — 세이브 호환)
export const ZONE_REQUIRED_LEVEL: Record<ZoneKey, number> = { alchemy: 1, harbor: 6, garden: 11, banquet: 14, cellar: 17, tower: 21 };

// 새 체인은 이 구역을 완성하면 그 구역 보상으로 ★1 생성기를 받고 주문에 나오기 시작한다 (v3.8: 레벨이 아니라 이야기에서 얻음)
// 공방 구석에서 할머니의 촛대 제단을 찾고, 하버를 되살리면 퀸의 배가 요정 물레를 싣고 온다
export const CHAIN_UNLOCK_ZONE: Record<ExtraChain, ZoneKey> = { candle: "alchemy", silk: "harbor" };

// 구역 완성 때 생성기를 건네주는 장면 (반응 말풍선, 46자 이내)
export const CHAIN_GIFT: Record<ExtraChain, { characterId: string; line: string }> = {
  candle: { characterId: "selene", line: "공방 구석에서 할머니의 촛대 제단을 찾았어! 🕯️ 촛불 재료를 만들어 보자!" },
  silk: { characterId: "quinn", line: "제 배가 요정 물레를 싣고 왔어요! 🧵 비단 재료를 만들어 봐요!" },
};

export function zoneComplete(rooms: Record<string, SpotState>, zone: ZoneKey): boolean {
  return ROOMS[zone].spots.every((sp) => rooms[sp.id]?.done);
}

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

// 지금 쓸 수 있는 생성기 체인 (주문 재료 후보이자 생성기 파츠 순환 대상): 기본 5종 + 보상 구역을 완성했거나 이미 그 생성기를 가진 새 체인
// (생성기를 가진 것도 포함 — v3.5~3.7에 레벨로 먼저 받은 세이브도 주문이 계속 나오게)
export function unlockedChains(s: Pick<GameState, "rooms" | "board" | "bag">): Array<CoreChain | ExtraChain> {
  const owns = (c: ExtraChain) => [...s.board, ...s.bag].some((it) => it?.isGenerator && it.chain === c);
  const extras = (Object.keys(CHAIN_UNLOCK_ZONE) as ExtraChain[]).filter((c) => zoneComplete(s.rooms, CHAIN_UNLOCK_ZONE[c]) || owns(c));
  return [...CORE_GEN_CHAINS, ...extras];
}

export function isExtraChain(c: ChainId): c is ExtraChain {
  return Object.hasOwn(CHAIN_UNLOCK_ZONE, c);
}

const ZONE_LABEL: Record<ZoneKey, string> = {
  alchemy: "🔮 마녀의 공방",
  harbor: "🏖️ 하버 오션카페",
  garden: "🌿 보타니컬 온실",
  banquet: "👑 황실 대연회장",
  cellar: "🕯️ 지하 비밀 저장고",
  tower: "🌙 달빛 마탑",
};
// 도감·안내 문구: 이 체인을 받는 구역 (예: "🔮 마녀의 공방 완성")
const ZONE_SHORT: Record<ZoneKey, string> = { alchemy: "공방", harbor: "하버", garden: "온실", banquet: "연회장", cellar: "저장고", tower: "마탑" };
export function chainUnlockLabel(c: ExtraChain): string {
  return `${ZONE_SHORT[CHAIN_UNLOCK_ZONE[c]]} 완성`;
}

// 레벨 lv에 도달하면 열리는 것 (레벨 창·레벨업 알림 문구)
export function unlocksAt(lv: number): string[] {
  const out: string[] = [];
  for (const z of Object.keys(ZONE_REQUIRED_LEVEL) as ZoneKey[]) if (ZONE_REQUIRED_LEVEL[z] === lv && lv > 1) out.push(`${ZONE_LABEL[z]} 입장`);
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
