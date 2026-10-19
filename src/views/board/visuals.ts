// visuals.ts — 게임 상태 → 보드 칸 그리기 정보 (본게임 7×8, 명절 5×5 공용 형식)

import type { GameState } from "../../core/types";
import { itemKey, type TexKey } from "../art/textures";

// v3.2: 칸에는 그림만 — 이름·레벨은 탭했을 때 아래 정보 패널에서 보여 준다
export interface CellVisual {
  key: string; // uid (스프라이트 재사용 기준)
  tex: TexKey;
  accent: number; // 합성 파티클 색
  state: "active" | "crate" | "cobweb";
  isGenerator: boolean;
  wanted: boolean;
}

const CHAIN_ACCENT: Record<string, number> = {
  potion: 0xa855f7,
  grimoire: 0xf97316,
  herb: 0x22c55e,
  bakery: 0xec4899,
  tea: 0x06b6d4,
  candle: 0xf59e0b,
  silk: 0xec4899,
  gem: 0x3b82f6,
  combo: 0xf59e0b,
  coin: 0xeab308,
  energy: 0xeab308,
};
const GEN_ACCENT = 0xfde047;

export function mainBoardVisuals(s: GameState, wantedUids: Set<string>): (CellVisual | null)[] {
  return s.board.map((it) => {
    if (!it) return null;
    if (it.state === "crate") return { key: it.uid, tex: "crate", accent: 0xb45309, state: "crate", isGenerator: false, wanted: false };
    if (it.isGenerator) return { key: it.uid, tex: itemKey(it.chain, it.level, true), accent: GEN_ACCENT, state: "active", isGenerator: true, wanted: false };
    return { key: it.uid, tex: itemKey(it.chain, it.level, false), accent: CHAIN_ACCENT[it.chain] ?? 0x3b82f6, state: it.state, isGenerator: false, wanted: wantedUids.has(it.uid) };
  });
}

export function holidayBoardVisuals(s: GameState): (CellVisual | null)[] {
  return s.holiday.board.map((it) => {
    if (!it) return null;
    if (it.isGenerator) return { key: it.uid, tex: "eventGen", accent: GEN_ACCENT, state: "active", isGenerator: true, wanted: false };
    return { key: it.uid, tex: `event:${it.level}`, accent: 0xf97316, state: "active", isGenerator: false, wanted: it.level >= s.holiday.targetLv };
  });
}
