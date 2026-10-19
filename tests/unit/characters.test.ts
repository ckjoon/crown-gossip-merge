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
  const names = (glbJson(file).animations ?? []).map((a) => a.name);
  for (const c of CLIPS) expect(names, c).toContain(c);
});
