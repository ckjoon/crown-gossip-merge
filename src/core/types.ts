// types.ts — 게임 상태와 데이터의 공통 타입 (core 전용, DOM·렌더러 의존 없음)

import type { Boost, ZoneKey } from "./rules/progression";

export type { Boost, ZoneKey };
export type CoreChain = "potion" | "grimoire" | "herb" | "bakery" | "tea";
// v3.5 레벨로 해금되는 생성 체인
export type ExtraChain = "candle" | "silk";
export type GenChain = CoreChain | ExtraChain;
export type ChainId = CoreChain | ExtraChain | "gem" | "combo" | "coin" | "energy";
export type CellState = "active" | "crate" | "cobweb";

export interface BoardItem {
  uid: string;
  state: CellState;
  isGenerator: boolean;
  chain: ChainId;
  level: number;
}

export type Cell = BoardItem | null;

export interface OrderReq {
  chain: ChainId;
  level: number;
}

export interface CustomerInfo {
  name: string;
  face: string;
  line: string;
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  reqs: OrderReq[];
  coins: number;
}

export interface EventItem {
  uid: string;
  isGenerator: boolean;
  level: number;
}

export interface HolidayState {
  activeHolidayId: string;
  board: (EventItem | null)[];
  targetLv: number;
  freeSpawns: number;
  completedCount: number;
}

export interface SpotState {
  done: boolean;
  styleIdx: number;
}

export interface Settings {
  sound: boolean;
  reduceMotion: boolean;
}

export interface GameState {
  playerLv: number;
  xp: number;
  energy: number;
  energyCountdown: number;
  coins: number;
  gems: number;
  board: Cell[];
  bag: BoardItem[];
  orders: Order[];
  boostMultiplier: Boost;
  holiday: HolidayState;
  rooms: Record<string, SpotState>;
  currentThemeKey: ZoneKey;
  settings: Settings;
  lastSeenVersion: string | null;
  cauldronPartGranted: boolean;
  // 도감 (v3.9): 체인별로 보드·보관함에 나타난 적 있는 가장 높은 재료 단계. 그보다 높은 단계는 도감에서 ??? 로 가린다
  codexSeen: Partial<Record<ChainId, number>>;
  uidSeq: number;
}

export const COLS = 7;
export const ROWS = 8;
export const TOTAL_CELLS = COLS * ROWS;
export const NATURAL_ENERGY_CAP = 100;
export const ENERGY_REGEN_SEC = 120; // v3.10: 5분 → 2분 (Gossip Harbor와 같은 속도)
export const EVENT_CELLS = 25;
