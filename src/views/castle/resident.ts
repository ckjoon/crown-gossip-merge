// resident.ts — 구역마다 방에 사는 주민 캐릭터 (v3.6부터 3D 캐릭터로 actor.ts가 그린다). 위치는 입구 홀 앞쪽 빈 바닥

import type { ZoneKey } from "../../core/types";

export const ZONE_RESIDENT: Record<ZoneKey, { id: string; robe: string; pos: [number, number, number] }> = {
  alchemy: { id: "selene", robe: "#5b21b6", pos: [1.3, 0, 1.3] },
  harbor: { id: "quinn", robe: "#155e75", pos: [1.3, 0, 1.3] },
  garden: { id: "nero", robe: "#1f2937", pos: [1.3, 0, 1.3] },
  banquet: { id: "lucian", robe: "#7f1d1d", pos: [1.3, 0, 1.3] },
  cellar: { id: "margaret", robe: "#57534e", pos: [1.3, 0, 1.3] },
  tower: { id: "oberon", robe: "#312e81", pos: [1.3, 0, 1.3] },
};
