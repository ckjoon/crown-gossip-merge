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
