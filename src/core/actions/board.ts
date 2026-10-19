// board.ts — 합성 보드 행동: 생성기 탭, 이동·합성·생성기 진화, 수집, 거미줄 해제, 정렬, 보관함, 판매 (v2.5 규칙 그대로)

import { newUid } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { CHAINS, getItemMeta } from "../rules/chains";
import { getGeneratorTierCap, resolveBoost, rollBaseSpawn } from "../rules/progression";
import { GEN_EVOLVE_XP, bagSize, mergeXP } from "../rules/levels";
import { COLS, ROWS, TOTAL_CELLS, type BoardItem, type GameState } from "../types";
import { gainXP } from "./progress";

const UNLOCK_COBWEB_COST = 20;

// 빈칸 중 기준 칸에서 가장 가까운 칸 (기준이 없으면 무작위). 없으면 −1
export function findNearestEmptyCell(s: GameState, origin: number | null, rng: () => number): number {
  const empty: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) if (!s.board[i]) empty.push(i);
  if (empty.length === 0) return -1;
  if (origin === null) return empty[Math.floor(rng() * empty.length)];
  const or = Math.floor(origin / COLS);
  const oc = origin % COLS;
  const dist = (i: number) => Math.hypot(Math.floor(i / COLS) - or, (i % COLS) - oc);
  empty.sort((a, b) => dist(a) - dist(b));
  return empty[0];
}

// 상하좌우의 봉인 상자를 거미줄로 바꾸고 바뀐 칸 목록을 돌려준다
function crackAdjacentCrates(s: GameState, center: number): number[] {
  const r = Math.floor(center / COLS);
  const c = center % COLS;
  const opened: number[] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
    const n = s.board[nr * COLS + nc];
    if (n && n.state === "crate") {
      n.state = "cobweb";
      opened.push(nr * COLS + nc);
    }
  }
  return opened;
}

// 생성기 탭: 등급(★)별 기본 배출 + 배속(등급 상한까지, 번개는 실제 오른 단계만큼 2^s)
export const spawnFromGenerator: Action<{ cell: number }> = (s, ctx, { cell }) => {
  const gen = s.board[cell];
  if (!gen || !gen.isGenerator || gen.state !== "active") return [];
  if (s.energy < 1) return [rejected("noEnergy", cell)];
  const to = findNearestEmptyCell(s, cell, ctx.rng);
  if (to === -1) return [rejected("boardFull", cell)];

  const tier = Math.max(1, gen.level || 1);
  const chDef = CHAINS[gen.chain];
  const base = rollBaseSpawn(tier, chDef.rareDropChain ? chDef.rareChance ?? 0 : 0, ctx.rng);
  const chain = base.rare && chDef.rareDropChain ? chDef.rareDropChain : gen.chain;
  const cap = Math.min(getGeneratorTierCap(tier), CHAINS[chain].items.length);
  const boost = resolveBoost(base.level, s.boostMultiplier, cap, s.energy);
  if (!boost) return [rejected("noEnergy", cell)];

  const ev: GameEvent[] = [];
  spend(s, ev, "energy", boost.cost, "spawn");
  const item: BoardItem = { uid: newUid(s), state: "active", isGenerator: false, chain, level: boost.level };
  s.board[to] = item;
  ev.push({ type: "spawned", from: cell, to, item: { ...item }, boostSteps: boost.steps, energyCost: boost.cost });
  return ev;
};

// 드래그 드롭: 이동 / 생성기 진화 / 같은 재료 합성(거미줄 포함) / 교체
export const moveOrMerge: Action<{ from: number; to: number }> = (s, ctx, { from, to }) => {
  if (from === to) return [];
  const src = s.board[from];
  const dst = s.board[to];
  if (!src || src.state !== "active") return [];

  if (!dst) {
    s.board[to] = src;
    s.board[from] = null;
    return [{ type: "moved", from, to, swapped: false }];
  }
  if (dst.state === "crate") return [rejected("crateLocked", to)];

  const ev: GameEvent[] = [];

  // 같은 체인·등급 생성기끼리 합치면 등급 상승 (★3까지)
  if (src.isGenerator && dst.isGenerator && src.chain === dst.chain && (src.level || 1) === (dst.level || 1) && (src.level || 1) < 3) {
    const item: BoardItem = { uid: newUid(s), state: "active", isGenerator: true, chain: src.chain, level: (src.level || 1) + 1 };
    s.board[from] = null;
    s.board[to] = item;
    ev.push({ type: "merged", from, to, item: { ...item }, wasCobweb: false, generatorEvolved: true });
    gainXP(s, ev, GEN_EVOLVE_XP);
    return ev;
  }

  const meta = getItemMeta(src.chain, src.level);
  if (!src.isGenerator && !dst.isGenerator && src.chain !== "combo" && src.chain === dst.chain && src.level === dst.level && src.level < meta.maxLv) {
    const wasCobweb = dst.state === "cobweb";
    const item: BoardItem = { uid: newUid(s), state: "active", isGenerator: false, chain: src.chain, level: src.level + 1 };
    s.board[from] = null;
    s.board[to] = item;
    ev.push({ type: "merged", from, to, item: { ...item }, wasCobweb, generatorEvolved: false });
    if (wasCobweb) {
      const opened = crackAdjacentCrates(s, to);
      if (opened.length) ev.push({ type: "cratesOpened", cells: opened });
    }
    // Lv.4 이상 결과물은 12% 확률로 번개/코인 조각 드롭
    if (item.level >= 4 && ctx.rng() < 0.12) {
      const cell = findNearestEmptyCell(s, to, ctx.rng);
      if (cell !== -1) {
        const bonus: BoardItem = { uid: newUid(s), state: "active", isGenerator: false, chain: ctx.rng() < 0.5 ? "energy" : "coin", level: 1 };
        s.board[cell] = bonus;
        ev.push({ type: "bonusDropped", cell, item: { ...bonus } });
      }
    }
    gainXP(s, ev, mergeXP(item.level));
    return ev;
  }

  if (dst.state === "active") {
    s.board[to] = src;
    s.board[from] = dst;
    return [{ type: "moved", from, to, swapped: true }];
  }
  return [rejected("cannotMerge", to)];
};

export const collectItem: Action<{ cell: number }> = (s, _ctx, { cell }) => {
  const it = s.board[cell];
  if (!it || it.state !== "active" || it.isGenerator) return [];
  const meta = getItemMeta(it.chain, it.level);
  if (!meta.isCollectible || !meta.amount) return [];
  const ev: GameEvent[] = [];
  const currency = meta.rewardType === "coins" ? "coins" : "energy";
  s.board[cell] = null;
  grant(s, ev, currency, meta.amount, "collect");
  ev.push({ type: "collected", cell, currency, amount: meta.amount });
  return ev;
};

export const unlockCobweb: Action<{ preferred: number | null }> = (s, _ctx, { preferred }) => {
  if (s.coins < UNLOCK_COBWEB_COST) return [rejected("notEnoughCoins")];
  const pref = preferred !== null ? s.board[preferred] : null;
  const cell = pref && pref.state === "cobweb" ? preferred! : s.board.findIndex((c) => c && c.state === "cobweb");
  if (cell === -1 || cell === null) return [rejected("noCobweb")];
  const ev: GameEvent[] = [];
  spend(s, ev, "coins", UNLOCK_COBWEB_COST, "unlockCobweb");
  s.board[cell]!.state = "active";
  ev.push({ type: "cobwebUnlocked", cell });
  const opened = crackAdjacentCrates(s, cell);
  if (opened.length) ev.push({ type: "cratesOpened", cells: opened });
  return ev;
};

// 정렬: 생성기·상자·거미줄은 제자리, 재료는 체인 이름순 → 레벨 내림차순으로 앞칸부터
export const sortBoard: Action<void> = (s) => {
  const slots: number[] = [];
  const items: BoardItem[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const it = s.board[i];
    if (!it) slots.push(i);
    else if (it.state === "active" && !it.isGenerator) {
      slots.push(i);
      items.push(it);
    }
  }
  items.sort((a, b) => (a.chain !== b.chain ? a.chain.localeCompare(b.chain) : b.level - a.level));
  slots.forEach((cell, k) => (s.board[cell] = items[k] ?? null));
  return [{ type: "boardSorted" }];
};

export const storeToBag: Action<{ cell: number }> = (s, _ctx, { cell }) => {
  const it = s.board[cell];
  if (!it || it.state !== "active") return [];
  if (s.bag.length >= bagSize(s.playerLv)) return [rejected("bagFull", cell)];
  s.bag.push(it);
  s.board[cell] = null;
  return [{ type: "bagStored", from: cell }];
};

export const retrieveFromBag: Action<{ bagIdx: number }> = (s, ctx, { bagIdx }) => {
  const it = s.bag[bagIdx];
  if (!it) return [];
  const to = findNearestEmptyCell(s, 27, ctx.rng);
  if (to === -1) return [rejected("boardFull")];
  s.bag.splice(bagIdx, 1);
  s.board[to] = it;
  return [{ type: "bagRetrieved", to, bagIdx }];
};

export const sellItem: Action<{ cell: number }> = (s, _ctx, { cell }) => {
  const it = s.board[cell];
  if (!it || it.state !== "active" || it.isGenerator) return [];
  const meta = getItemMeta(it.chain, it.level);
  if (meta.isCollectible || !meta.sell) return [];
  const ev: GameEvent[] = [];
  s.board[cell] = null;
  grant(s, ev, "coins", meta.sell, "sell");
  ev.push({ type: "sold", cell, coins: meta.sell });
  return ev;
};

// 드래그 중 합칠 수 있는 칸 (같은 재료·레벨이며 최대 레벨 미만 — 거미줄 칸 포함, 또는 같은 체인·등급 생성기 ★3 미만)
export function getMergeTargets(s: GameState, from: number): number[] {
  const src = s.board[from];
  if (!src || src.state !== "active") return [];
  const out: number[] = [];
  s.board.forEach((t, i) => {
    if (i === from || !t || t.state === "crate") return;
    if (src.isGenerator) {
      if (t.isGenerator && t.state === "active" && t.chain === src.chain && t.level === src.level && src.level < 3) out.push(i);
      return;
    }
    if (t.isGenerator || src.chain === "combo") return;
    if (t.chain === src.chain && t.level === src.level && src.level < getItemMeta(src.chain, src.level).maxLv) out.push(i);
  });
  return out;
}
