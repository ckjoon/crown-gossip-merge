import { test, expect } from "vitest";
import * as THREE from "three";
import { ROOMS } from "../../src/core/rules/rooms";
import type { ZoneKey } from "../../src/core/types";
import { moduleStates } from "../../src/views/castle/modules";
import { buildModules } from "../../src/views/castle/roomBuilder";

const doneUpTo = (zone: ZoneKey, n: number) => (id: string) => ROOMS[zone].spots.findIndex((s) => s.id === id) < n;

function meshes(g: THREE.Object3D, pred: (m: THREE.Mesh) => boolean): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if ((m.isMesh || (o as THREE.Line).isLine) && !m.userData.outline && pred(m)) out.push(m);
  });
  return out;
}

const height = (m: THREE.Mesh) => new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()).y;

test("홀만 지어지고 조각 1은 폐허: 바닥은 홀·폐허에만, 나머지는 청사진", () => {
  const g = buildModules("alchemy", moduleStates("alchemy", doneUpTo("alchemy", 0)));
  expect(meshes(g, (m) => m.userData.role === "floor" && m.userData.module === 0).length).toBe(1);
  expect(meshes(g, (m) => m.userData.role === "floor" && m.userData.module === 1).length).toBeGreaterThanOrEqual(1);
  expect(meshes(g, (m) => m.userData.role === "door").length).toBe(0);
  const ghosts = meshes(g, (m) => m.userData.role === "ghost");
  expect(new Set(ghosts.map((m) => m.userData.module))).toEqual(new Set([2, 3, 4, 5]));
  for (const m of ghosts) {
    expect((m.material as THREE.Material).transparent).toBe(true);
    expect(m.userData.noOutline).toBe(true);
  }
  expect(meshes(g, (m) => m.userData.role === "broken" && m.userData.module === 1).length).toBeGreaterThan(0);
});

test("조각 1이 지어지면 홀과의 문이 생김", () => {
  const g = buildModules("alchemy", moduleStates("alchemy", doneUpTo("alchemy", 1)));
  expect(meshes(g, (m) => m.userData.role === "door").length).toBeGreaterThan(0);
});

test("구역별 벽 스타일: 공방은 높은 돌벽, 하버는 낮은 난간, 정원은 생울타리", () => {
  const wallH = (zone: ZoneKey) => {
    const g = buildModules(zone, moduleStates(zone, doneUpTo(zone, 5)));
    return Math.max(...meshes(g, (m) => m.userData.role === "wall").map(height));
  };
  expect(wallH("alchemy")).toBeGreaterThanOrEqual(4);
  expect(wallH("banquet")).toBeGreaterThanOrEqual(4);
  expect(wallH("harbor")).toBeLessThan(2);
  const garden = wallH("garden");
  expect(garden).toBeGreaterThan(1.4);
  expect(garden).toBeLessThan(2.5);
});

test("바깥 벽마다 발광 장식 (방 분위기 단계에 따라 밝아짐)", () => {
  for (const zone of Object.keys(ROOMS) as ZoneKey[]) {
    const g = buildModules(zone, moduleStates(zone, doneUpTo(zone, 5)));
    const orn = meshes(g, (m) => m.userData.role === "ornament");
    expect(orn.length, zone).toBeGreaterThan(0);
    expect(orn.some((m) => typeof (m.material as THREE.Material).userData.glowBase === "number"), zone).toBe(true);
  }
});
