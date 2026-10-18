// progress.ts — 경험치·레벨업, 생성기 파츠 지급, 번개 자연 충전, 💎 상점, 배속·설정 (v2.5 gainXP·grantGeneratorEvolutionPart 등 이전)

import { newUid } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { CORE_CHAINS, getRequiredXP } from "../rules/chains";
import { GEM_REWARDS, GEM_SHOP_ENERGY, nextBoost } from "../rules/progression";
import { BAG_SIZE, ENERGY_REGEN_SEC, NATURAL_ENERGY_CAP, type CoreChain, type GameState, type Settings } from "../types";
import { findNearestEmptyCell } from "./board";

export function grantGeneratorPart(s: GameState, ev: GameEvent[], chain: CoreChain): void {
  const part = { uid: newUid(s), state: "active" as const, isGenerator: true, chain, level: 1 };
  const cell = findNearestEmptyCell(s, 24, () => 0);
  if (cell !== -1) {
    s.board[cell] = part;
    ev.push({ type: "generatorPartGranted", chain, where: "board", cell });
  } else if (s.bag.length < BAG_SIZE) {
    s.bag.push(part);
    ev.push({ type: "generatorPartGranted", chain, where: "bag", cell: null });
  } else {
    ev.push({ type: "generatorPartGranted", chain, where: "none", cell: null });
  }
}

// 레벨업 보상: 코인 40×레벨, 번개 +10, 💎3, 생성기 진화 파츠(체인 순환)
export function gainXP(s: GameState, ev: GameEvent[], amount: number): void {
  s.xp += amount;
  while (s.xp >= getRequiredXP(s.playerLv)) {
    s.xp -= getRequiredXP(s.playerLv);
    s.playerLv += 1;
    const coins = 40 * s.playerLv;
    const energy = 10;
    const gems = GEM_REWARDS.levelUp;
    const genChain = CORE_CHAINS[(s.playerLv - 2) % CORE_CHAINS.length];
    grant(s, ev, "coins", coins, "levelUp");
    grant(s, ev, "energy", energy, "levelUp");
    grant(s, ev, "gems", gems, "levelUp");
    ev.push({ type: "levelUp", level: s.playerLv, coins, energy, gems, genChain });
    grantGeneratorPart(s, ev, genChain);
  }
}

// 번개 자연 충전: 100 미만일 때만 카운트다운, 0이 되면 +1 (100 이상이면 카운트다운 고정)
export const tickEnergy: Action<{ seconds: number }> = (s, _ctx, { seconds }) => {
  const ev: GameEvent[] = [];
  for (let i = 0; i < seconds; i++) {
    if (s.energy >= NATURAL_ENERGY_CAP) {
      s.energyCountdown = ENERGY_REGEN_SEC;
      break;
    }
    s.energyCountdown -= 1;
    if (s.energyCountdown <= 0) {
      s.energy = Math.min(NATURAL_ENERGY_CAP, s.energy + 1);
      s.energyCountdown = ENERGY_REGEN_SEC;
      ev.push({ type: "energyRegen", energy: s.energy });
    }
  }
  return ev;
};

export const buyEnergyPack: Action<{ pack: number }> = (s, _ctx, { pack }) => {
  const p = GEM_SHOP_ENERGY[pack];
  if (!p) return [];
  const ev: GameEvent[] = [];
  if (!spend(s, ev, "gems", p.gems, "gemShop")) return [rejected("notEnoughGems")];
  grant(s, ev, "energy", p.energy, "gemShop");
  return ev;
};

export const toggleBoost: Action<void> = (s) => {
  s.boostMultiplier = nextBoost(s.boostMultiplier);
  return [{ type: "boostChanged", boost: s.boostMultiplier }];
};

export const setSetting: Action<{ key: keyof Settings; value: boolean }> = (s, _ctx, { key, value }) => {
  s.settings[key] = value;
  return [{ type: "settingsChanged" }];
};

export const markVersionSeen: Action<{ version: string }> = (s, _ctx, { version }) => {
  s.lastSeenVersion = version;
  return [];
};
