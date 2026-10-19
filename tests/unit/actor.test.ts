import { test, expect } from "vitest";
import { ROOMS } from "../../src/core/rules/rooms";
import type { SpotState, ZoneKey } from "../../src/core/types";
import { CELL, ZONE_MODULES, moduleCells, moduleStates } from "../../src/views/castle/modules";
import { walkTargets, zoneGuests } from "../../src/views/castle/actor";
import { CHARACTER_LOOKS } from "../../src/views/castle/characters3d";

const ZONES = Object.keys(ROOMS) as ZoneKey[];
function rooms(zone: ZoneKey, n: number): Record<string, SpotState> {
  const r: Record<string, SpotState> = {};
  for (const z of ZONES) ROOMS[z].spots.forEach((s, i) => (r[s.id] = { done: z === zone && i < n, styleIdx: 0 }));
  return r;
}

test("걷기 목표는 지어진 조각 칸 안에만 있음 (폐허·청사진 제외)", () => {
  for (const zone of ZONES)
    for (const n of [0, 2, 5]) {
      const r = rooms(zone, n);
      const states = moduleStates(zone, (id) => !!r[id]?.done);
      const pts = walkTargets(zone, states);
      expect(pts.length).toBeGreaterThan(0);
      const built = ZONE_MODULES[zone].flatMap((d, i) => (states[i] === "built" ? moduleCells(d) : []));
      for (const [x, z] of pts) {
        const inside = built.some(([cx, cz]) => Math.abs(x - cx * CELL) < CELL / 2 - 0.4 && Math.abs(z - cz * CELL) < CELL / 2 - 0.4);
        expect(inside, `${zone} ${n} ${x},${z}`).toBe(true);
      }
    }
});

test("손님은 그 구역 복구한 장소 대사에 나온 캐릭터 중 최대 2명, 주민·중복 제외, 모두 3D 외형이 있음", () => {
  expect(zoneGuests("alchemy", rooms("alchemy", 0), "selene")).toEqual([]);
  const g = zoneGuests("alchemy", rooms("alchemy", 5), "selene");
  expect(g.length).toBeLessThanOrEqual(2);
  expect(g.length).toBeGreaterThan(0);
  expect(g).not.toContain("selene");
  expect(new Set(g).size).toBe(g.length);
  for (const z of ZONES) for (const id of zoneGuests(z, rooms(z, 5), "x")) expect(CHARACTER_LOOKS[id], id).toBeTruthy();
  // 퀸 & 네로는 각각의 캐릭터로 나뉘어 등장
  for (const z of ZONES) expect(zoneGuests(z, rooms(z, 5), "x")).not.toContain("quinn_nero");
});

import { tapLine } from "../../src/views/castle/actor";
test("탭 대사: 이미 본 이야기의 그 캐릭터 대사 중 하나, 없으면 짧은 인사", () => {
  const r = rooms("alchemy", 1);
  const line = tapLine("selene", r, () => 0);
  expect(ROOMS.alchemy.spots[0].dialogues.map((d) => d.line)).toContain(line);
  expect(tapLine("oberon", rooms("alchemy", 0), () => 0).length).toBeGreaterThan(0);
});

// ---- 리뷰 반영 ----
import * as THREE from "three";
import { walkPath } from "../../src/views/castle/actor";
import { ACC_BUILDERS, buildAnimal } from "../../src/views/castle/characters3d";

test("걷는 경로는 문을 거쳐 지어진 조각 안으로만 지나감 (바깥 벽·빈 공간을 가로지르지 않음)", () => {
  for (const zone of ZONES)
    for (const n of [2, 3, 5]) {
      const r = rooms(zone, n);
      const states = moduleStates(zone, (id) => !!r[id]?.done);
      const built = ZONE_MODULES[zone].flatMap((d, i) => (states[i] === "built" ? moduleCells(d) : []));
      const inside = (x: number, z: number) => built.some(([cx, cz]) => Math.abs(x - cx * CELL) <= CELL / 2 + 0.01 && Math.abs(z - cz * CELL) <= CELL / 2 + 0.01);
      const pts = walkTargets(zone, states);
      for (const a of pts)
        for (const b of pts) {
          const path = [a, ...walkPath(zone, states, a, b)];
          expect(path[path.length - 1]).toEqual(b);
          for (let k = 1; k < path.length; k++)
            for (let t = 0; t <= 1; t += 0.05) {
              const x = path[k - 1][0] + (path[k][0] - path[k - 1][0]) * t;
              const z = path[k - 1][1] + (path[k][1] - path[k - 1][1]) * t;
              expect(inside(x, z), `${zone} n${n} ${a}→${b} @${x.toFixed(1)},${z.toFixed(1)}`).toBe(true);
            }
        }
    }
});

test("캐릭터 메시는 그림자 맵에 그리지 않음 (그림자는 멈춰 있는 그림자 맵에 남으므로 발밑 원형 그림자만)", () => {
  const meshes: THREE.Mesh[] = [];
  for (const k of ["cat", "bird"] as const) buildAnimal(k).root.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
  for (const f of Object.values(ACC_BUILDERS)) f().obj.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
  expect(meshes.length).toBeGreaterThan(10);
  for (const m of meshes) expect(m.castShadow).toBe(false);
});

// ---- v3.7 ----
test("탭 대사: 퀸·네로가 함께 한 대사(quinn_nero)도 퀸과 네로 각자의 탭 대사 후보", () => {
  const all = Object.fromEntries((Object.keys(ROOMS) as ZoneKey[]).flatMap((z) => ROOMS[z].spots.map((s) => [s.id, { done: true, styleIdx: 0 }])));
  const together = (Object.keys(ROOMS) as ZoneKey[]).flatMap((z) => ROOMS[z].spots.flatMap((s) => s.dialogues.filter((d) => d.characterId === "quinn_nero").map((d) => d.line)));
  expect(together.length).toBeGreaterThan(0);
  for (const id of ["quinn", "nero"]) {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(tapLine(id, all, () => i / 400));
    for (const line of together) expect(seen, id).toContain(line);
  }
});
