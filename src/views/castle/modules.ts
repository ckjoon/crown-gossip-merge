// modules.ts — 레고식 방 조각: 구역마다 입구 홀 + 장소 5곳의 조각을 격자에 붙여 둔 배치표와,
// 복구 상태에 따른 모양(지어짐·폐허·청사진)·벽과 문·카메라 범위 계산. 순수 계산만 (three 없음)
// 카메라는 +x·+z 쪽에서 내려다보므로 벽은 먼 쪽(-x·-z) 변에만 세우고, 가까운 쪽은 낮은 턱만 둔다

import type { ZoneKey } from "../../core/types";
import { ROOMS } from "../../core/rules/rooms";

export const CELL = 5; // 격자 한 칸 = 월드 5단위
export const WALL_H = 4.2;

export type ModuleKind = "hall" | "alcove" | "tower" | "corridor" | "terrace";

export interface ModuleDef {
  spotId: string | null; // null = 입구 홀
  gx: number;
  gz: number;
  w: number; // x 방향 칸 수
  d: number; // z 방향 칸 수
  kind: ModuleKind;
  parent: number | null; // 붙는 이웃 조각 (맞닿은 변에 문이 난다)
}

export type ModuleState = "built" | "ruin" | "ghost";
export type EdgeKind = "wall" | "low" | "curb" | "door" | "open" | "broken";
export type Side = "-x" | "+x" | "-z" | "+z";

export interface EdgeSpec {
  mod: number;
  kind: EdgeKind;
  side: Side;
  x: number; // 변 중심 (월드)
  z: number;
  along: "x" | "z"; // 변이 뻗는 방향
  other?: number; // 맞닿은 이웃 조각 (없으면 바깥)
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function m(spotId: string | null, gx: number, gz: number, kind: ModuleKind, parent: number | null, w = 1, d = 1): ModuleDef {
  return { spotId, gx, gz, w, d, kind, parent };
}

const hall = () => m(null, 0, 0, "hall", null);

export const ZONE_MODULES: Record<ZoneKey, ModuleDef[]> = {
  alchemy: [
    hall(),
    m("alc_cauldron", -1, 0, "alcove", 0),
    m("alc_bookcase", -1, -1, "tower", 1),
    m("alc_herbtable", 0, -1, "alcove", 0),
    m("alc_window", 0, -2, "alcove", 3),
    m("alc_counter", 1, 0, "corridor", 0, 2, 1),
  ],
  harbor: [
    hall(),
    m("hb_espresso", 0, -1, "alcove", 0),
    m("hb_parasol", 1, 0, "terrace", 0, 2, 1),
    m("hb_fountain", -1, -1, "terrace", 1),
    m("hb_bakery", 1, -1, "alcove", 2),
    m("hb_arch", 0, -2, "alcove", 1),
  ],
  garden: [
    hall(),
    m("gd_pond", -1, 0, "terrace", 0, 1, 2),
    m("gd_gazebo", 1, 0, "terrace", 0),
    m("gd_planter", 0, -1, "alcove", 0),
    m("gd_teabar", 1, -1, "alcove", 2),
    m("gd_dome", -1, -1, "tower", 3),
  ],
  banquet: [
    hall(),
    m("bq_astrolabe", 0, -1, "tower", 0),
    m("bq_library", -1, -1, "alcove", 1),
    m("bq_feast", 1, 0, "corridor", 0, 2, 1),
    m("bq_hearth", 1, -1, "alcove", 3),
    m("bq_portal", 0, -2, "tower", 1),
  ],
  cellar: [
    hall(),
    m("cel_wine", -2, 0, "corridor", 0, 2, 1),
    m("cel_candle", 0, -1, "alcove", 0),
    m("cel_passage", -2, -1, "corridor", 1),
    m("cel_vault", 1, 0, "alcove", 0),
    m("cel_map", 1, -1, "alcove", 4),
  ],
  tower: [
    hall(),
    m("tw_loom", 0, -1, "tower", 0),
    m("tw_tapestry", -1, -1, "alcove", 1),
    m("tw_carpet", 1, 0, "terrace", 0, 1, 2),
    m("tw_mirror", 0, -2, "alcove", 1),
    m("tw_crown", 1, -1, "tower", 1),
  ],
};

export function moduleCells(d: ModuleDef): [number, number][] {
  const out: [number, number][] = [];
  for (let x = 0; x < d.w; x++) for (let z = 0; z < d.d; z++) out.push([d.gx + x, d.gz + z]);
  return out;
}

export function moduleCenter(d: ModuleDef): [number, number] {
  return [(d.gx + (d.w - 1) / 2) * CELL, (d.gz + (d.d - 1) / 2) * CELL];
}

export function moduleIndexOf(zone: ZoneKey, spotId: string): number {
  return ZONE_MODULES[zone].findIndex((d) => d.spotId === spotId);
}

// 입구 홀과 복구한 장소는 지어짐, 이야기 순서상 다음 장소는 폐허, 나머지는 청사진. 잠긴 구역은 모두 청사진
export function moduleStates(zone: ZoneKey, done: (spotId: string) => boolean, unlocked = true): ModuleState[] {
  let ruinGiven = false;
  return ZONE_MODULES[zone].map((d) => {
    if (!unlocked) return "ghost";
    if (!d.spotId || done(d.spotId)) return "built";
    if (!ruinGiven) {
      ruinGiven = true;
      return "ruin";
    }
    return "ghost";
  });
}

const SIDES: [Side, number, number][] = [
  ["-x", -1, 0],
  ["+x", 1, 0],
  ["-z", 0, -1],
  ["+z", 0, 1],
];

// 지어진 조각 칸의 네 변: 같은 조각이면 없음, 지어진 이웃과는 문(부모·자식)이나 트임, 그 밖에는 먼 쪽 벽/가까운 쪽 턱
// 이웃이 폐허·청사진이면 먼 쪽 벽을 낮춰 그 너머가 보이게 한다. 폐허 조각은 먼 쪽 바깥 변에 무너진 벽만
export function moduleEdges(defs: ModuleDef[], states: ModuleState[]): EdgeSpec[] {
  const owner = new Map<string, number>();
  defs.forEach((d, i) => moduleCells(d).forEach(([x, z]) => owner.set(`${x},${z}`, i)));
  const out: EdgeSpec[] = [];
  defs.forEach((d, i) => {
    const st = states[i];
    if (st === "ghost") return;
    for (const [cx, cz] of moduleCells(d)) {
      for (const [side, dx, dz] of SIDES) {
        const o = owner.get(`${cx + dx},${cz + dz}`);
        if (o === i) continue;
        const far = side === "-x" || side === "-z";
        const neighborBuilt = o !== undefined && states[o] === "built";
        let kind: EdgeKind;
        if (st === "ruin") {
          if (!far || neighborBuilt) continue;
          kind = "broken";
        } else if (neighborBuilt) {
          if (o! < i) continue; // 공유 변은 번호가 작은 쪽에서 한 번만
          kind = defs[o!].parent === i || d.parent === o ? "door" : "open";
        } else if (far) kind = o === undefined ? "wall" : "low";
        else kind = "curb";
        out.push({ mod: i, kind, side, x: (cx + dx / 2) * CELL, z: (cz + dz / 2) * CELL, along: dx === 0 ? "x" : "z", other: o });
      }
    }
  });
  return out;
}

// 장소 위치: 바닥 가구는 조각 가운데(살짝 뒤), 벽에 거는 가구는 조각 첫 칸의 뒷벽(-z) 바로 앞
export function spotAnchor(zone: ZoneKey, spotId: string, wallY: number | null): [number, number, number] {
  const d = ZONE_MODULES[zone][moduleIndexOf(zone, spotId)];
  if (!d) return [0, 0, 0];
  if (wallY !== null) return [d.gx * CELL, wallY, (d.gz - 0.5) * CELL + 0.3];
  const [x, z] = moduleCenter(d);
  return [x, 0, z - 0.3];
}

export function zoneBounds(defs: ModuleDef[], states: ModuleState[]): Bounds {
  const b: Bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  defs.forEach((d, i) => {
    if (states[i] === "ghost") return;
    b.minX = Math.min(b.minX, (d.gx - 0.5) * CELL);
    b.maxX = Math.max(b.maxX, (d.gx + d.w - 0.5) * CELL);
    b.minZ = Math.min(b.minZ, (d.gz - 0.5) * CELL);
    b.maxZ = Math.max(b.maxZ, (d.gz + d.d - 0.5) * CELL);
  });
  if (!isFinite(b.minX)) return { minX: -CELL / 2, maxX: CELL / 2, minZ: -CELL / 2, maxZ: CELL / 2 };
  return b;
}

// 화면 가로는 아이소 대각선(x−z) 방향이라 두 변 길이의 합에 비례해 줄인다 (넓어지면 끌어서 둘러봄)
export function fitZoom(b: Bounds): number {
  return Math.max(0.85, Math.min(1.8, 32 / (b.maxX - b.minX + (b.maxZ - b.minZ))));
}

export function panClamp(b: Bounds, x: number, z: number): [number, number] {
  return [Math.max(b.minX, Math.min(b.maxX, x)), Math.max(b.minZ, Math.min(b.maxZ, z))];
}
