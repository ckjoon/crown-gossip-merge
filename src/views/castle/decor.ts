// decor.ts — 구역별 고정 장식 (장소 복구와 별개로 방의 개성을 만든다). 발광 장식(userData.glow)은 방 분위기 단계에 따라 밝아진다

import * as THREE from "three";
import type { ZoneKey } from "../../core/types";

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
}

function glow(color: number, base = 0.9): THREE.MeshStandardMaterial {
  const m = std(color, { emissive: color, emissiveIntensity: base });
  m.userData.glowBase = base;
  return m;
}

function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function alchemy(g: THREE.Group): void {
  const wood = std(0x5c2d16);
  g.add(box(3.2, 0.12, 0.5, wood, 1.6, 2.6, -4.6), box(3.2, 0.12, 0.5, wood, 1.6, 3.4, -4.6));
  const colors = [0xa855f7, 0x22c55e, 0xf43f5e, 0x38bdf8, 0xfde047];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.36, 10), glow(colors[i % 5], 0.5));
    b.position.set(0.3 + (i % 5) * 0.62, i < 5 ? 2.85 : 3.65, -4.6);
    g.add(b);
  }
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.03, 40), std(0x6d28d9));
  rug.position.set(0.6, 0.02, 0.8);
  rug.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.06, 6, 40), std(0xfbbf24, { metalness: 0.4 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0.6, 0.05, 0.8);
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), glow(0xffb020));
  lantern.position.set(-3.6, 3.6, 1.5);
  g.add(rug, ring, lantern, box(0.04, 0.8, 0.04, std(0x111827), -3.6, 4.1, 1.5));
}

function harbor(g: THREE.Group): void {
  const frame = std(0xf8fafc);
  const sea = glow(0x38bdf8, 0.45);
  g.add(box(3.4, 2.0, 0.08, sea, 1.2, 2.6, -4.8), box(3.6, 0.15, 0.15, frame, 1.2, 3.65, -4.75), box(3.6, 0.15, 0.15, frame, 1.2, 1.55, -4.75), box(0.12, 2.1, 0.15, frame, 1.2, 2.6, -4.75));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), glow(0xfde68a, 0.9));
  sun.position.set(2.2, 3.1, -4.74);
  g.add(sun);
  for (let i = 0; i < 10; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow([0xfde047, 0xf472b6, 0x38bdf8][i % 3], 1));
    bulb.position.set(-4.7, 4.1 - Math.sin((i / 9) * Math.PI) * 0.5, -4 + i * 0.85);
    g.add(bulb);
  }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 14), std(0xc2410c));
  pot.position.set(3.9, 0.25, -3.9);
  const palm = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 7), std(0x16a34a));
  palm.position.set(3.9, 1.3, -3.9);
  g.add(pot, palm);
}

function garden(g: THREE.Group): void {
  const glass = std(0xbae6fd, { transparent: true, opacity: 0.35 });
  const bar = std(0xe2e8f0, { metalness: 0.5 });
  for (let i = 0; i < 5; i++) g.add(box(0.06, 4.2, 0.06, bar, -4.2 + i * 2.1, 2.1, -4.78));
  g.add(box(9.6, 3.6, 0.04, glass, 0, 2.4, -4.82));
  for (let i = 0; i < 6; i++) {
    const vine = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 6, 16, Math.PI * 1.4), std(0x22c55e));
    vine.position.set(-4.75, 3.8 - i * 0.55, -3 + i * 1.1);
    vine.rotation.y = Math.PI / 2;
    g.add(vine);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glow([0xf9a8d4, 0xfde047, 0xc4b5fd][i % 3], 0.6));
    flower.position.set(-4.65, 3.85 - i * 0.55, -2.7 + i * 1.1);
    g.add(flower);
  }
}

function banquet(g: THREE.Group): void {
  const gold = std(0xfbbf24, { metalness: 0.6, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 32), gold);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0.4, 4.0, 0.4);
  g.add(ring, box(0.04, 0.9, 0.04, gold, 0.4, 4.5, 0.4));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow(0xfff1c1, 1));
    c.position.set(0.4 + Math.cos(a), 4.12, 0.4 + Math.sin(a));
    g.add(c);
  }
  const banner = std(0x7f1d1d);
  for (const x of [-2.6, 0.6, 3.4]) {
    g.add(box(1.0, 1.8, 0.04, banner, x, 3.2, -4.8));
    const crest = new THREE.Mesh(new THREE.CircleGeometry(0.22, 5), glow(0xfde047, 0.7));
    crest.position.set(x, 3.3, -4.77);
    g.add(crest);
  }
  for (let i = 0; i < 14; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), glow(0xffffff, 1));
    star.position.set(-4.78, 2.6 + Math.random() * 1.7, -4 + Math.random() * 8);
    g.add(star);
  }
}

const BUILDERS: Record<ZoneKey, (g: THREE.Group) => void> = { alchemy, harbor, garden, banquet };

export function buildZoneDecor(zone: ZoneKey): THREE.Group {
  const g = new THREE.Group();
  g.name = "decor";
  BUILDERS[zone](g);
  return g;
}

// 방 분위기 단계(0~5)에 맞춰 발광 장식 밝기 조절
export function setDecorGlow(root: THREE.Object3D, step: number): void {
  const k = 0.25 + step * 0.15;
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshToonMaterial | undefined;
    const base = (mat as THREE.Material | undefined)?.userData?.glowBase;
    if (mat && typeof base === "number" && "emissiveIntensity" in mat) mat.emissiveIntensity = base * k;
  });
}
