// codex.ts — 도감 발견 기록 (v3.9): 보드·보관함에 보인 재료(봉인 상자 속은 제외)의 체인별 최고 단계를 기억한다
// 생성기 등급은 따로 저장하지 않는다 — 생성기는 팔 수 없고 합치면 오르기만 하므로 지금 가진 최고 등급이 곧 발견한 등급

import { CHAINS, getGeneratorTierMeta } from "./rules/chains";
import { spawnRange } from "./rules/progression";
import type { ChainId, GameState } from "./types";

// 지금 보이는 재료로 발견 기록을 올린다 (내려가지는 않음). store가 행동마다 부르고, 불러오기·새 게임도 한 번 부른다
export function sweepCodex(s: GameState): void {
  for (const it of [...s.board, ...s.bag]) {
    if (!it || it.isGenerator || it.state === "crate") continue;
    if ((s.codexSeen[it.chain] ?? 0) < it.level) s.codexSeen[it.chain] = it.level;
  }
}

export function itemSeen(s: Pick<GameState, "codexSeen">, chain: ChainId, level: number): boolean {
  return level <= (s.codexSeen[chain] ?? 0);
}

// 이 체인에서 가진 생성기 최고 등급 (없으면 0)
export function generatorSeen(s: Pick<GameState, "board" | "bag">, chain: ChainId): number {
  return [...s.board, ...s.bag].reduce((m, it) => (it?.isGenerator && it.chain === chain ? Math.max(m, it.level || 1) : m), 0);
}

// 주문 안내에 쓰는 생성기 이름: 지금 가진 최고 등급의 이름 (없으면 ★1 이름)
export function generatorName(s: Pick<GameState, "board" | "bag">, chain: ChainId): string {
  return getGeneratorTierMeta(chain, generatorSeen(s, chain) || 1).name;
}

// 이 재료(레벨)를 바로 만들 수 있는 보드 위 생성기 중 가장 높은 등급의 칸. 없으면 그 체인의 가장 높은 등급, 그것도 없으면 -1
export function generatorCellFor(s: Pick<GameState, "board">, chain: ChainId, level: number): number {
  let best = -1;
  let bestScore = -1;
  s.board.forEach((it, i) => {
    if (!it?.isGenerator || it.chain !== chain || it.state !== "active") return;
    const tier = it.level || 1;
    const score = (spawnRange(tier).min <= level ? 10 : 0) + tier;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

// 아이템 계보 (v3.11 계보 화면): 어디서 오는지, 단계마다 어떻게 얻는지(지금 가진 생성기 등급 기준), 지금 단계, 열린 주문이 원하는 수
// how — spawn: 생성기(또는 출처)에서 바로, boost: ⚡배속으로 바로, merge: 아래 단계 둘을 합쳐서만, below: 지금 생성기로는 안 나오는 낮은 단계,
// recipe: 조합품 (단계끼리 합치지 않고 각자 다른 재료 둘을 조합)
export type LineageHow = "spawn" | "boost" | "merge" | "below" | "recipe";
export type LineageSource =
  | { kind: "generator"; chain: ChainId; tier: number; name: string }
  | { kind: "byproduct"; chain: ChainId; tier: number; name: string }
  | { kind: "drop"; fromOrders: boolean }
  | { kind: "recipe" };
export interface LineageStep {
  level: number;
  name: string | null; // 아직 못 본 단계는 null
  how: LineageHow;
  current: boolean;
}
export interface Lineage {
  source: LineageSource;
  steps: LineageStep[];
  wanted: number;
}

// genTier: 생성기 화면에서 고른 생성기 등급 (없으면 가진 최고 등급 기준). 생성기가 없으면 바로 나오는 단계 없이 모두 합성으로만
export function itemLineage(s: Pick<GameState, "board" | "bag" | "codexSeen" | "orders">, chain: ChainId, level: number, genTier?: number): Lineage {
  const ch = CHAINS[chain];
  const byproductOf = (Object.keys(CHAINS) as ChainId[]).find((k) => CHAINS[k].rareDropChain === chain);
  let source: LineageSource;
  let how: (lv: number) => LineageHow;
  if (ch.generator) {
    const tier = genTier ?? generatorSeen(s, chain);
    const r = spawnRange(tier || 1);
    source = { kind: "generator", chain, tier, name: genTier ? getGeneratorTierMeta(chain, genTier).name : generatorName(s, chain) };
    how = (lv) => (!tier ? "merge" : lv < r.min ? "below" : lv <= r.max ? "spawn" : lv <= r.boostMax ? "boost" : "merge");
  } else if (byproductOf) {
    // 부산물은 생성기 등급과 같은 단계로 나오고 (★1 → Lv.1, ★2 → Lv.2, ★3 → Lv.3), 배속을 쓰면 그 등급의 배속 상한까지 (board.spawnFromGenerator)
    const tier = generatorSeen(s, byproductOf);
    const cap = Math.min(spawnRange(tier || 1).boostMax, ch.items.length);
    source = { kind: "byproduct", chain: byproductOf, tier, name: generatorName(s, byproductOf) };
    how = (lv) => (!tier ? "merge" : lv < tier ? "below" : lv === tier ? "spawn" : lv <= cap ? "boost" : "merge");
  } else if (ch.isCollectible) {
    source = { kind: "drop", fromOrders: chain === "energy" };
    how = (lv) => (lv === 1 ? "spawn" : "merge");
  } else {
    source = { kind: "recipe" };
    how = () => "recipe";
  }
  const steps = ch.items.map((it) => ({
    level: it.level,
    name: ch.isCollectible || itemSeen(s, chain, it.level) || it.level === level ? it.name : null,
    how: how(it.level),
    current: it.level === level,
  }));
  const wanted = s.orders.reduce((n, o) => n + o.reqs.filter((r) => r.chain === chain && r.level === level).length, 0);
  return { source, steps, wanted };
}
