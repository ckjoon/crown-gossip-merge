// 테스트 공통: 결정적 Ctx와 상태 생성 도우미
import type { Ctx } from "../../src/core/ctx";

export function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

export function fixedCtx(rngValues: number[] = [0.5], now = 1_800_000_000_000): Ctx {
  return { now: () => now, rng: seqRng(rngValues) };
}
