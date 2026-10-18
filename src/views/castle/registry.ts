// registry.ts — 성 화면 인스턴스를 보상 연출(RewardDirector)이 찾을 수 있게 등록

import type { CastleView } from "./CastleView";

let view: CastleView | null = null;

export function setCastleView(v: CastleView | null): void {
  view = v;
}

export function getCastleView(): CastleView | null {
  return view;
}
