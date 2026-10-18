// ctx.ts — core에 주입하는 시간·난수 (테스트에서 고정 가능) + 상태 기반 고유 id

import type { GameState } from "./types";

export interface Ctx {
  now: () => number;
  rng: () => number;
}

export function createCtx(): Ctx {
  return { now: () => Date.now(), rng: () => Math.random() };
}

export function newUid(state: GameState): string {
  state.uidSeq += 1;
  return `u${state.uidSeq}`;
}
