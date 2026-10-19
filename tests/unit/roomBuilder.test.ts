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

// ---- 리뷰 반영 ----
import { SPOT_LAYOUT } from "../../src/views/castle/layout";
import { gsap } from "gsap";
import { animateModuleAppear } from "../../src/views/castle/roomBuilder";

test("창문형 장소가 걸린 벽에는 벽 장식을 달지 않음 (창문과 겹침 방지)", () => {
  for (const zone of Object.keys(ROOMS) as ZoneKey[]) {
    const g = buildModules(zone, moduleStates(zone, doneUpTo(zone, 5)));
    g.updateMatrixWorld(true);
    for (const s of ROOMS[zone].spots) {
      const l = SPOT_LAYOUT[s.id];
      if (l.type !== "window") continue;
      const [x, y, z] = l.pos;
      const win = new THREE.Box3(new THREE.Vector3(x - 1.5, y - 1.3, z - 0.4), new THREE.Vector3(x + 1.5, y + 1.3, z + 0.7));
      for (const m of meshes(g, (o) => o.userData.role === "ornament")) {
        expect(new THREE.Box3().setFromObject(m).intersectsBox(win), `${zone} ${s.id}`).toBe(false);
      }
    }
  }
});

test("복구 직후 다음 폐허는 숨겨진 채 청사진으로 보이다가, 나타남 연출에서 자란다", () => {
  const states = moduleStates("alchemy", doneUpTo("alchemy", 1));
  const g = buildModules("alchemy", states, { appearing: 2 });
  const ruinParts = g.children.filter((o) => o.userData.module === 2 && o.userData.role !== "ghost");
  const ghostParts = g.children.filter((o) => o.userData.module === 2 && o.userData.role === "ghost");
  expect(ruinParts.length).toBeGreaterThan(0);
  expect(ghostParts.length).toBeGreaterThan(0);
  for (const o of ruinParts) expect(o.scale.x).toBeLessThan(0.05);
  animateModuleAppear(g, 2);
  for (const o of ruinParts) expect(gsap.getTweensOf(o.scale).length).toBeGreaterThan(0);
  gsap.globalTimeline.getChildren().forEach((t) => t.progress(1));
  for (const o of ruinParts) expect(o.scale.x).toBeCloseTo(1);
  expect(g.children.filter((o) => o.userData.module === 2 && o.userData.role === "ghost").length).toBe(0);
});

// v3.7.1: 방을 다시 지을 때마다 새 재질을 만들지 않음 (촛대·깃발 포함 — 해제하지 않는 공유 재질이라 쌓이면 새는 것)
test("조각을 다시 그려도 모든 재질이 구역 공유 재질 (새로 만든 재질 없음)", () => {
  for (const zone of Object.keys(ROOMS) as ZoneKey[]) {
    const st = moduleStates(zone, doneUpTo(zone, 5));
    const seen = new Set<THREE.Material>();
    meshes(buildModules(zone, st), () => true).forEach((m) => seen.add(m.material as THREE.Material));
    meshes(buildModules(zone, st), () => true).forEach((m) => expect(seen.has(m.material as THREE.Material), zone).toBe(true));
  }
});
