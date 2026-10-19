// prepare-characters.mjs — KayKit Adventurers 1.0(CC0) 캐릭터를 게임용으로 가볍게 만든다
// 사용: node tools/prepare-characters.mjs <KayKit Characters/gltf 폴더>
// - 체형 5종: 애니메이션과 무기·방패 노드를 빼고 메시+뼈대만 → public/models/characters/<Body>.glb
// - 공용 애니메이션: Mage.glb의 필요한 클립만 → public/models/characters/anims.glb (모든 체형이 같은 뼈대 이름을 써서 공유 가능)

import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { prune, dedup } from "@gltf-transform/functions";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) throw new Error("KayKit gltf 폴더 경로가 필요합니다");
const OUT = "public/models/characters";
fs.mkdirSync(OUT, { recursive: true });

const BODIES = ["Mage", "Knight", "Rogue", "Rogue_Hooded", "Barbarian"];
const CLIPS = ["Idle", "Walking_A", "Cheer", "Interact", "Hit_A", "Spellcasting", "Sit_Chair_Idle", "Use_Item"];
const WEAPON = /Sword|Shield|Axe|Crossbow|Knife|Throwable/;

const io = new NodeIO();

// 애니메이션을 지울 때 샘플러가 쓰던 키프레임 데이터(accessor)까지 함께 지운다 (안 그러면 파일에 남음)
function dropAnimation(a) {
  for (const smp of a.listSamplers()) {
    smp.getInput()?.dispose();
    smp.getOutput()?.dispose();
  }
  a.dispose();
}

for (const b of BODIES) {
  const doc = await io.read(path.join(SRC, `${b}.glb`));
  const root = doc.getRoot();
  for (const a of root.listAnimations()) dropAnimation(a);
  for (const n of root.listNodes()) if (WEAPON.test(n.getName())) n.dispose();
  await doc.transform(prune(), dedup());
  await io.write(path.join(OUT, `${b}.glb`), doc);
  console.log(b, fs.statSync(path.join(OUT, `${b}.glb`)).size);
}

// 애니메이션 전용: 메시·텍스처는 지우고 뼈대 노드와 클립만 남긴다
const doc = await io.read(path.join(SRC, "Mage.glb"));
const root = doc.getRoot();
for (const a of root.listAnimations()) if (!CLIPS.includes(a.getName())) dropAnimation(a);
for (const n of root.listNodes()) {
  if (n.getMesh()) n.setMesh(null);
  if (n.getSkin()) n.setSkin(null);
}
for (const m of root.listMeshes()) m.dispose();
for (const t of root.listTextures()) t.dispose();
for (const m of root.listMaterials()) m.dispose();
for (const s of root.listSkins()) s.dispose();
await doc.transform(prune({ keepLeaves: true }), dedup());
await io.write(path.join(OUT, "anims.glb"), doc);
console.log("anims", fs.statSync(path.join(OUT, "anims.glb")).size);
