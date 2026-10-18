// 테스트 공통: 결정적 Ctx와 상태 생성 도우미
import type { Ctx } from "../../src/core/ctx";

export function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

export function fixedCtx(rngValues: number[] = [0.5], now = 1_800_000_000_000): Ctx {
  return { now: () => now, rng: seqRng(rngValues) };
}

import type { BoardItem, ChainId, GameState } from "../../src/core/types";
import { TOTAL_CELLS } from "../../src/core/types";

let testUid = 0;
export function item(chain: ChainId, level: number, extra: Partial<BoardItem> = {}): BoardItem {
  testUid += 1;
  return { uid: `t${testUid}`, state: "active", isGenerator: false, chain, level, ...extra };
}
export function gen(chain: ChainId, level = 1): BoardItem {
  return item(chain, level, { isGenerator: true });
}
export function emptyBoard(s: GameState): void {
  s.board = new Array(TOTAL_CELLS).fill(null);
}
