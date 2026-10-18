// CastleView.ts — Three.js 마녀의 성 화면: 성 전체 지도 / 구역 방 + 가구, 카메라(줌·대상 이동), 핀 투영, 복구 버스트
// 완료·잠금·비용 판단은 core가 하고, 이 뷰는 넘겨받은 rooms 상태를 그리기만 한다

import * as THREE from "three";
import { gsap } from "gsap";
import type { SpotState, ZoneKey } from "../../core/types";
import { ROOMS, STYLE_PALETTES } from "../../core/rules/rooms";
import { SPOT_LAYOUT, ZONE_LOOK } from "./layout";
import { buildCastleOverview, buildRoomShell } from "./scenes";
import { buildFurniture, buildRubble } from "./furniture";
import { Ambience } from "./ambience";

const DEFAULT_CAM = new THREE.Vector3(10, 10.5, 10);

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface Burst {
  mesh: THREE.Mesh;
  v: THREE.Vector3;
  life: number;
}

// r128(legacy lights) → r186(물리 기반 조명) 밝기 보정
export function legacyLightCompensate(root: THREE.Object3D): void {
  root.traverse((o) => {
    const l = o as THREE.Light;
    if (!l.isLight || l.userData.compensated) return;
    l.userData.compensated = true;
    l.intensity *= Math.PI;
    if ((o as THREE.PointLight).isPointLight || (o as THREE.SpotLight).isSpotLight) (o as THREE.PointLight).decay = 1;
  });
}

export class CastleView {
  readonly scene = new THREE.Scene();
  camera!: THREE.OrthographicCamera;
  renderer!: THREE.WebGLRenderer;
  readonly roomGroup = new THREE.Group();
  readonly lookTarget = new THREE.Vector3(0, 1, 0);
  mode: "map" | "room" = "room";
  zone: ZoneKey = "alchemy";
  private furniture = new Map<string, THREE.Group>();
  private bursts: Burst[] = [];
  private rooms: Record<string, SpotState> = {};
  private preview: { spotId: string; styleIdx: number } | null = null;
  private raf = 0;
  private ro: ResizeObserver | null = null;
  ambientLight: THREE.AmbientLight | null = null;
  ambience: Ambience | null = null;
  private showcase: gsap.core.Timeline | null = null;
  private spot: THREE.SpotLight | null = null;
  private frameHooks = new Set<(dt: number) => void>();
  private active = true;

  constructor(private readonly host: HTMLElement) {}

  init(): void {
    const w = this.host.clientWidth || 360;
    const h = this.host.clientHeight || 320;
    this.camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    this.camera.position.copy(DEFAULT_CAM);
    this.camera.lookAt(this.lookTarget);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.host.innerHTML = "";
    this.host.appendChild(this.renderer.domElement);
    this.scene.add(this.roomGroup);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.host);
    this.resize();
    let last = performance.now();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      if (!this.active) return;
      this.step(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.renderer?.dispose();
  }

  // 성 화면이 숨겨져 있을 때는 그리지 않는다 (배터리 절약)
  setActive(on: boolean): void {
    this.active = on;
    if (on) this.resize();
  }

  onFrame(fn: (dt: number) => void): () => void {
    this.frameHooks.add(fn);
    return () => this.frameHooks.delete(fn);
  }

  // Galaxy S25 세로 비율에서도 방(±7.5)·지도(±8)가 잘리지 않도록 최소 시야 보장 (v2와 같은 규칙)
  resize(): void {
    if (!this.renderer) return;
    const w = this.host.clientWidth || 360;
    const h = this.host.clientHeight || 320;
    if (w <= 0 || h <= 0) return;
    const aspect = w / h;
    const minHalfW = this.mode === "map" ? 8.0 : 7.5;
    const minHalfH = this.mode === "map" ? 6.0 : 5.5;
    let halfW = minHalfH * aspect;
    let halfH = minHalfH;
    if (halfW < minHalfW) {
      halfW = minHalfW;
      halfH = halfW / Math.max(0.35, aspect);
    }
    Object.assign(this.camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private clearGroup(): void {
    for (const child of [...this.roomGroup.children]) this.roomGroup.remove(child);
    this.furniture.clear();
    this.bursts = [];
  }

  showMap(): void {
    this.mode = "map";
    this.preview = null;
    this.clearGroup();
    this.scene.background = buildCastleOverview(this.roomGroup);
    this.ambientLight = null;
    this.ambience = null;
    legacyLightCompensate(this.roomGroup);
    this.resetCamera(false);
    this.resize();
  }

  showZone(zone: ZoneKey, rooms: Record<string, SpotState>): void {
    this.mode = "room";
    this.zone = zone;
    this.rooms = rooms;
    this.preview = null;
    this.clearGroup();
    const shell = buildRoomShell(this.roomGroup, ZONE_LOOK[zone]);
    this.scene.background = shell.background;
    this.ambientLight = shell.ambient;
    for (const spot of ROOMS[zone].spots) this.renderSpot(spot.id);
    legacyLightCompensate(this.roomGroup);
    this.ambience = new Ambience(this.ambientLight);
    this.roomGroup.add(this.ambience.group);
    this.ambience.apply(this.doneCount(), false);
    this.resetCamera(false);
    this.resize();
  }

  // rooms 상태만 바뀌었을 때(복구·스타일 변경) 방을 다시 만들지 않고 해당 가구만 갱신
  // holdSpot: 보상 연출이 직접 등장시킬 가구는 여기서 다시 만들지 않는다
  holdSpot: string | null = null;

  syncRooms(rooms: Record<string, SpotState>): void {
    const prev = this.rooms;
    this.rooms = rooms;
    if (this.mode !== "room") return;
    for (const spot of ROOMS[this.zone].spots) {
      const a = prev[spot.id];
      const b = rooms[spot.id];
      if (spot.id === this.holdSpot) continue;
      if (!a || a.done !== b.done || a.styleIdx !== b.styleIdx) this.renderSpot(spot.id);
    }
  }

  doneCount(): number {
    return ROOMS[this.zone].spots.filter((sp) => this.rooms[sp.id]?.done).length;
  }

  // 🔨 복구 순간: 방을 어둡게 → 스포트라이트 → 카메라 다가감 → 가구가 떨어지며 쿵 + 반짝임 → 조명 복귀와 함께 분위기 한 단계 상승
  async playRestore(spotId: string, rooms: Record<string, SpotState>): Promise<void> {
    if (this.mode !== "room") return;
    this.rooms = rooms;
    const layout = SPOT_LAYOUT[spotId];
    const amb = this.ambientLight;
    const prevIntensity = amb?.intensity ?? 1;
    if (amb) gsap.to(amb, { intensity: 0.15 * Math.PI, duration: 0.5 });
    const spot = new THREE.SpotLight(0xfff3c4, 0, 14, 0.42, 0.45, 1);
    spot.position.set(layout.pos[0] + 1.5, 8, layout.pos[2] + 1.5);
    spot.target.position.set(...layout.pos);
    this.roomGroup.add(spot, spot.target);
    this.spot = spot;
    gsap.to(spot, { intensity: 9 * Math.PI, duration: 0.6 });
    await this.focusSpot(spotId, 1.5, 0.6);
    const g = this.renderSpot(spotId);
    this.holdSpot = null;
    if (g) {
      gsap.fromTo(g.position, { y: layout.pos[1] + 2.8 }, { y: layout.pos[1], duration: 0.65, ease: "bounce.out" });
      gsap.fromTo(g.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1, y: 1, z: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" });
    }
    await wait(450);
    this.constructionBurst(spotId, 22);
    await wait(250);
    this.constructionBurst(spotId, 14);
    await wait(500);
    gsap.to(spot, { intensity: 0, duration: 0.6, onComplete: () => { this.roomGroup.remove(spot, spot.target); this.spot = null; } });
    if (amb) gsap.to(amb, { intensity: prevIntensity, duration: 0.4 });
    this.ambience?.apply(this.doneCount(), true);
    this.resetCamera(true);
    await wait(700);
  }

  // 🎉 구역 완성: 복구 전(0단계) 모습을 잠깐 보여 준 뒤 완성된 모습(5단계)으로 밝아지고, 카메라가 좌우로 둘러본다
  playZoneShowcase(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mode !== "room") return resolve();
      this.resetCamera(false);
      this.ambience?.apply(0, false);
      const radius = Math.hypot(DEFAULT_CAM.x, DEFAULT_CAM.z);
      const base = Math.atan2(DEFAULT_CAM.z, DEFAULT_CAM.x);
      const orbit = { a: 0, zoom: 1 };
      const apply = () => {
        const ang = base + orbit.a;
        this.camera.position.set(Math.cos(ang) * radius, DEFAULT_CAM.y, Math.sin(ang) * radius);
        this.camera.zoom = orbit.zoom;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.lookTarget);
      };
      const finish = () => {
        this.showcase = null;
        this.ambience?.apply(5, false);
        this.resetCamera(false);
        resolve();
      };
      const tl = gsap.timeline({ onUpdate: apply, onComplete: finish });
      tl.to({}, { duration: 1.0 })
        .call(() => this.ambience?.apply(5, true))
        .to(orbit, { a: 0.75, zoom: 1.18, duration: 1.6, ease: "sine.inOut" })
        .to(orbit, { a: -0.75, duration: 1.8, ease: "sine.inOut" })
        .to(orbit, { a: 0, zoom: 1, duration: 0.8, ease: "sine.inOut" });
      this.showcase = tl;
    });
  }

  skipShowcase(): void {
    this.showcase?.progress(1);
  }

  renderSpot(spotId: string): THREE.Group | null {
    const layout = SPOT_LAYOUT[spotId];
    if (!layout) return null;
    const old = this.furniture.get(spotId);
    if (old) this.roomGroup.remove(old);
    const st = this.rooms[spotId] ?? { done: false, styleIdx: 0 };
    const previewing = this.preview?.spotId === spotId;
    const styleIdx = previewing ? this.preview!.styleIdx : st.styleIdx;
    const group = new THREE.Group();
    group.position.set(...layout.pos);
    if (st.done || previewing) {
      const pal = STYLE_PALETTES[styleIdx] ?? STYLE_PALETTES[0];
      buildFurniture(group, layout.type, pal);
      const pt = new THREE.PointLight(pal.accent, 0.85, 5.5);
      pt.position.set(0, 2, 0);
      group.add(pt);
    } else {
      buildRubble(group);
    }
    legacyLightCompensate(group);
    this.roomGroup.add(group);
    this.furniture.set(spotId, group);
    return group;
  }

  furnitureOf(spotId: string): THREE.Group | null {
    return this.furniture.get(spotId) ?? null;
  }

  previewSpot(spotId: string, styleIdx: number): void {
    const first = this.preview?.spotId !== spotId;
    this.preview = { spotId, styleIdx };
    const g = this.renderSpot(spotId);
    if (g) gsap.fromTo(g.scale, { x: 0.7, y: 0.7, z: 0.7 }, { x: 1, y: 1, z: 1, duration: 0.38, ease: "back.out(2)" });
    if (first) this.focusSpot(spotId);
  }

  clearPreview(): void {
    const id = this.preview?.spotId;
    this.preview = null;
    if (id) this.renderSpot(id);
    this.resetCamera(true);
  }

  focusSpot(spotId: string, zoom = 1.55, duration = 0.65): Promise<void> {
    const layout = SPOT_LAYOUT[spotId];
    if (!layout) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.to(this.camera, { zoom, duration, ease: "power2.out", onUpdate: () => this.camera.updateProjectionMatrix() });
      gsap.to(this.lookTarget, {
        x: layout.pos[0],
        y: layout.pos[1] + 0.9,
        z: layout.pos[2],
        duration,
        ease: "power2.out",
        onUpdate: () => this.camera.lookAt(this.lookTarget),
        onComplete: () => resolve(),
      });
    });
  }

  resetCamera(animate: boolean): void {
    gsap.killTweensOf(this.camera);
    gsap.killTweensOf(this.lookTarget);
    if (!animate) {
      this.camera.position.copy(DEFAULT_CAM);
      this.camera.zoom = 1;
      this.lookTarget.set(0, 1, 0);
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.lookTarget);
      return;
    }
    gsap.to(this.camera, { zoom: 1, duration: 0.55, ease: "power2.inOut", onUpdate: () => this.camera.updateProjectionMatrix() });
    gsap.to(this.lookTarget, { x: 0, y: 1, z: 0, duration: 0.55, ease: "power2.inOut", onUpdate: () => this.camera.lookAt(this.lookTarget) });
  }

  // 3D 좌표 → 캔버스 안 픽셀 좌표 (핀 배치용)
  project(pos: [number, number, number]): { x: number; y: number } {
    const v = new THREE.Vector3(...pos).project(this.camera);
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-(v.y * 0.5) + 0.5) * h };
  }

  projectSpot(spotId: string): { x: number; y: number } | null {
    const l = SPOT_LAYOUT[spotId];
    return l ? this.project([l.pos[0], l.pos[1] + 1.35, l.pos[2]]) : null;
  }

  projectZonePin(zone: ZoneKey): { x: number; y: number } {
    return this.project(ZONE_LOOK[zone].castlePinPos);
  }

  // 시공 완료 버스트: 금색·분홍 팔면체 조각이 사방으로 튐
  constructionBurst(spotId: string, count = 18): void {
    const l = SPOT_LAYOUT[spotId];
    if (!l) return;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfde047 : 0xec4899 }));
      mesh.position.set(l.pos[0], l.pos[1] + 0.6, l.pos[2]);
      this.roomGroup.add(mesh);
      const a = (i / count) * Math.PI * 2;
      const sp = 0.05 + Math.random() * 0.06;
      this.bursts.push({ mesh, v: new THREE.Vector3(Math.cos(a) * sp, 0.07 + Math.random() * 0.06, Math.sin(a) * sp), life: 36 });
    }
  }

  private step(dt: number): void {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.mesh.position.addScaledVector(b.v, dt);
      b.v.y -= 0.003 * dt;
      b.mesh.rotation.x += 0.1 * dt;
      b.mesh.rotation.y += 0.1 * dt;
      b.life -= dt;
      if (b.life <= 0) {
        this.roomGroup.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.bursts.splice(i, 1);
      }
    }
    this.ambience?.tick(dt);
    for (const fn of this.frameHooks) fn(dt);
  }
}
