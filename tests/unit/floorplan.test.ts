import { test, expect } from "vitest";
import * as THREE from "three";
import { ROOMS } from "../../src/core/rules/rooms";
import type { SpotState, ZoneKey } from "../../src/core/types";
import { MAP_SCALE, WING_COLOR, WING_OFFSET, buildFloorplan, wingBox, wingPinPos } from "../../src/views/castle/floorplan";

const ZONES = Object.keys(ROOMS) as ZoneKey[];

function rooms(doneIds: string[]): Record<string, SpotState> {
  const r: Record<string, SpotState> = {};
  for (const z of ZONES) for (const s of ROOMS[z].spots) r[s.id] = { done: doneIds.includes(s.id), styleIdx: 0 };
  return r;
}

function parts(g: THREE.Object3D, pred: (o: THREE.Object3D) => boolean): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  g.traverse((o) => !o.userData.outline && pred(o) && out.push(o));
  return out;
}

test("날개 4개와 가운데 안뜰이 서로 겹치지 않음", () => {
  const boxes = ZONES.map((z) => wingBox(z));
  boxes.push({ minX: -1.5, maxX: 1.5, minZ: -1.5, maxZ: 1.5 });
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
      expect(overlap, `${i}-${j}`).toBe(false);
    }
  expect(MAP_SCALE).toBeGreaterThan(0);
  expect(Object.keys(WING_OFFSET).sort()).toEqual([...ZONES].sort());
});

test("날개마다 조각 블록 6개, 잠긴 구역은 청사진 + 자물쇠, 지어진 조각은 구역 색", () => {
  const g = new THREE.Group();
  buildFloorplan(g, rooms(["alc_cauldron"]), ["alchemy"]);
  for (const z of ZONES) {
    const blocks = parts(g, (o) => o.userData.wing === z && ["built", "ruin", "ghost"].includes(o.userData.role));
    expect(new Set(blocks.map((o) => o.userData.module)).size, z).toBe(6);
  }
  const harbor = parts(g, (o) => o.userData.wing === "harbor" && o.userData.module !== undefined);
  expect(harbor.every((o) => o.userData.role === "ghost")).toBe(true);
  expect(parts(g, (o) => o.userData.wing === "harbor" && o.userData.role === "lock").length).toBeGreaterThan(0);
  expect(parts(g, (o) => o.userData.wing === "alchemy" && o.userData.role === "lock").length).toBe(0);
  const built = parts(g, (o) => o.userData.wing === "alchemy" && o.userData.role === "built") as THREE.Mesh[];
  expect(new Set(built.map((o) => o.userData.module))).toEqual(new Set([0, 1]));
  for (const m of built) expect((m.material as THREE.MeshStandardMaterial).color.getHex()).toBe(WING_COLOR.alchemy);
  expect(parts(g, (o) => o.userData.wing === "alchemy" && o.userData.role === "ruin").map((o) => o.userData.module)).toContain(2);
});

test("구역 핀은 날개 가운데 위", () => {
  for (const z of ZONES) {
    const b = wingBox(z);
    const [x, y, zz] = wingPinPos(z);
    expect(x).toBeCloseTo((b.minX + b.maxX) / 2);
    expect(zz).toBeCloseTo((b.minZ + b.maxZ) / 2);
    expect(y).toBeGreaterThan(0.5);
  }
});
