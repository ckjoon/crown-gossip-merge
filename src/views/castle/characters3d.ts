// characters3d.ts — 3D 캐릭터: KayKit(CC0) 체형 5종에 캐릭터마다 옷 색(피부색은 보존)·보일 부속·절차적 소품(모자·왕관·안경…)을 입힌다
// 고양이 네로와 갈매기 핍은 절차적 툰 동물. 애니메이션 클립은 anims.glb 하나를 모든 체형이 공유한다(뼈대 이름이 같음)
// 모델은 처음 필요할 때 불러오고(런타임 캐시), 불러오기 전에는 build가 null → 방에는 아직 나타나지 않는다

import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const BODIES = ["Mage", "Knight", "Rogue", "Rogue_Hooded", "Barbarian"] as const;
export type Body = (typeof BODIES)[number];
export type AccId =
  | "crown"
  | "detectiveHat"
  | "flowerCrown"
  | "beret"
  | "captainHat"
  | "glasses"
  | "bow"
  | "maidCap"
  | "gardenerHat"
  | "wings"
  | "beard"
  | "miniCat"
  | "flower"
  | "monocle"
  | "postCap";

export type Look3D =
  | { kind: "human"; body: Body; hue: number; sat: number; show?: string[]; acc: AccId[]; scale?: number; bg: string }
  | { kind: "cat" | "bird"; bg: string };

// show: 체형의 선택 부속(모자·망토·마도서 등) 중 보일 것. 나머지 부속은 숨긴다
export const CHARACTER_LOOKS: Record<string, Look3D> = {
  selene: { kind: "human", body: "Mage", hue: 0, sat: 1, show: ["Mage_Hat", "Mage_Cape", "Spellbook"], acc: [], bg: "#7c3aed" },
  quinn: { kind: "human", body: "Rogue", hue: 150, sat: 0.9, show: ["Rogue_Cape"], acc: ["detectiveHat"], bg: "#0e7490" },
  quinn_nero: { kind: "human", body: "Rogue", hue: 150, sat: 0.9, show: ["Rogue_Cape"], acc: ["detectiveHat", "miniCat"], bg: "#155e75" },
  nero: { kind: "cat", bg: "#312e81" },
  lucian: { kind: "human", body: "Knight", hue: 330, sat: 1.1, show: ["Knight_Cape"], acc: ["monocle"], bg: "#7f1d1d" },
  olivia: { kind: "human", body: "Rogue", hue: 290, sat: 1.1, acc: ["bow"], scale: 0.82, bg: "#db2777" },
  harrison: { kind: "human", body: "Barbarian", hue: 30, sat: 0.9, show: ["Barbarian_Cape", "Mug"], acc: ["beret"], bg: "#b45309" },
  carmen: { kind: "human", body: "Rogue", hue: 200, sat: 1, acc: ["beret", "glasses"], bg: "#0369a1" },
  marco: { kind: "human", body: "Barbarian", hue: 200, sat: 1, show: ["Barbarian_Cape"], acc: ["captainHat"], bg: "#1e3a8a" },
  ella: { kind: "human", body: "Rogue", hue: 60, sat: 1, acc: ["flower"], bg: "#a16207" },
  pip: { kind: "bird", bg: "#0284c7" },
  rowan: { kind: "human", body: "Barbarian", hue: 90, sat: 1, acc: ["gardenerHat"], bg: "#166534" },
  lily: { kind: "human", body: "Rogue", hue: 250, sat: 1.2, acc: ["wings", "flowerCrown"], scale: 0.72, bg: "#c026d3" },
  verna: { kind: "human", body: "Rogue_Hooded", hue: 20, sat: 0.9, show: ["Rogue_Cape"], acc: ["glasses"], bg: "#047857" },
  arthur: { kind: "human", body: "Knight", hue: 0, sat: 1, show: ["Knight_Cape"], acc: ["crown"], bg: "#ca8a04" },
  margaret: { kind: "human", body: "Mage", hue: 200, sat: 0.35, acc: ["maidCap", "glasses"], bg: "#57534e" },
  oberon: { kind: "human", body: "Mage", hue: 220, sat: 1, show: ["Mage_Hat", "Mage_Cape", "2H_Staff"], acc: ["beard"], bg: "#1e3a8a" },
};

// 선택 부속: look.show에 없으면 숨긴다
const OPTIONAL = /(Spellbook|Wand|Staff|Hat|Helmet|Cape|Mug)/;
export const CHARACTER_HEIGHT = 2.1;

// ---------- 옷 색 바꾸기 (피부·회색 계열은 그대로) ----------
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function recolorPixel(r: number, g: number, b: number, hue: number, sat: number): [number, number, number] {
  if (hue === 0 && sat === 1) return [r, g, b];
  const [h, s, l] = rgbToHsl(r, g, b);
  const skin = h >= 10 && h <= 45 && s >= 0.25 && l >= 0.55;
  if (skin || s < 0.12) return [r, g, b];
  return hslToRgb((((h + hue) % 360) + 360) % 360, Math.min(1, s * sat), l);
}

const recolorCache = new Map<string, THREE.Texture>();

function recolorTexture(src: THREE.Texture, key: string, hue: number, sat: number): THREE.Texture {
  const hit = recolorCache.get(key);
  if (hit) return hit;
  const img = src.image as HTMLImageElement | ImageBitmap;
  const cv = document.createElement("canvas");
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, cv.width, cv.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = recolorPixel(px[i], px[i + 1], px[i + 2], hue, sat);
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = src.flipY;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = src.magFilter;
  tex.minFilter = src.minFilter;
  tex.userData.shared = true;
  recolorCache.set(key, tex);
  return tex;
}

// ---------- 절차적 소품 (머리 크기 1 기준, 머리 꼭대기·얼굴 앞 등에 붙는다) ----------
type Anchor = "top" | "face" | "chin" | "back" | "side" | "shoulder";
interface Acc {
  obj: THREE.Object3D;
  at: Anchor;
}

function m(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}

function grp(...objs: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.add(...objs);
  return g;
}

export const ACC_BUILDERS: Record<AccId, () => Acc> = {
  crown: () => {
    const gold = m(0xfbbf24, { metalness: 0.6, roughness: 0.3 });
    const band = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.16, 16, 1, true), gold, 0, 0.08, 0);
    band.material = gold.clone();
    (band.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    const pts = [0, 1, 2, 3, 4].map((i) => mesh(new THREE.ConeGeometry(0.07, 0.18, 6), gold, Math.cos((i / 5) * Math.PI * 2) * 0.33, 0.24, Math.sin((i / 5) * Math.PI * 2) * 0.33));
    const gem = mesh(new THREE.OctahedronGeometry(0.06), m(0xdc2626, { emissive: 0xdc2626, emissiveIntensity: 0.4 }), 0, 0.1, 0.36);
    return { obj: grp(band, ...pts, gem), at: "top" };
  },
  detectiveHat: () => {
    const c = m(0x92400e);
    return { obj: grp(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 20), c, 0, 0.02, 0), mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 18), c, 0, 0.18, 0), mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.07, 18), m(0x451a03), 0, 0.08, 0)), at: "top" };
  },
  flowerCrown: () => {
    const cols = [0xf9a8d4, 0xfde047, 0xc4b5fd, 0xf472b6, 0xa5f3fc];
    const ring = mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 20), m(0x22c55e), 0, 0.05, 0);
    ring.rotation.x = Math.PI / 2;
    const fl = cols.map((c, i) => mesh(new THREE.SphereGeometry(0.08, 8, 6), m(c, { emissive: c, emissiveIntensity: 0.2 }), Math.cos((i / 5) * Math.PI * 2) * 0.36, 0.08, Math.sin((i / 5) * Math.PI * 2) * 0.36));
    return { obj: grp(ring, ...fl), at: "top" };
  },
  beret: () => {
    const b = mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m(0xbe123c), 0.05, 0, 0);
    b.scale.y = 0.45;
    return { obj: grp(b, mesh(new THREE.SphereGeometry(0.05, 8, 6), m(0xbe123c), 0.05, 0.2, 0)), at: "top" };
  },
  captainHat: () => {
    const w = m(0xf8fafc);
    return { obj: grp(mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.22, 18), w, 0, 0.11, 0), mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 18), m(0x1e3a8a), 0, 0.03, 0), mesh(new THREE.BoxGeometry(0.4, 0.04, 0.22), m(0x0f172a), 0, 0.0, 0.3), mesh(new THREE.SphereGeometry(0.06, 8, 6), m(0xfbbf24, { metalness: 0.6 }), 0, 0.12, 0.4)), at: "top" };
  },
  glasses: () => {
    const f = m(0x1f2937, { metalness: 0.4 });
    const l = mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 16), f, -0.15, 0, 0);
    const r = mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 16), f, 0.15, 0, 0);
    const br = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), f, 0, 0.02, 0);
    return { obj: grp(l, r, br), at: "face" };
  },
  monocle: () => {
    const f = m(0xfbbf24, { metalness: 0.6 });
    return { obj: grp(mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 16), f, 0.15, 0, 0), mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4), f, 0.25, -0.2, 0)), at: "face" };
  },
  bow: () => {
    const c = m(0xec4899);
    const l = mesh(new THREE.ConeGeometry(0.14, 0.24, 4), c, -0.14, 0, 0);
    l.rotation.z = Math.PI / 2;
    const r = mesh(new THREE.ConeGeometry(0.14, 0.24, 4), c, 0.14, 0, 0);
    r.rotation.z = -Math.PI / 2;
    return { obj: grp(l, r, mesh(new THREE.SphereGeometry(0.07, 8, 6), c)), at: "top" };
  },
  maidCap: () => {
    const w = m(0xf8fafc);
    const cap = mesh(new THREE.SphereGeometry(0.34, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), w, 0, -0.02, -0.05);
    cap.scale.y = 0.5;
    const frill = mesh(new THREE.TorusGeometry(0.33, 0.04, 6, 20), w, 0, 0.0, -0.05);
    frill.rotation.x = Math.PI / 2;
    return { obj: grp(cap, frill), at: "top" };
  },
  gardenerHat: () => {
    const straw = m(0xeab308);
    return { obj: grp(mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.05, 20), straw, 0, 0.02, 0), mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.28, 16), straw, 0, 0.16, 0), mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.07, 16), m(0x16a34a), 0, 0.07, 0)), at: "top" };
  },
  wings: () => {
    const w = m(0xe0f2fe, { transparent: true, opacity: 0.8, emissive: 0xbae6fd, emissiveIntensity: 0.3, side: THREE.DoubleSide });
    const mk = (s: number) => {
      const p = mesh(new THREE.CircleGeometry(0.42, 12), w, s * 0.32, 0.1, 0);
      p.scale.set(0.7, 1.2, 1);
      p.rotation.y = s * 0.6;
      p.userData.wing = s;
      p.userData.noOutline = true;
      return p;
    };
    return { obj: grp(mk(-1), mk(1)), at: "back" };
  },
  beard: () => {
    const b = mesh(new THREE.ConeGeometry(0.26, 0.55, 10), m(0xe5e7eb), 0, -0.22, 0);
    b.rotation.x = Math.PI;
    return { obj: grp(b), at: "chin" };
  },
  miniCat: () => {
    const cat = buildAnimal("cat").root;
    cat.scale.setScalar(0.35);
    return { obj: cat, at: "shoulder" };
  },
  flower: () => {
    const p = [0, 1, 2, 3, 4].map((i) => mesh(new THREE.SphereGeometry(0.07, 8, 6), m(0xfb7185), Math.cos((i / 5) * Math.PI * 2) * 0.08, Math.sin((i / 5) * Math.PI * 2) * 0.08, 0));
    return { obj: grp(...p, mesh(new THREE.SphereGeometry(0.05, 8, 6), m(0xfde047), 0, 0, 0.03)), at: "side" };
  },
  postCap: () => {
    const c = m(0x1d4ed8);
    return { obj: grp(mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.16, 14), c, 0, 0.08, 0), mesh(new THREE.BoxGeometry(0.3, 0.03, 0.18), m(0x0f172a), 0, 0.01, 0.26)), at: "top" };
  },
};

// ---------- 절차적 동물 ----------
export interface AnimalParts {
  root: THREE.Group;
  parts: THREE.Object3D[]; // userData.part: "tail" | "wing" | "head"
}

export function buildAnimal(kind: "cat" | "bird"): AnimalParts {
  const root = new THREE.Group();
  const parts: THREE.Object3D[] = [];
  if (kind === "cat") {
    const fur = m(0x111827);
    const body = mesh(new THREE.SphereGeometry(0.42, 16, 12), fur, 0, 0.42, 0);
    body.scale.set(1, 0.85, 1.25);
    const head = grp(
      mesh(new THREE.SphereGeometry(0.36, 16, 12), fur, 0, 0, 0),
      mesh(new THREE.ConeGeometry(0.12, 0.22, 4), fur, -0.2, 0.32, 0),
      mesh(new THREE.ConeGeometry(0.12, 0.22, 4), fur, 0.2, 0.32, 0),
      mesh(new THREE.SphereGeometry(0.075, 10, 8), m(0x84cc16, { emissive: 0x84cc16, emissiveIntensity: 0.6 }), -0.13, 0.04, 0.3),
      mesh(new THREE.SphereGeometry(0.075, 10, 8), m(0x84cc16, { emissive: 0x84cc16, emissiveIntensity: 0.6 }), 0.13, 0.04, 0.3),
      mesh(new THREE.SphereGeometry(0.04, 8, 6), m(0xf9a8d4), 0, -0.06, 0.35),
    );
    head.position.set(0, 0.9, 0.32);
    head.userData.part = "head";
    const collar = mesh(new THREE.TorusGeometry(0.24, 0.04, 6, 16), m(0x7c3aed), 0, 0.68, 0.28);
    collar.rotation.x = Math.PI / 2.4;
    const bell = mesh(new THREE.SphereGeometry(0.06, 8, 6), m(0xfbbf24, { metalness: 0.6 }), 0, 0.6, 0.48);
    const tail = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, -0.15), new THREE.Vector3(0.1, 0.6, -0.1), new THREE.Vector3(0.2, 0.75, 0.05)]);
    tail.add(mesh(new THREE.TubeGeometry(curve, 12, 0.06, 6), fur));
    tail.position.set(0, 0.35, -0.48);
    tail.userData.part = "tail";
    const legs = [-0.2, 0.2].flatMap((x) => [0.3, -0.3].map((z) => mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), fur, x, 0.12, z)));
    root.add(body, head, collar, bell, tail, ...legs);
    parts.push(head, tail);
  } else {
    const white = m(0xf8fafc);
    const gray = m(0x94a3b8);
    const body = mesh(new THREE.SphereGeometry(0.4, 16, 12), white, 0, 0.55, 0);
    body.scale.set(0.9, 0.9, 1.25);
    const head = grp(
      mesh(new THREE.SphereGeometry(0.28, 14, 10), white, 0, 0, 0),
      mesh(new THREE.ConeGeometry(0.08, 0.3, 8), m(0xf59e0b), 0, -0.04, 0.32),
      mesh(new THREE.SphereGeometry(0.05, 8, 6), m(0x0f172a), -0.13, 0.06, 0.2),
      mesh(new THREE.SphereGeometry(0.05, 8, 6), m(0x0f172a), 0.13, 0.06, 0.2),
      mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 12), m(0x1d4ed8), 0, 0.24, 0),
      mesh(new THREE.BoxGeometry(0.22, 0.02, 0.14), m(0x0f172a), 0, 0.19, 0.18),
    );
    head.children[1].rotation.x = Math.PI / 2;
    head.position.set(0, 1.02, 0.3);
    head.userData.part = "head";
    const wings = [-1, 1].map((s) => {
      const w = mesh(new THREE.SphereGeometry(0.3, 12, 8), gray, s * 0.36, 0.6, -0.05);
      w.scale.set(0.25, 0.7, 1.1);
      w.userData.part = "wing";
      w.userData.side = s;
      return w;
    });
    const bag = mesh(new THREE.BoxGeometry(0.26, 0.22, 0.12), m(0x92400e), 0.3, 0.42, 0.25);
    const legs = [-0.12, 0.12].map((x) => mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), m(0xf59e0b), x, 0.15, 0));
    root.add(body, head, ...wings, bag, ...legs);
    parts.push(head, ...wings);
  }
  return { root, parts };
}

// 동물 숨쉬기·꼬리·날개 (t: 초)
export function animateAnimal(a: AnimalParts, t: number, excited: boolean): void {
  for (const p of a.parts) {
    if (p.userData.part === "tail") p.rotation.z = Math.sin(t * (excited ? 9 : 2.5)) * 0.35;
    if (p.userData.part === "wing") p.rotation.z = (p.userData.side as number) * (excited ? 0.6 + Math.sin(t * 18) * 0.5 : 0.1 + Math.sin(t * 2) * 0.05);
    if (p.userData.part === "head") p.rotation.y = Math.sin(t * 0.7) * 0.25;
  }
  a.root.position.y = excited ? Math.abs(Math.sin(t * 8)) * 0.25 : 0;
  a.root.scale.y = 1 + Math.sin(t * 2.2) * 0.02;
}

// ---------- 모델 불러오기·복제 ----------
interface Template {
  scene: THREE.Group;
}

const bodies = new Map<Body, Template>();
let clips: THREE.AnimationClip[] | null = null;
const pending = new Map<string, Promise<void>>();
let loader: GLTFLoader | null = null;
let cloneSkinned: ((o: THREE.Object3D) => THREE.Object3D) | null = null;

async function getLoader(): Promise<GLTFLoader> {
  if (!loader) {
    const [{ GLTFLoader: L }, su] = await Promise.all([import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/utils/SkeletonUtils.js")]);
    loader = new L();
    cloneSkinned = su.clone;
  }
  return loader;
}

function once(key: string, fn: () => Promise<void>): Promise<void> {
  let p = pending.get(key);
  if (!p) {
    p = fn().catch(() => {
      pending.delete(key);
    });
    pending.set(key, p);
  }
  return p;
}

function loadBody(b: Body): Promise<void> {
  if (bodies.has(b)) return Promise.resolve();
  return once(b, async () => {
    const g = await (await getLoader()).loadAsync(`/models/characters/${b}.glb`);
    bodies.set(b, { scene: g.scene });
  });
}

function loadClips(): Promise<void> {
  if (clips) return Promise.resolve();
  return once("anims", async () => {
    const g = await (await getLoader()).loadAsync("/models/characters/anims.glb");
    clips = g.animations;
  });
}

export interface BuiltCharacter {
  root: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  clips: Map<string, THREE.AnimationClip>;
  animal: AnimalParts | null;
}

export const CharacterLibrary = {
  preload(ids: Iterable<string>): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const id of ids) {
      const look = CHARACTER_LOOKS[id];
      if (look?.kind === "human") jobs.push(loadBody(look.body), loadClips());
    }
    return Promise.all(jobs).then(() => undefined);
  },

  ready(id: string): boolean {
    const look = CHARACTER_LOOKS[id];
    if (!look) return false;
    return look.kind !== "human" || (bodies.has(look.body) && !!clips);
  },

  // 준비된 캐릭터를 동기적으로 만든다 (키 CHARACTER_HEIGHT, 바닥 원점, +z를 바라봄)
  build(id: string): BuiltCharacter | null {
    const look = CHARACTER_LOOKS[id];
    if (!look || !this.ready(id)) return null;
    if (look.kind !== "human") {
      const a = buildAnimal(look.kind);
      a.root.scale.multiplyScalar(look.kind === "cat" ? 1.1 : 1.15);
      const holder = new THREE.Group();
      holder.add(a.root);
      return { root: holder, mixer: null, clips: new Map(), animal: a };
    }
    const tpl = bodies.get(look.body)!;
    const scene = cloneSkinned!(tpl.scene) as THREE.Group;
    scene.traverse((o) => {
      if (o.name && OPTIONAL.test(o.name) && !(o as THREE.Bone).isBone) o.visible = (look.show ?? []).includes(o.name);
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.userData.shared = true; // 기하는 원본 체형과 공유 — 해제하지 않는다
      mesh.castShadow = true;
      mesh.userData.noOutline = true; // 스킨 메시는 뒤집힌 껍데기 외곽선이 따라오지 않는다
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.map && (look.hue !== 0 || look.sat !== 1)) {
        const nm = mat.clone();
        nm.map = recolorTexture(mat.map, `${look.body}|${look.hue}|${look.sat}`, look.hue, look.sat);
        mesh.material = nm;
      }
    });
    const root = new THREE.Group();
    root.add(scene);
    const box = new THREE.Box3().setFromObject(scene);
    const k = (CHARACTER_HEIGHT * (look.scale ?? 1)) / Math.max(0.01, box.max.y - box.min.y);
    scene.scale.setScalar(k);
    scene.position.y = -box.min.y * k;
    root.updateMatrixWorld(true);
    attachAccessories(scene, look);
    const map = new Map((clips ?? []).map((c) => [c.name, c] as const));
    return { root, mixer: new THREE.AnimationMixer(scene), clips: map, animal: null };
  },

  _reset(): void {
    bodies.clear();
    clips = null;
    pending.clear();
  },
};

// 머리 메시 크기에 맞춰 소품을 놓고, 머리·가슴 뼈에 붙여 애니메이션을 따라가게 한다
function attachAccessories(scene: THREE.Object3D, look: Extract<Look3D, { kind: "human" }>): void {
  if (!look.acc.length) return;
  let headMesh: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (!headMesh && /_Head/.test(o.name) && (o as THREE.Mesh).isMesh) headMesh = o;
  });
  const headBone = scene.getObjectByName("head");
  const chestBone = scene.getObjectByName("chest") ?? headBone;
  if (!headMesh || !headBone) return;
  const hb = new THREE.Box3().setFromObject(headMesh);
  const size = hb.getSize(new THREE.Vector3());
  const c = hb.getCenter(new THREE.Vector3());
  const unit = size.y;
  const at: Record<Anchor, THREE.Vector3> = {
    top: new THREE.Vector3(c.x, hb.max.y - unit * 0.12, c.z),
    face: new THREE.Vector3(c.x, c.y + unit * 0.02, hb.max.z + unit * 0.02),
    chin: new THREE.Vector3(c.x, hb.min.y + unit * 0.12, hb.max.z - unit * 0.12),
    back: new THREE.Vector3(c.x, hb.min.y - unit * 0.55, hb.min.z - unit * 0.05),
    side: new THREE.Vector3(hb.max.x - unit * 0.05, c.y + unit * 0.25, c.z),
    shoulder: new THREE.Vector3(hb.max.x + unit * 0.15, hb.min.y - unit * 0.15, c.z),
  };
  for (const id of look.acc) {
    const a = ACC_BUILDERS[id]();
    a.obj.scale.multiplyScalar(unit);
    a.obj.position.copy(at[a.at]);
    // 월드 좌표 = 캐릭터 루트 좌표 (만들 때 루트는 원점·크기 1)
    scene.parent!.add(a.obj);
    a.obj.updateMatrixWorld(true);
    // 뼈에 붙여도 지금 위치·크기를 유지 (Object3D.attach)
    (a.at === "back" || a.at === "shoulder" ? chestBone! : headBone).attach(a.obj);
  }
}
