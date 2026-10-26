// progress.ts — 경험치·레벨업, 생성기 파츠 지급, 번개 자연 충전, 💎 상점, 배속·설정 (v2.5 gainXP·grantGeneratorEvolutionPart 등 이전)

import { newUid } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { GEM_SHOP_ENERGY, nextBoost } from "../rules/progression";
import { GEN_UNITS_MAX, SURPLUS_PART_COINS, bagSize, generatorUnits, levelUpReward, unlockedChains, unlocksAt, xpToNext } from "../rules/levels";
import { ENERGY_REGEN_SEC, NATURAL_ENERGY_CAP, type BoardItem, type GameState, type GenChain, type Settings } from "../types";
import { findNearestEmptyCell } from "./board";

// force: 새 체인 해금 생성기처럼 잃으면 안 되는 지급은 보관함이 꽉 차 있어도 넣는다
export function grantGeneratorPart(s: GameState, ev: GameEvent[], chain: GenChain, force = false): void {
  const part = { uid: newUid(s), state: "active" as const, isGenerator: true, chain, level: 1 };
  const cell = findNearestEmptyCell(s, 24, () => 0);
  if (cell !== -1) {
    s.board[cell] = part;
    ev.push({ type: "generatorPartGranted", chain, where: "board", cell });
  } else if (force || s.bag.length < bagSize(s.playerLv)) {
    s.bag.push(part);
    ev.push({ type: "generatorPartGranted", chain, where: "bag", cell: null });
  } else {
    ev.push({ type: "generatorPartGranted", chain, where: "none", cell: null });
  }
}

// 파츠를 줄 체인: 원하는 체인이 한도(★3 하나)에 못 미치면 그 체인, 아니면 쓸 수 있는 체인을 차례로 돌며 한도가 남은 첫 체인. 모두 가득이면 null
export function pickPartChain(s: GameState, preferred: GenChain): GenChain | null {
  const pool = unlockedChains(s) as GenChain[];
  const start = Math.max(0, pool.indexOf(preferred));
  for (let k = 0; k < pool.length; k++) {
    const c = pool[(start + k) % pool.length];
    if (generatorUnits(s, c) < GEN_UNITS_MAX) return c;
  }
  return null;
}

// 예전 세이브의 남는 생성기 정리: ★3가 있는 체인은 그 ★3 하나(보드 먼저)만 남기고 나머지 같은 체인 생성기를 걷어 파츠당 코인으로 돌려준다
export function trimSurplusGenerators(s: GameState, ev: GameEvent[]): Array<{ chain: GenChain; count: number; coins: number }> {
  const out: Array<{ chain: GenChain; count: number; coins: number }> = [];
  const all = [...s.board, ...s.bag].filter((it): it is BoardItem => !!it?.isGenerator);
  for (const chain of new Set(all.map((it) => it.chain as GenChain))) {
    const keep = all.find((it) => it.chain === chain && (it.level || 1) >= 3);
    if (!keep) continue;
    const drop = all.filter((it) => it.chain === chain && it !== keep);
    if (!drop.length) continue;
    const ids = new Set(drop.map((it) => it.uid));
    s.board = s.board.map((it) => (it && ids.has(it.uid) ? null : it));
    s.bag = s.bag.filter((it) => !ids.has(it.uid));
    const coins = drop.reduce((n, it) => n + Math.pow(2, Math.min(3, Math.max(1, it.level || 1)) - 1), 0) * SURPLUS_PART_COINS;
    grant(s, ev, "coins", coins, "surplusGenerators");
    out.push({ chain, count: drop.length, coins });
  }
  return out;
}

// 레벨업 보상(levels.ts): 코인 25×레벨, 번개 +5, 💎3, 짝수 레벨에 생성기 파츠(쓸 수 있는 체인 순환)
// 새 체인 생성기는 레벨이 아니라 구역 완성 보상 (castle.renovate)
export function gainXP(s: GameState, ev: GameEvent[], amount: number): void {
  s.xp += amount;
  while (s.xp >= xpToNext(s.playerLv)) {
    s.xp -= xpToNext(s.playerLv);
    s.playerLv += 1;
    const r = levelUpReward(s.playerLv);
    const pool = unlockedChains(s) as GenChain[];
    // 한도(★3 하나)가 찬 체인은 건너뛰고, 모든 체인이 가득이면 파츠 없음
    const genChain = r.genPart ? pickPartChain(s, pool[(s.playerLv / 2 - 1) % pool.length]) : null;
    grant(s, ev, "coins", r.coins, "levelUp");
    grant(s, ev, "energy", r.energy, "levelUp");
    grant(s, ev, "gems", r.gems, "levelUp");
    ev.push({ type: "levelUp", level: s.playerLv, coins: r.coins, energy: r.energy, gems: r.gems, genChain, unlocks: unlocksAt(s.playerLv) });
    if (genChain) grantGeneratorPart(s, ev, genChain);
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

// 번개 가득 알림(v3.13): 자연 충전으로 상한까지 남은 초 (이미 가득이면 0)
export function energyFullInSec(s: GameState): number {
  if (s.energy >= NATURAL_ENERGY_CAP) return 0;
  return (NATURAL_ENERGY_CAP - s.energy - 1) * ENERGY_REGEN_SEC + Math.max(0, s.energyCountdown);
}

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
