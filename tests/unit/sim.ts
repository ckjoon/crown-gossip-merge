// sim.ts — 밸런스 시뮬레이션 봇: 실제 core 액션만 써서 새 게임을 끝까지 플레이하고, 장(章)마다 쓴 번개와 레벨을 기록한다
// 사람보다 약간 효율적인 탐욕 전략: 주문 완료 > 복구 > 수집 > 합성(주문에 걸린 재료는 아낌) > 필요한 체인 생성 > 보드가 차면 판매

import { createInitialState } from "../../src/core/state";
import { spawnFromGenerator, moveOrMerge, collectItem, sellItem, unlockCobweb } from "../../src/core/actions/board";
import { computeWanted, getZoneProgress, initCustomerOrders, serveOrder } from "../../src/core/actions/orders";
import { renovate } from "../../src/core/actions/castle";
import { findSpot } from "../../src/core/rules/rooms";
import { CHAINS } from "../../src/core/rules/chains";
import { getSpotCoinCost } from "../../src/core/rules/progression";
import type { Ctx } from "../../src/core/ctx";
import type { GameState } from "../../src/core/types";

export interface ChapterLog {
  chapter: number;
  spotId: string;
  energy: number; // 이 장을 복구한 순간까지 누적 번개 (쓴 양)
  net: number; // 쓴 번개 − 게임 안에서 얻은 번개(번개 조각·레벨업) = 자연 충전으로 채워야 하는 양
  level: number;
  lockedEnergy: number; // 이 장 직전 레벨 잠금으로 기다리며 쓴 번개
  stars: Record<string, number>; // 이 장 복구 순간 체인별 가장 높은 생성기 등급 (★)
  dupStar3: number; // 같은 체인 ★3가 둘 이상인 경우의 남는 ★3 수
}

export interface SimResult {
  chapters: ChapterLog[];
  energy: number;
  income: number;
  steps: number;
  finished: boolean;
  state?: GameState;
}

function lcg(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export function simulate(seed = 7, maxEnergy = 80000): SimResult {
  const rng = lcg(seed);
  const ctx: Ctx = { now: () => 1_800_000_000_000, rng };
  const s: GameState = createInitialState(ctx);
  initCustomerOrders(s, ctx);
  let energy = 0;
  let income = 0;
  let steps = 0;
  let lockedEnergy = 0;
  const chapters: ChapterLog[] = [];

  const isCollectible = (c: string) => !!CHAINS[c as keyof typeof CHAINS]?.isCollectible;

  while (energy < maxEnergy && steps < 2_000_000) {
    steps++;
    // 번개는 무제한으로 두고 쓴 양만 센다
    if (s.energy < 50) s.energy = 1000;
    const e0 = s.energy;
    const gained = () => {
      if (s.energy > e0) income += s.energy - e0;
    };

    // 1. 주문 완료
    const w = computeWanted(s);
    const ready = w.status.findIndex((st) => st.allReady);
    if (ready !== -1) {
      serveOrder(s, ctx, { orderIdx: ready });
      gained();
      continue;
    }
    // 2. 복구
    const zp = getZoneProgress(s);
    if (!zp.nextSpotId) break;
    const found = findSpot(zp.nextSpotId)!;
    if (zp.nextSpotLockedLv === null && s.coins >= getSpotCoinCost(found.chapter)) {
      renovate(s, ctx, { spotId: zp.nextSpotId, styleIdx: 0 });
      gained();
      const stars: Record<string, number> = {};
      const star3: Record<string, number> = {};
      for (const c of [...s.board, ...s.bag]) {
        if (!c?.isGenerator) continue;
        stars[c.chain] = Math.max(stars[c.chain] ?? 0, c.level || 1);
        if ((c.level || 1) >= 3) star3[c.chain] = (star3[c.chain] ?? 0) + 1;
      }
      const dupStar3 = Object.values(star3).reduce((n, k) => n + Math.max(0, k - 1), 0);
      chapters.push({ chapter: found.chapter, spotId: found.spot.id, energy, net: energy - income, level: s.playerLv, lockedEnergy, stars, dupStar3 });
      lockedEnergy = 0;
      continue;
    }
    // 3. 수집 아이템(코인·번개)
    const col = s.board.findIndex((c) => c && c.state === "active" && !c.isGenerator && isCollectible(c.chain));
    if (col !== -1) {
      collectItem(s, ctx, { cell: col });
      gained(); // 번개 조각은 수입으로 센다
      continue;
    }
    // 3-1. 빈칸이 부족하면 코인으로 거미줄을 푼다 (🪙20)
    const empty = s.board.filter((c) => !c).length;
    if (empty < 4 && s.coins >= 40 && s.board.some((c) => c?.state === "cobweb")) {
      if (!unlockCobweb(s, ctx, { preferred: null }).some((e) => e.type === "rejected")) continue;
    }
    // 4. 합성: 주문에 걸린 재료는 건드리지 않음. 같은 체인·레벨 쌍(생성기 진화 포함)
    const needLv = new Map<string, number>();
    for (const o of s.orders) for (const r of o.reqs) needLv.set(r.chain, Math.max(needLv.get(r.chain) ?? 0, r.level));
    for (const c of s.board) if (c?.state === "cobweb") needLv.set(c.chain, Math.max(needLv.get(c.chain) ?? 0, c.level));
    let merged = false;
    // 4-1. 거미줄 칸은 같은 재료를 얹어 먼저 연다 (봉인 상자가 풀려 보드가 넓어짐)
    for (let i = 0; i < s.board.length && !merged; i++) {
      const web = s.board[i];
      if (!web || web.state !== "cobweb") continue;
      const j = s.board.findIndex((c, k) => k !== i && c && c.state === "active" && !c.isGenerator && c.chain === web.chain && c.level === web.level && !w.wantedUids.has(c.uid));
      if (j !== -1) merged = moveOrMerge(s, ctx, { from: j, to: i }).some((e) => e.type === "merged");
      gained();
    }
    if (merged) continue;
    const seen = new Map<string, number>();
    for (let i = 0; i < s.board.length && !merged; i++) {
      const c = s.board[i];
      if (!c || (c.state !== "active" && c.state !== "cobweb") || w.wantedUids.has(c.uid)) continue;
      if (c.isGenerator ? c.level >= 3 : c.level >= CHAINS[c.chain].items.length) continue;
      if (!c.isGenerator && c.chain !== "gem" && c.level >= (needLv.get(c.chain) ?? 0) && c.chain !== "combo") continue;
      const key = `${c.isGenerator ? "g" : "i"}:${c.chain}:${c.level}`;
      const j = seen.get(key);
      if (j !== undefined) {
        const a = s.board[j]!;
        const from = a.state === "active" ? j : i;
        const to = from === j ? i : j;
        if (s.board[from]!.state === "active") {
          const ev = moveOrMerge(s, ctx, { from, to });
          merged = ev.some((e) => e.type === "merged");
          gained();
        }
      } else seen.set(key, i);
    }
    if (merged) continue;
    // 5. 생성: 아직 못 채운 요구의 체인 생성기 중 그 레벨 이하를 만들 수 있는 가장 높은 등급, 없으면 거미줄 체인, 그래도 없으면 아무 생성기
    const minBase = (tier: number) => (tier <= 1 ? 1 : 2);
    const lacking: Array<{ chain: string; level: number }> = [];
    s.orders.forEach((o, oi) => o.reqs.forEach((r, ri) => !w.status[oi].reqFulfilled[ri] && lacking.push(r)));
    for (const c of s.board) if (c?.state === "cobweb") lacking.push({ chain: c.chain, level: c.level });
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < s.board.length; i++) {
      const c = s.board[i];
      if (!c?.isGenerator || c.state !== "active") continue;
      const fit = lacking.some((r) => r.chain === c.chain && minBase(c.level) <= r.level);
      const score = (fit ? 10 : 0) + c.level + rng() * 0.5;
      if (score > bestScore) {
        best = i;
        bestScore = score;
      }
    }
    if (best === -1) break;
    const before = s.energy;
    const ev = spawnFromGenerator(s, ctx, { cell: best });
    if (ev.some((e) => e.type === "spawned")) {
      const used = before - s.energy;
      energy += used;
      if (zp.nextSpotLockedLv !== null) lockedEnergy += used;
      continue;
    }
    // 6. 보드가 꽉 참: 쓸모없는 재료(필요 없는 체인이거나 필요 레벨 이상)부터, 그다음 가장 낮은 재료를 판다
    let sell = -1;
    let sellScore = Infinity;
    for (let i = 0; i < s.board.length; i++) {
      const c = s.board[i];
      if (!c || c.state !== "active" || c.isGenerator || w.wantedUids.has(c.uid)) continue;
      const useful = (needLv.get(c.chain) ?? 0) > c.level;
      const score = (useful ? 100 : 0) + c.level;
      if (score < sellScore) {
        sell = i;
        sellScore = score;
      }
    }
    if (sell === -1) break;
    sellItem(s, ctx, { cell: sell });
  }
  return { chapters, energy, income, steps, finished: !getZoneProgress(s).nextSpotId, state: s };
}
