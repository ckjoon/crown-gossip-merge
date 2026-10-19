// resident.ts — 구역마다 방에 사는 주민 캐릭터 (v3.6부터 3D 캐릭터로 actor.ts가 그린다). 위치는 입구 홀 앞쪽 빈 바닥

import type { ZoneKey } from "../../core/types";

export const ZONE_RESIDENT: Record<ZoneKey, { id: string; pos: [number, number] }> = {
  alchemy: { id: "selene", pos: [1.3, 1.3] },
  harbor: { id: "quinn", pos: [1.3, 1.3] },
  garden: { id: "nero", pos: [1.3, 1.3] },
  banquet: { id: "lucian", pos: [1.3, 1.3] },
  cellar: { id: "margaret", pos: [1.3, 1.3] },
  tower: { id: "oberon", pos: [1.3, 1.3] },
};
