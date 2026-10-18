// ambience.ts — 복구한 장소 수(0~5)에 따라 방 분위기를 바꾼다: 주변광 색·세기, 창가의 따뜻한 빛, 먼지·반짝임 파티클, 촛불, 바닥 금
// 0단계: 어둡고 차가운 빛 + 먼지 + 바닥 금 / 5단계: 따뜻하고 밝은 빛 + 금빛 반짝임 + 촛불 6개

import * as THREE from "three";
import { gsap } from "gsap";
import { ambienceByProgress, type AmbienceStep } from "../../core/rules/rooms";

const CANDLE_SPOTS: Array<[number, number, number]> = [
  [-4.3, 0, -4.3],
  [4.2, 0, -4.4],
  [-4.4, 0, 4.2],
  [-4.4, 0, 0],
  [0, 0, -4.4],
  [2.2, 0, 4.0],
];

interface Drift {
  base: Float32Array;
  phase: Float32Array;
}

export class Ambience {
  readonly group = new THREE.Group();
  private warm: THREE.PointLight;
  private dust: THREE.Points;
  private sparkles: THREE.Points;
  private candles: THREE.Group[] = [];
  private cracks: THREE.Group;
  private dustDrift: Drift;
  private sparkDrift: Drift;
  private t = 0;
  step = 0;

  constructor(private readonly ambient: THREE.AmbientLight | null) {
    this.group.name = "ambience";
    this.warm = new THREE.PointLight(0xffb36b, 0, 14, 1);
    this.warm.position.set(-3.5, 3.6, -3.5);
    this.group.add(this.warm);

    [this.dust, this.dustDrift] = makePoints(60, 0xcbd5e1, 0.07, 0.55);
    [this.sparkles, this.sparkDrift] = makePoints(45, 0xfde047, 0.11, 0.9);
    this.group.add(this.dust, this.sparkles);

    for (const [x, y, z] of CANDLE_SPOTS) {
      const c = new THREE.Group();
      c.position.set(x, y, z);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 10), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 }));
      stick.position.y = 0.21;
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffb020 }));
      flame.position.y = 0.5;
      flame.scale.y = 1.6;
      const light = new THREE.PointLight(0xffa040, 0.9 * Math.PI, 3.2, 1);
      light.position.y = 0.6;
      c.add(stick, flame, light);
      c.visible = false;
      c.userData = { flame, light };
      this.candles.push(c);
      this.group.add(c);
    }

    this.cracks = new THREE.Group();
    const crackMat = new THREE.MeshBasicMaterial({ color: 0x1f1530, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 9; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.9 + Math.random() * 0.8, 0.012, 0.05), crackMat);
      seg.position.set(-2.5 + Math.random() * 5, 0.008, -2.5 + Math.random() * 5);
      seg.rotation.y = Math.random() * Math.PI;
      this.cracks.add(seg);
    }
    this.group.add(this.cracks);
  }

  apply(step: number, animate: boolean): void {
    this.step = Math.max(0, Math.min(5, step));
    const a: AmbienceStep = ambienceByProgress[this.step];
    const dur = animate ? 1.2 : 0;
    if (this.ambient) {
      const color = new THREE.Color(a.ambientColor);
      gsap.to(this.ambient.color, { r: color.r, g: color.g, b: color.b, duration: dur });
      gsap.to(this.ambient, { intensity: a.ambientIntensity * Math.PI, duration: dur });
    }
    gsap.to(this.warm, { intensity: a.warmLight * 2.2 * Math.PI, duration: dur });
    setDrawCount(this.dust, a.dust);
    setDrawCount(this.sparkles, a.sparkles);
    this.candles.forEach((c, i) => {
      const on = i < a.candles;
      if (on && !c.visible && animate) {
        c.visible = true;
        gsap.fromTo(c.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.6, delay: i * 0.08, ease: "back.out(2)" });
      } else c.visible = on;
    });
    this.cracks.visible = this.step === 0;
  }

  // 촛불 깜빡임·파티클 떠다님
  tick(dt: number): void {
    this.t += dt * 0.016;
    for (const c of this.candles) {
      if (!c.visible) continue;
      const f = 0.85 + Math.sin(this.t * 13 + c.position.x) * 0.1 + Math.random() * 0.05;
      (c.userData.light as THREE.PointLight).intensity = 0.9 * Math.PI * f;
      (c.userData.flame as THREE.Mesh).scale.set(f, 1.6 * f, f);
    }
    drift(this.dust, this.dustDrift, this.t, 0.25);
    drift(this.sparkles, this.sparkDrift, this.t, 0.45);
  }
}

function makePoints(n: number, color: number, size: number, opacity: number): [THREE.Points, Drift] {
  const pos = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = -4.4 + Math.random() * 8.8;
    pos[i * 3 + 1] = 0.3 + Math.random() * 3.6;
    pos[i * 3 + 2] = -4.4 + Math.random() * 8.8;
    phase[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  geo.setDrawRange(0, 0);
  return [pts, { base: pos, phase }];
}

function setDrawCount(p: THREE.Points, n: number): void {
  p.geometry.setDrawRange(0, n);
}

function drift(p: THREE.Points, d: Drift, t: number, amp: number): void {
  const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
  const count = p.geometry.drawRange.count;
  for (let i = 0; i < Math.min(count, d.phase.length); i++) {
    attr.setXYZ(i, d.base[i * 3] + Math.sin(t + d.phase[i]) * amp, d.base[i * 3 + 1] + Math.sin(t * 0.7 + d.phase[i] * 2) * amp * 0.6, d.base[i * 3 + 2] + Math.cos(t + d.phase[i]) * amp);
  }
  attr.needsUpdate = true;
}
