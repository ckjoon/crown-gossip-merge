// portraitManifest.ts — tools/bake-portraits.mjs가 생성. 3D 모델에서 구운 초상화가 있는 캐릭터 목록 (없으면 벡터 초상화)
import type { Expression } from "../../core/rules/expressions";

export const BAKED_PORTRAITS: ReadonlySet<string> = new Set(["arthur","carmen","ella","harrison","lily","lucian","marco","margaret","nero","oberon","olivia","pip","quinn","quinn_nero","rowan","selene","verna"]);

export function bakedPortraitUrl(id: string, expr: Expression): string {
  return `/portraits/${id}_${expr}.jpg`;
}
