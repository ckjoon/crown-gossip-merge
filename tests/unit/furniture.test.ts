import { test, expect } from "vitest";
import * as THREE from "three";
import { buildSpotFurniture, SPOT_BUILDERS } from "../../src/views/castle/furniture";
import { ALL_SPOTS_IN_ORDER, STYLE_PALETTES } from "../../src/core/rules/rooms";

function colorsOf(g: THREE.Group): string {
  const out: number[] = [];
  g.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if ((o as THREE.Mesh).isMesh && m && "color" in m) out.push(m.color.getHex());
  });
  return out.join(",");
}

test("30개 장소 모두 고유 빌더가 있고, 스타일 3종이 메쉬 3개 이상·서로 다른 색", () => {
  expect(ALL_SPOTS_IN_ORDER.every((e) => typeof SPOT_BUILDERS[e.spot.id] === "function")).toBe(true);
  for (const e of ALL_SPOTS_IN_ORDER) {
    const looks = STYLE_PALETTES.map((pal) => {
      const g = new THREE.Group();
      buildSpotFurniture(e.spot.id, g, pal);
      let meshes = 0;
      g.traverse((o) => (o as THREE.Mesh).isMesh && meshes++);
      expect(meshes, e.spot.id).toBeGreaterThanOrEqual(3);
      return colorsOf(g);
    });
    expect(new Set(looks).size, e.spot.id).toBe(3);
  }
});

test("서로 다른 장소는 서로 다른 모양 (메쉬 구성이 겹치지 않음)", () => {
  const sigs = ALL_SPOTS_IN_ORDER.map((e) => {
    const g = new THREE.Group();
    buildSpotFurniture(e.spot.id, g, STYLE_PALETTES[0]);
    const parts: string[] = [];
    g.traverse((o) => (o as THREE.Mesh).isMesh && parts.push((o as THREE.Mesh).geometry.type));
    return parts.join("|");
  });
  expect(new Set(sigs).size).toBe(30);
});
