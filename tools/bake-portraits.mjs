// bake-portraits.mjs — 3D 캐릭터(characters3d.ts)로 초상화를 굽는다: 17명 × 표정 4종, 192px JPEG
// 사용: 개발 서버(npm run dev, 5173)를 켠 상태에서 node tools/bake-portraits.mjs
// 표정은 포즈(대기·환호·놀람·고민) + 이모트(✨ ❗ 💦)로 표현한다 (KayKit 얼굴은 텍스처라 바뀌지 않음)
// 결과: public/portraits/<id>_<expr>.jpg, src/views/art/portraitManifest.ts

import fs from "node:fs";
import { chromium } from "@playwright/test";

const URL = process.env.DEV_URL ?? "http://localhost:5173/?e2e";
const OUT = "public/portraits";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(URL);
await page.waitForTimeout(2500);

const result = await page.evaluate(async () => {
  const THREE = await import("/node_modules/.vite/deps/three.js");
  const C = await import("/src/views/castle/characters3d.ts");
  const { toonify } = await import("/src/views/castle/toon.ts");
  const ids = Object.keys(C.CHARACTER_LOOKS);
  await C.CharacterLibrary.preload(ids);
  const SIZE = 192;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  const POSES = {
    neutral: { clip: "Idle", t: 0.3, emote: "" },
    happy: { clip: "Cheer", t: 0.55, emote: "✨" },
    surprised: { clip: "Hit_A", t: 0.12, emote: "❗" },
    worried: { clip: "Interact", t: 0.45, emote: "💦" },
  };
  const out = {};
  for (const id of ids) {
    const look = C.CHARACTER_LOOKS[id];
    for (const [expr, pose] of Object.entries(POSES)) {
      const built = C.CharacterLibrary.build(id);
      if (!built) continue;
      toonify(built.root);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6d5a8a, 2.8));
      const dl = new THREE.DirectionalLight(0xffffff, 2.4);
      dl.position.set(2, 4, 5);
      scene.add(dl, built.root);
      if (built.mixer) {
        const clip = built.clips.get(pose.clip);
        if (clip) {
          built.mixer.clipAction(clip).play();
          built.mixer.update(pose.t * clip.duration);
        }
      } else if (built.animal) {
        C.animateAnimal(built.animal, pose.t * 3, expr === "happy");
        built.animal.root.position.y = 0;
      }
      built.root.updateMatrixWorld(true);
      // 머리·어깨: 캐릭터 위쪽 45%를 화면에 담는다
      const box = new THREE.Box3().setFromObject(built.root);
      const h = box.max.y - box.min.y;
      const isAnimal = look.kind !== "human";
      // 사람은 머리 뼈 높이를 중심으로 (큰 모자에 얼굴이 밀리지 않게), 동물은 몸 전체
      const head = isAnimal ? null : built.root.getObjectByName("head");
      const headY = head ? head.getWorldPosition(new THREE.Vector3()).y : box.max.y;
      const view = isAnimal ? h * 0.95 : h * 0.6;
      const cy = isAnimal ? box.max.y - view * 0.5 : headY + h * 0.15;
      const cam = new THREE.OrthographicCamera(-view / 2, view / 2, view / 2, -view / 2, 0.1, 50);
      cam.position.set(view * 0.25, cy + view * 0.08, 10);
      cam.lookAt((box.min.x + box.max.x) / 2, cy, 0);
      renderer.setClearColor(0x000000, 0);
      renderer.render(scene, cam);
      // 원형 배경 + 렌더 + 이모트
      const cv = document.createElement("canvas");
      cv.width = cv.height = SIZE;
      const ctx = cv.getContext("2d");
      const grad = ctx.createRadialGradient(SIZE * 0.4, SIZE * 0.35, SIZE * 0.1, SIZE / 2, SIZE / 2, SIZE * 0.7);
      grad.addColorStop(0, "#ffffff55");
      grad.addColorStop(1, "#00000033");
      ctx.fillStyle = look.bg;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(renderer.domElement, 0, 0);
      if (pose.emote) {
        ctx.font = `${Math.round(SIZE * 0.24)}px "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.fillText(pose.emote, SIZE * 0.68, SIZE * 0.3);
      }
      out[`${id}_${expr}`] = cv.toDataURL("image/jpeg", 0.82);
      built.mixer?.stopAllAction();
    }
  }
  return out;
});

let total = 0;
for (const [name, url] of Object.entries(result)) {
  const buf = Buffer.from(url.split(",")[1], "base64");
  fs.writeFileSync(`${OUT}/${name}.jpg`, buf);
  total += buf.length;
}
const ids = [...new Set(Object.keys(result).map((k) => k.replace(/_(neutral|happy|surprised|worried)$/, "")))].sort();
fs.writeFileSync(
  "src/views/art/portraitManifest.ts",
  `// portraitManifest.ts — tools/bake-portraits.mjs가 생성. 3D 모델에서 구운 초상화가 있는 캐릭터 목록 (없으면 벡터 초상화)
import type { Expression } from "../../core/rules/expressions";

export const BAKED_PORTRAITS: ReadonlySet<string> = new Set(${JSON.stringify(ids)});

export function bakedPortraitUrl(id: string, expr: Expression): string {
  return \`/portraits/\${id}_\${expr}.jpg\`;
}
`,
);
console.log(`baked ${Object.keys(result).length} portraits, ${total} bytes`);
await browser.close();
