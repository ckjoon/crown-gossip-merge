import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const DIR = "public/models/characters";
const BODIES = ["Mage", "Knight", "Rogue", "Rogue_Hooded", "Barbarian"];
export const CLIPS = ["Idle", "Walking_A", "Cheer", "Interact", "Hit_A", "Spellcasting", "Sit_Chair_Idle", "Use_Item"];

function glbJson(file: string): { nodes: Array<{ name?: string; mesh?: number }>; animations?: Array<{ name: string }> } {
  const f = fs.readFileSync(file);
  const len = f.readUInt32LE(12);
  return JSON.parse(f.subarray(20, 20 + len).toString("utf8"));
}

test("체형 5종: 애니메이션·무기 없이 가볍게", () => {
  for (const b of BODIES) {
    const file = path.join(DIR, `${b}.glb`);
    expect(fs.existsSync(file), b).toBe(true);
    expect(fs.statSync(file).size, b).toBeLessThan(600_000);
    const j = glbJson(file);
    expect(j.animations ?? [], b).toEqual([]);
    const meshNodes = j.nodes.filter((n) => n.mesh !== undefined).map((n) => n.name ?? "");
    expect(meshNodes.some((n) => /Sword|Shield|Axe|Crossbow|Knife|Throwable/.test(n)), b).toBe(false);
    expect(meshNodes.some((n) => n.endsWith("_Body")), b).toBe(true);
  }
});

test("공용 애니메이션 anims.glb에 필요한 클립이 모두 있음", () => {
  const file = path.join(DIR, "anims.glb");
  expect(fs.statSync(file).size).toBeLessThan(1_500_000);
  const j = glbJson(file) as unknown as { accessors: unknown[]; animations: Array<{ name: string; samplers: Array<{ input?: number; output?: number }> }> };
  const names = j.animations.map((a) => a.name);
  for (const c of CLIPS) expect(names, c).toContain(c);
  // 클립끼리 공유하는 키프레임 데이터가 지워져 참조가 끊기지 않았는지 (끊기면 GLTFLoader가 실패)
  for (const a of j.animations) for (const smp of a.samplers) {
    expect(smp.input, a.name).toBeLessThan(j.accessors.length);
    expect(smp.output, a.name).toBeLessThan(j.accessors.length);
  }
});

// ---- Task 2: 캐릭터 외형 ----
import * as THREE from "three";
import { CHARACTERS } from "../../src/core/rules/characters";
import { ACC_BUILDERS, BODIES as BODY_LIST, CHARACTER_LOOKS, buildAnimal, recolorPixel } from "../../src/views/castle/characters3d";

test("17명 모두 3D 외형이 있고 서로 다른 조합", () => {
  const sigs = new Set<string>();
  for (const id of Object.keys(CHARACTERS)) {
    const look = CHARACTER_LOOKS[id];
    expect(look, id).toBeTruthy();
    if (look.kind === "human") {
      expect(BODY_LIST).toContain(look.body);
      for (const a of look.acc) expect(typeof ACC_BUILDERS[a], `${id} ${a}`).toBe("function");
      sigs.add(`${look.body}|${look.hue}|${look.sat}|${[...look.acc].sort().join(",")}|${(look.show ?? []).join(",")}`);
    } else sigs.add(look.kind);
  }
  expect(sigs.size).toBe(Object.keys(CHARACTERS).length);
});

test("절차적 동물(네로·핍)은 메시로 만들어지고 꼬리·날개 같은 움직이는 부위가 있음", () => {
  for (const kind of ["cat", "bird"] as const) {
    const a = buildAnimal(kind);
    let meshes = 0;
    a.root.traverse((o) => (o as THREE.Mesh).isMesh && meshes++);
    expect(meshes, kind).toBeGreaterThan(5);
    expect(a.parts.length, kind).toBeGreaterThan(0);
  }
});

test("색 변환은 피부색을 지키고 옷 색만 바꿈", () => {
  const skin: [number, number, number] = [240, 196, 160];
  expect(recolorPixel(...skin, 120, 1)).toEqual(skin);
  const purple: [number, number, number] = [110, 70, 180];
  const out = recolorPixel(...purple, 120, 1);
  expect(out).not.toEqual(purple);
  expect(recolorPixel(...purple, 0, 1)).toEqual(purple);
});
