import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SPOT_RECIPES, CLUTTER, ZONE_PROPS, recipeModels } from "../../src/views/castle/models/recipes";
import { MODEL_NAMES, modelUrl } from "../../src/views/castle/models/manifest";
import { PROC_BUILDERS, buildSpotFurniture } from "../../src/views/castle/furniture";
import { ALL_SPOTS_IN_ORDER, STYLE_PALETTES } from "../../src/core/rules/rooms";
import * as THREE from "three";

test("30개 장소 모두 모델 배치표가 있고, 스타일 3종의 추가 소품이 서로 다름", () => {
  for (const e of ALL_SPOTS_IN_ORDER) {
    const r = SPOT_RECIPES[e.spot.id];
    expect(r, e.spot.id).toBeTruthy();
    expect(r.items.some((i) => i.m), e.spot.id).toBe(true);
    const sigs = r.styles.map((st) => JSON.stringify(st));
    expect(new Set(sigs).size, e.spot.id).toBe(3);
  }
});

test("배치표의 모든 모델은 manifest에 있고 public/models에 파일이 있음", () => {
  const all = [...Object.values(SPOT_RECIPES).flatMap((r) => recipeModels(r)), ...CLUTTER.flatMap((c) => recipeModels({ items: c })), ...Object.values(ZONE_PROPS).flatMap((z) => recipeModels({ items: z }))];
  for (const m of all) {
    expect(MODEL_NAMES as readonly string[], m).toContain(m);
    expect(fs.existsSync(path.join("public", modelUrl(m))), m).toBe(true);
  }
});

test("배치표의 절차적 구조물(proc)은 모두 빌더가 있음", () => {
  const procs = [...Object.values(SPOT_RECIPES).flatMap((r) => [...r.items, ...r.styles.flat()]), ...CLUTTER.flat(), ...Object.values(ZONE_PROPS).flat()].map((i) => i.proc).filter(Boolean);
  for (const p of procs) expect(typeof PROC_BUILDERS[p!], p).toBe("function");
});

test("모델이 아직 없으면(로딩 전) 절차적 가구로 대체 — 빈 장소가 되지 않음", () => {
  const g = new THREE.Group();
  buildSpotFurniture("hb_espresso", g, STYLE_PALETTES[0]);
  let meshes = 0;
  g.traverse((o) => (o as THREE.Mesh).isMesh && meshes++);
  expect(meshes).toBeGreaterThanOrEqual(3);
});

test("구역 분위기 소품은 6구역 모두 있고 1~5단계에 고루 나뉨", () => {
  for (const z of ["alchemy", "harbor", "garden", "banquet", "cellar", "tower"]) {
    const steps = new Set(ZONE_PROPS[z].map((p) => p.step));
    expect([...steps].sort(), z).toEqual([1, 2, 3, 4, 5]);
  }
});

test("작은 소품은 그림자·외곽선을 끄고(그리기 호출 절약), 큰 가구는 유지", async () => {
  const { markSmallProp } = await import("../../src/views/castle/furniture");
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  (g.children[0] as THREE.Mesh).castShadow = true;
  markSmallProp(g, 0.5);
  expect((g.children[0] as THREE.Mesh).castShadow).toBe(false);
  expect(g.children[0].userData.noOutline).toBe(true);
  const big = new THREE.Group();
  big.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  (big.children[0] as THREE.Mesh).castShadow = true;
  markSmallProp(big, 2.0);
  expect((big.children[0] as THREE.Mesh).castShadow).toBe(true);
});
