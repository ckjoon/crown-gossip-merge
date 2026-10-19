// codex.ts — 도감 발견 기록 (v3.9): 보드·보관함에 보인 재료(봉인 상자 속은 제외)의 체인별 최고 단계를 기억한다
// 생성기 등급은 따로 저장하지 않는다 — 생성기는 팔 수 없고 합치면 오르기만 하므로 지금 가진 최고 등급이 곧 발견한 등급

import { getGeneratorTierMeta } from "./rules/chains";
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
