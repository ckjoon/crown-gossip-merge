import { test, expect } from "vitest";
import { ROOMS } from "../../src/core/rules/rooms";
import type { ZoneKey } from "../../src/core/types";
import {
  CELL,
  ZONE_MODULES,
  moduleCells,
  moduleEdges,
  moduleStates,
  panClamp,
  spotAnchor,
  zoneBounds,
  type ModuleState,
} from "../../src/views/castle/modules";

const ZONES = Object.keys(ROOMS) as ZoneKey[];
// 벽에 거는 장소 (창문형 가구)
const WALL_SPOTS = new Set(["alc_window", "hb_arch", "gd_dome", "bq_portal", "cel_map", "tw_tapestry"]);
const doneUpTo = (zone: ZoneKey, n: number) => (id: string) => ROOMS[zone].spots.findIndex((s) => s.id === id) < n;

for (const zone of ZONES) {
  test(`${zone}: 입구 홀 + 장소 5곳 조각, 이야기 순서, 트리로 연결, 겹침 없음`, () => {
    const defs = ZONE_MODULES[zone];
    expect(defs.length).toBe(6);
    expect(defs[0].kind).toBe("hall");
    expect(defs[0].spotId).toBeNull();
    expect(defs.slice(1).map((d) => d.spotId)).toEqual(ROOMS[zone].spots.map((s) => s.id));
    const seen = new Set<string>();
    defs.forEach((d, i) => {
      for (const [x, z] of moduleCells(d)) {
        const k = `${x},${z}`;
        expect(seen.has(k), `${zone} 조각 ${i} 칸 겹침 ${k}`).toBe(false);
        seen.add(k);
      }
      if (i === 0) return expect(d.parent).toBeNull();
      expect(d.parent).not.toBeNull();
      expect(d.parent!).toBeLessThan(i);
      const pc = moduleCells(defs[d.parent!]);
      const touch = moduleCells(d).some(([x, z]) => pc.some(([px, pz]) => Math.abs(px - x) + Math.abs(pz - z) === 1));
      expect(touch, `${zone} 조각 ${i}가 부모와 맞닿지 않음`).toBe(true);
    });
  });

  test(`${zone}: 창문형 장소 조각은 뒤(-z)가 막힌 바깥 벽`, () => {
    const defs = ZONE_MODULES[zone];
    const cells = new Set(defs.flatMap((d) => moduleCells(d).map(([x, z]) => `${x},${z}`)));
    for (const d of defs) if (d.spotId && WALL_SPOTS.has(d.spotId)) expect(cells.has(`${d.gx},${d.gz - 1}`)).toBe(false);
  });

  test(`${zone}: 장소 위치는 자기 조각 안 (창문형은 뒷벽 바로 앞)`, () => {
    for (const d of ZONE_MODULES[zone].slice(1)) {
      const wall = WALL_SPOTS.has(d.spotId!);
      const [x, y, z] = spotAnchor(zone, d.spotId!, wall ? 2.4 : null);
      const minX = (d.gx - 0.5) * CELL;
      const maxX = (d.gx + d.w - 0.5) * CELL;
      const minZ = (d.gz - 0.5) * CELL;
      const maxZ = (d.gz + d.d - 0.5) * CELL;
      expect(x).toBeGreaterThan(minX);
      expect(x).toBeLessThan(maxX);
      expect(z).toBeGreaterThan(minZ);
      expect(z).toBeLessThan(maxZ);
      if (wall) {
        expect(y).toBe(2.4);
        expect(z - minZ).toBeCloseTo(0.3);
      } else expect(y).toBe(0);
    }
  });
}

test("조각 상태: 복구 수에 따라 지어짐·폐허·청사진", () => {
  const B: ModuleState = "built";
  expect(moduleStates("alchemy", doneUpTo("alchemy", 0))).toEqual([B, "ruin", "ghost", "ghost", "ghost", "ghost"]);
  expect(moduleStates("alchemy", doneUpTo("alchemy", 3))).toEqual([B, B, B, B, "ruin", "ghost"]);
  expect(moduleStates("alchemy", doneUpTo("alchemy", 5))).toEqual([B, B, B, B, B, B]);
  expect(moduleStates("harbor", doneUpTo("harbor", 0), false)).toEqual(Array(6).fill("ghost"));
});

test("벽·문: 홀만 있으면 문 없음, 조각 1이 지어지면 홀과의 문 1개, 공유 변은 한 번만", () => {
  const defs = ZONE_MODULES.alchemy;
  const e0 = moduleEdges(defs, moduleStates("alchemy", doneUpTo("alchemy", 0)));
  expect(e0.filter((e) => e.kind === "door" || e.kind === "open")).toEqual([]);
  // 홀의 왼쪽(-x)은 폐허 조각 1과 맞닿아 낮은 벽
  expect(e0.find((e) => e.mod === 0 && e.side === "-x")?.kind).toBe("low");
  // 폐허 조각의 바깥 뒷면은 무너진 벽
  expect(e0.some((e) => e.mod === 1 && e.kind === "broken")).toBe(true);

  const e1 = moduleEdges(defs, moduleStates("alchemy", doneUpTo("alchemy", 1)));
  expect(e1.filter((e) => e.kind === "door").length).toBe(1);

  const all = moduleEdges(defs, moduleStates("alchemy", doneUpTo("alchemy", 5)));
  for (const e of all) {
    if (e.kind === "wall" || e.kind === "low") expect(["-x", "-z"]).toContain(e.side);
    if (e.kind === "curb") expect(["+x", "+z"]).toContain(e.side);
  }
  const keys = all.map((e) => `${e.x},${e.z}`);
  expect(new Set(keys).size).toBe(keys.length);
  // 완성되면 부모·자식 사이마다 문 하나 (5개)
  expect(all.filter((e) => e.kind === "door").length).toBe(5);
});

test("카메라 범위: 지어진 곳 + 폐허만 (줌은 v3.7 frameZone)", () => {
  const defs = ZONE_MODULES.alchemy;
  const b0 = zoneBounds(defs, moduleStates("alchemy", doneUpTo("alchemy", 0)));
  // 홀(0,0) + 폐허 조각1(-1,0)
  expect(b0).toEqual({ minX: -1.5 * CELL, maxX: 0.5 * CELL, minZ: -0.5 * CELL, maxZ: 0.5 * CELL });
  expect(panClamp(b0, 100, -100)).toEqual([b0.maxX, b0.minZ]);
  expect(panClamp(b0, -1, 0)).toEqual([-1, 0]);
});

// ---- Task 2: 장소·소품 좌표가 조각 기준 ----
import { SPOT_LAYOUT } from "../../src/views/castle/layout";
import { ZONE_PROPS } from "../../src/views/castle/models/recipes";
import { zonePropPos } from "../../src/views/castle/furniture";

for (const zone of ZONES) {
  test(`${zone}: 장소 위치는 조각 계산값`, () => {
    for (const s of ROOMS[zone].spots) {
      const l = SPOT_LAYOUT[s.id];
      expect(l.pos).toEqual(spotAnchor(zone, s.id, l.type === "window" ? l.pos[1] : null));
    }
  });

  test(`${zone}: 분위기 소품은 그 단계 조각 안, 가구 한가운데는 피함`, () => {
    for (const p of ZONE_PROPS[zone]) {
      const d = ZONE_MODULES[zone][p.step];
      const [wx, wy, wz] = zonePropPos(zone, p);
      const inX = wx > (d.gx - 0.5) * CELL + 0.3 && wx < (d.gx + d.w - 0.5) * CELL - 0.3;
      const inZ = wz > (d.gz - 0.5) * CELL + 0.3 && wz < (d.gz + d.d - 0.5) * CELL - 0.3;
      expect(inX && inZ, `${zone} step${p.step} ${p.m ?? p.proc} 위치 ${wx},${wz}`).toBe(true);
      const hanging = p.m === "props/Chandelier";
      const flat = p.proc === "rug";
      if (!hanging && !flat) {
        const [lx, , lz] = p.p ?? [0, 0, 0];
        expect(Math.hypot(lx, lz + 0.3), `${zone} ${p.m} 가구와 겹침`).toBeGreaterThanOrEqual(1.2);
      }
      expect(hanging ? wy >= 3.5 : wy >= 0 && wy < 1).toBe(true);
    }
  });
}

// ---- v3.7: 화면에 보이는 모양 기준 카메라 (ㄱ자 구역이 한쪽으로 치우치지 않게) ----
import { frameZone, screenAxes, ROOM_CAM_DIR } from "../../src/views/castle/modules";

test("frameZone: 바라보는 점에서 지어진·폐허 조각 바닥이 화면 가로 가운데 (치우침 ≤ 10%), 줌은 0.75~1.45", () => {
  const { r } = screenAxes(ROOM_CAM_DIR);
  for (const zone of ZONES) {
    for (let n = 0; n <= 5; n++) {
      const defs = ZONE_MODULES[zone];
      const states = moduleStates(zone, doneUpTo(zone, n));
      const f = frameZone(defs, states);
      let lo = Infinity;
      let hi = -Infinity;
      defs.forEach((d, i) => {
        if (states[i] === "ghost") return;
        for (const [x, z] of [
          [d.gx - 0.5, d.gz - 0.5],
          [d.gx + d.w - 0.5, d.gz - 0.5],
          [d.gx - 0.5, d.gz + d.d - 0.5],
          [d.gx + d.w - 0.5, d.gz + d.d - 0.5],
        ]) {
          const sx = (x * CELL - f.x) * r[0] + (z * CELL - f.z) * r[2]; // r은 바닥과 평행 (r[1] = 0)
          lo = Math.min(lo, sx);
          hi = Math.max(hi, sx);
        }
      });
      expect(Math.abs(lo + hi) / (hi - lo), `${zone} ${n}`).toBeLessThanOrEqual(0.1);
      expect(f.zoom).toBeGreaterThanOrEqual(0.75);
      expect(f.zoom).toBeLessThanOrEqual(1.45);
    }
  }
});

test("frameZone: 홀 + 첫 폐허만 있을 땐 확대 상한(1.45) — 캐릭터 모자가 화면을 덮지 않게", () => {
  const f = frameZone(ZONE_MODULES.alchemy, moduleStates("alchemy", doneUpTo("alchemy", 0)));
  expect(f.zoom).toBeLessThanOrEqual(1.45);
  expect(f.y).toBe(1);
});
