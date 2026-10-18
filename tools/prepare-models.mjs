// prepare-models.mjs — CC0 모델 팩에서 쓰는 모델만 골라 public/models로 옮긴다
// 사용: node tools/prepare-models.mjs <QuaterniusProps> <QuaterniusNature> <KenneyFood>
// - glTF: 노멀/ORM 텍스처 제거, BaseColor만 남겨 최대 1024px로 줄임 (불투명은 JPEG, 알파 있으면 PNG) — macOS sips 사용
// - Kenney Food(GLB): 그대로 복사 + 공용 colormap.png

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [propsDir, natureDir, foodDir] = process.argv.slice(2);
if (!propsDir || !natureDir || !foodDir) {
  console.error("usage: node tools/prepare-models.mjs <props> <nature> <food>");
  process.exit(1);
}
const OUT = path.resolve("public/models");
const MAX_TEX = 1024;

export const PICK = {
  props: [
    "Cauldron", "Bookcase_2", "Shelf_Small_Bottles", "Shelf_Simple", "Shelf_Arch", "Potion_1", "Potion_2", "Potion_4",
    "SmallBottles_1", "SmallBottle", "Bottle_1", "Candle_1", "Candle_2", "CandleStick", "CandleStick_Triple", "CandleStick_Stand",
    "Chandelier", "Lantern_Wall", "Banner_1", "Banner_2", "Table_Large", "Chair_1", "Stool", "Bench", "Workbench",
    "Workbench_Drawers", "Cabinet", "Chest_Wood", "Barrel", "Barrel_Apples", "Crate_Wooden", "Vase_2", "Vase_4",
    "Vase_Rubble_Medium", "BookStand", "Book_Stack_1", "Book_Stack_2", "BookGroup_Medium_1", "BookGroup_Small_1",
    "Scroll_1", "Scroll_2", "Chalice", "Mug", "Table_Plate", "Pot_1", "Bucket_Wooden_1", "Rope_1", "Nightstand_Shelf",
    "Coin_Pile", "Bag", "Stall_Cart_Empty",
  ],
  nature: [
    "Bush_Common", "Bush_Common_Flowers", "Flower_3_Group", "Flower_4_Group", "Plant_1", "Plant_7", "Fern_1",
    "Mushroom_Common", "Rock_Medium_1", "Rock_Medium_2", "Pebble_Round_1", "CommonTree_1", "TwistedTree_1",
    "Grass_Common_Short", "Clover_1",
  ],
  food: [
    "cup-coffee", "cup-tea", "cup-saucer", "mug", "cake", "cake-birthday", "cupcake", "croissant", "loaf", "loaf-baguette",
    "bread", "pie", "muffin", "donut-sprinkles", "frappe", "plate", "plate-dinner", "pot", "pumpkin", "honey",
    "mortar-pestle", "waffle", "pancakes", "cocktail", "wine-red", "glass-wine", "turkey", "whole-ham", "grapes",
    "apple", "cookie", "pudding", "sundae",
  ],
};

// Quaternius 나뭇잎 마스크 텍스처(빨간 모양)는 원래 엔진 셰이더가 잎 색을 입힌다 → 흰색 + 알파로 바꾸고 색은 library.ts의 LEAF_COLORS로 (Pillow 필요)
const LEAF_MASKS = new Set(["Leaves_TwistedTree_C.png"]);

function leafMaskToAlpha(file) {
  const py = [
    "import sys",
    "from PIL import Image",
    "src = Image.open(sys.argv[1]).convert('RGBA')",
    "r, g, b, a0 = src.split()",
    "a = Image.eval(Image.merge('RGB', (r, g, b)).convert('L'), lambda v: 0)",
    "rp, gp, ap0, ap = r.load(), g.load(), a0.load(), a.load()",
    "w, h = src.size",
    "for y in range(h):",
    "    for x in range(w):",
    "        ap[x, y] = min(ap0[x, y], max(0, min(255, (rp[x, y] - gp[x, y]) * 2)))",
    "out = Image.new('RGBA', src.size, (255, 255, 255, 0))",
    "out.putalpha(a)",
    "out.save(sys.argv[1])",
  ].join("\n");
  execFileSync("python3", ["-c", py, file], { stdio: "inherit" });
}

function resizeTexture(src, dst, asJpeg) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst)) return;
  const args = ["-Z", String(MAX_TEX)];
  if (asJpeg) args.push("-s", "format", "jpeg", "-s", "formatOptions", "82");
  execFileSync("sips", [...args, src, "--out", dst], { stdio: "ignore" });
  if (LEAF_MASKS.has(path.basename(dst))) leafMaskToAlpha(dst);
}

function prepareGltf(pack, srcRoot, texRoot, name) {
  const srcGltf = path.join(srcRoot, `${name}.gltf`);
  const g = JSON.parse(fs.readFileSync(srcGltf, "utf8"));
  const usedTex = new Map(); // 옛 texture index → 새 index
  const alphaImages = new Set();
  const textures = [];
  const images = [];
  const imageIndex = new Map();
  for (const m of g.materials ?? []) {
    delete m.normalTexture;
    delete m.occlusionTexture;
    delete m.emissiveTexture;
    const pbr = m.pbrMetallicRoughness ?? {};
    delete pbr.metallicRoughnessTexture;
    pbr.metallicFactor = 0;
    pbr.roughnessFactor = 1;
    const bc = pbr.baseColorTexture;
    if (bc) {
      const oldTex = g.textures[bc.index];
      if (m.alphaMode && m.alphaMode !== "OPAQUE") alphaImages.add(oldTex.source);
      if (!usedTex.has(bc.index)) {
        let ni = imageIndex.get(oldTex.source);
        if (ni === undefined) {
          ni = images.length;
          imageIndex.set(oldTex.source, ni);
          images.push({ ...g.images[oldTex.source], __old: oldTex.source });
        }
        usedTex.set(bc.index, textures.length);
        textures.push({ sampler: oldTex.sampler, source: ni });
      }
      bc.index = usedTex.get(bc.index);
    }
    m.pbrMetallicRoughness = pbr;
  }
  for (const img of images) {
    const base = path.basename(img.uri, path.extname(img.uri));
    const asJpeg = !alphaImages.has(img.__old);
    const outName = `${base}.${asJpeg ? "jpg" : "png"}`;
    const src = [path.join(srcRoot, img.uri), path.join(texRoot, img.uri)].find((f) => fs.existsSync(f));
    if (!src) throw new Error(`texture not found: ${img.uri} (${name})`);
    resizeTexture(src, path.join(OUT, pack, "tex", outName), asJpeg);
    img.uri = `tex/${outName}`;
    img.mimeType = asJpeg ? "image/jpeg" : "image/png";
    delete img.__old;
  }
  g.textures = textures;
  g.images = images;
  if (!textures.length) {
    delete g.textures;
    delete g.images;
    delete g.samplers;
  }
  for (const b of g.buffers) {
    fs.copyFileSync(path.join(srcRoot, b.uri), path.join(OUT, pack, b.uri));
  }
  fs.writeFileSync(path.join(OUT, pack, `${name}.gltf`), JSON.stringify(g));
}

function findTexRoot(root) {
  for (const c of [path.join(root, "Textures"), path.join(root, "..", "Textures"), path.join(root, "..", "..", "Textures")]) {
    if (fs.existsSync(c)) return c;
  }
  return root;
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const [pack, dir] of [["props", path.join(propsDir, "Exports", "glTF")], ["nature", path.join(natureDir, "glTF")]]) {
  fs.mkdirSync(path.join(OUT, pack), { recursive: true });
  // 이미지는 glTF 폴더 안 또는 팩의 Textures 폴더에 있다
  const texRoot = findTexRoot(dir);
  for (const name of PICK[pack]) prepareGltf(pack, dir, texRoot, name);
}
const foodSrc = path.join(foodDir, "Models", "GLB format");
fs.mkdirSync(path.join(OUT, "food", "Textures"), { recursive: true });
for (const name of PICK.food) fs.copyFileSync(path.join(foodSrc, `${name}.glb`), path.join(OUT, "food", `${name}.glb`));
fs.copyFileSync(path.join(foodSrc, "Textures", "colormap.png"), path.join(OUT, "food", "Textures", "colormap.png"));
console.log("ok", Object.fromEntries(Object.entries(PICK).map(([k, v]) => [k, v.length])));
