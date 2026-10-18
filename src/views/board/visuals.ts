// visuals.ts — 게임 상태 → 보드 칸 그리기 정보 (본게임 7×8, 명절 5×5 공용 형식)

import type { GameState } from "../../core/types";
import { getItemMeta, getGeneratorTierMeta } from "../../core/rules/chains";
import { getHolidayConfig } from "../../core/rules/holidays";
import { itemKey, type TexKey } from "../art/textures";

export interface CellVisual {
  key: string; // uid (스프라이트 재사용 기준)
  tex: TexKey;
  label: string;
  pill: string;
  bg: number;
  border: number;
  shadow: number;
  labelDark: boolean;
  state: "active" | "crate" | "cobweb";
  isGenerator: boolean;
  wanted: boolean;
}

const CHAIN_COLORS: Record<string, [number, number, number]> = {
  potion: [0xf3e8ff, 0xa855f7, 0x7e22ce],
  grimoire: [0xffedd5, 0xf97316, 0xc2410c],
  herb: [0xdcfce7, 0x22c55e, 0x15803d],
  bakery: [0xfce7f3, 0xec4899, 0xbe185d],
  tea: [0xcffafe, 0x06b6d4, 0x0e7490],
  gem: [0xe0f2fe, 0x3b82f6, 0x1d4ed8],
  combo: [0xfbcfe8, 0xf59e0b, 0xb45309],
  coin: [0xfde047, 0xeab308, 0xa16207],
  energy: [0xfde047, 0xeab308, 0xa16207],
};
const GEN_COLORS: [number, number, number] = [0x5b21b6, 0xfde047, 0x2e1065];
const CRATE_COLORS: [number, number, number] = [0x92400e, 0xb45309, 0x451a03];

export function mainBoardVisuals(s: GameState, wantedUids: Set<string>): (CellVisual | null)[] {
  return s.board.map((it) => {
    if (!it) return null;
    if (it.state === "crate") {
      return { key: it.uid, tex: "crate", label: "봉인 상자", pill: "", bg: CRATE_COLORS[0], border: CRATE_COLORS[1], shadow: CRATE_COLORS[2], labelDark: true, state: "crate", isGenerator: false, wanted: false };
    }
    if (it.isGenerator) {
      const t = getGeneratorTierMeta(it.chain, it.level);
      return { key: it.uid, tex: itemKey(it.chain, it.level, true), label: t.name, pill: "★".repeat(it.level), bg: GEN_COLORS[0], border: GEN_COLORS[1], shadow: GEN_COLORS[2], labelDark: true, state: "active", isGenerator: true, wanted: false };
    }
    const meta = getItemMeta(it.chain, it.level);
    const [bg, border, shadow] = CHAIN_COLORS[it.chain] ?? CHAIN_COLORS.gem;
    return { key: it.uid, tex: itemKey(it.chain, it.level, false), label: meta.name, pill: `Lv.${it.level}`, bg, border, shadow, labelDark: false, state: it.state, isGenerator: false, wanted: wantedUids.has(it.uid) };
  });
}

export function holidayBoardVisuals(s: GameState): (CellVisual | null)[] {
  const h = getHolidayConfig(s.holiday.activeHolidayId);
  const isTarget = (lv: number) => lv >= s.holiday.targetLv;
  return s.holiday.board.map((it) => {
    if (!it) return null;
    if (it.isGenerator) {
      return { key: it.uid, tex: "eventGen", label: h.genName, pill: "", bg: GEN_COLORS[0], border: GEN_COLORS[1], shadow: GEN_COLORS[2], labelDark: true, state: "active", isGenerator: true, wanted: false };
    }
    const meta = h.items[Math.min(it.level - 1, h.items.length - 1)];
    return { key: it.uid, tex: `event:${it.level}`, label: meta.name, pill: `Lv.${it.level}`, bg: 0xffedd5, border: 0xf97316, shadow: 0xc2410c, labelDark: false, state: "active", isGenerator: false, wanted: isTarget(it.level) };
  });
}
