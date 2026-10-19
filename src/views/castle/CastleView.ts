// CastleView.ts — Three.js 마녀의 성 화면: 성 전체 지도 / 구역 방 + 가구, 카메라(줌·대상 이동), 핀 투영, 복구 버스트
// 완료·잠금·비용 판단은 core가 하고, 이 뷰는 넘겨받은 rooms 상태를 그리기만 한다

import * as THREE from "three";
import { gsap } from "gsap";
import type { SpotState, ZoneKey } from "../../core/types";
import { ROOMS, STYLE_PALETTES } from "../../core/rules/rooms";
import { SPOT_LAYOUT, ZONE_LOOK } from "./layout";
import { buildRoomLights } from "./scenes";
import { MAP_CENTER, buildFloorplan, wingPinPos } from "./floorplan";
import { buildSpotClutter, buildSpotFurniture, buildZoneProps, zonePropModels, spotModelNames, CLUTTER_MODELS } from "./furniture";
import { ModelLibrary } from "./models/library";
import { Ambience } from "./ambience";
import { addOutline, disposeGroup, toonify } from "./toon";
import { setDecorGlow } from "./decor";
import { ZONE_MODULES, moduleIndexOf, moduleStates, panClampModules, zoneBounds, frameZone, ROOM_CAM_DIR, type ModuleState } from "./modules";
import { animateModuleAppear, animateModuleBuild, buildModules } from "./roomBuilder";
import { ZONE_RESIDENT } from "./resident";
import { CharacterActor, walkPath, walkTargets, zoneGuests } from "./actor";
import { CharacterLibrary } from "./characters3d";

const DEFAULT_CAM = new THREE.Vector3(10, 10.5, 10);
// 방은 조금 위에서 내려다보고(바닥이 화면을 더 채우게) 확대한 뒤, 손가락으로 끌어 둘러본다
const ROOM_CAM_OFFSET = new THREE.Vector3(...ROOM_CAM_DIR);
const ROOM_ZOOM = 1.4;

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
    // 그림자는 장면이 바뀔 때만 다시 그린다 (가구가 많아져 매 프레임 그리면 휴대폰에 부담)
    this.renderer.shadowMap.autoUpdate = false;
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

  // Galaxy S25 세로 비율에서도 방(±7.5)·지도(가로 ±7.4)가 잘리지 않도록 최소 시야 보장 (v2와 같은 규칙)
  resize(): void {
    if (!this.renderer) return;
    const w = this.host.clientWidth || 360;
    const h = this.host.clientHeight || 320;
    if (w <= 0 || h <= 0) return;
    const aspect = w / h;
    const minHalfW = this.mode === "map" ? 8.6 : 7.5;
    const minHalfH = this.mode === "map" ? 7.0 : 5.5;
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

  // 레고식 방: 조각 상태(지어짐·폐허·청사진)와 그 범위에 맞춘 카메라 기준점·줌
  private modules: THREE.Group | null = null;
  private states: ModuleState[] = [];
  private home = new THREE.Vector3(0, 1, 0);
  private fit = ROOM_ZOOM;
  private glowStep = 0;
  private dirLight: THREE.DirectionalLight | null = null;
  private zoneProps: THREE.Group | null = null;
  private zonePropsCount = -1;
  // 방 안 3D 캐릭터: 구역 주민 + 복구한 장소 대사에 나온 손님 (최대 3명)
  actors: CharacterActor[] = [];
  private actorToken = 0;

  // 복구 수에 맞춰 분위기 소품을 다시 놓는다 (늘어난 소품은 톡 튀어나오게)
  private renderZoneProps(animate: boolean): void {
    if (this.mode !== "room") return;
    const count = this.doneCount();
    if (count === this.zonePropsCount && this.zoneProps) return;
    const prevKids = this.zoneProps?.children.length ?? 0;
    if (this.zoneProps) {
      this.roomGroup.remove(this.zoneProps);
      disposeGroup(this.zoneProps);
    }
    const g = buildZoneProps(this.zone, count, STYLE_PALETTES[0]);
    toonify(g);
    addOutline(g, 0.02);
    this.roomGroup.add(g);
    this.zoneProps = g;
    this.zonePropsCount = count;
    this.refreshShadows();
    if (animate) {
      this.refreshShadowsFor(800 + 150 * g.children.length);
      g.children.slice(prevKids).forEach((c, i) => {
        gsap.fromTo(c.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: c.scale.x, y: c.scale.y, z: c.scale.z, duration: 0.5, delay: 0.15 * i, ease: "back.out(2.5)" });
      });
    }
  }

  private clearGroup(): void {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    this.actorToken++;
    for (const child of [...this.roomGroup.children]) {
      this.roomGroup.remove(child);
      disposeGroup(child);
    }
    this.modules = null;
    this.dirLight = null;
    this.zoneProps = null;
    this.zonePropsCount = -1;
    this.furniture.clear();
    this.bursts = [];
  }

  showMap(rooms: Record<string, SpotState>, accessible: ZoneKey[]): void {
    this.mode = "map";
    this.preview = null;
    this.previewModule = null;
    this.clearGroup();
    this.scene.background = buildFloorplan(this.roomGroup, rooms, accessible);
    this.ambientLight = null;
    this.ambience = null;
    legacyLightCompensate(this.roomGroup);
    toonify(this.roomGroup);
    addOutline(this.roomGroup, 0.012);
    this.refreshShadows();
    this.resetCamera(false);
    this.resize();
  }

  showZone(zone: ZoneKey, rooms: Record<string, SpotState>): void {
    this.mode = "room";
    this.zone = zone;
    this.rooms = rooms;
    this.preview = null;
    this.previewModule = null;
    this.clearGroup();
    const shell = buildRoomLights(this.roomGroup, ZONE_LOOK[zone]);
    this.scene.background = shell.background;
    this.ambientLight = shell.ambient;
    this.dirLight = shell.dirLight;
    // 반구광: 그림자 쪽도 보랏빛으로 채워 툰 명암이 탁해지지 않게
    this.roomGroup.add(new THREE.HemisphereLight(0xe9dcff, 0x3b2160, 0.95));
    this.states = this.computeStates();
    this.renderModules();
    for (const spot of ROOMS[zone].spots) this.renderSpot(spot.id);
    legacyLightCompensate(this.roomGroup);
    this.ambience = new Ambience(this.ambientLight, (step) => {
      this.glowStep = step;
      if (this.modules) setDecorGlow(this.modules, step);
    });
    this.roomGroup.add(this.ambience.group);
    this.ambience.apply(this.doneCount(), false);
    this.renderZoneProps(false);
    this.updateFraming();
    this.resetCamera(false);
    this.resize();
    this.loadZoneModels(zone);
    this.syncActors();
    this.refreshShadows();
  }

  // 있어야 할 캐릭터를 맞춘다: 모델이 준비된 캐릭터는 바로, 아니면 불러온 뒤 (그 사이 구역이 바뀌면 무시)
  private syncActors(): void {
    if (this.mode !== "room") return;
    const { id: resident, pos: home } = ZONE_RESIDENT[this.zone];
    const want = [resident, ...zoneGuests(this.zone, this.rooms, resident)];
    for (const a of this.actors.filter((x) => !want.includes(x.id))) a.dispose();
    this.actors = this.actors.filter((x) => want.includes(x.id));
    const targets = walkTargets(this.zone, this.states);
    const zone = this.zone;
    const states = [...this.states];
    const pathOf = (f: [number, number], t: [number, number]) => walkPath(zone, states, f, t);
    for (const a of this.actors) a.setTargets(targets, pathOf);
    const missing = want.filter((id) => !this.actors.some((a) => a.id === id));
    if (!missing.length) return;
    const token = ++this.actorToken;
    const spawn = (ids: string[]) => {
      if (token !== this.actorToken || this.mode !== "room") return;
      for (const id of ids) {
        if (this.actors.some((a) => a.id === id)) continue;
        const built = CharacterLibrary.build(id);
        if (!built) continue;
        toonify(built.root);
        const at: [number, number] = id === resident ? home : targets[(this.actors.length * 3 + 1) % Math.max(1, targets.length)] ?? home;
        const actor = new CharacterActor(id, built, at);
        actor.setTargets(targets, pathOf);
        this.roomGroup.add(actor.group);
        this.actors.push(actor);
        gsap.from(actor.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.45, ease: "back.out(2)" });
      }
      this.refreshShadowsFor(600);
    };
    // 준비된 캐릭터부터 바로, 나머지는 각자 모델(과 옷 색)이 준비되는 대로 — 가장 늦은 캐릭터를 다 같이 기다리지 않게
    const now = missing.filter((id) => CharacterLibrary.ready(id));
    if (now.length) spawn(now);
    for (const id of missing.filter((x) => !now.includes(x)))
      CharacterLibrary.preload([id])
        .then(() => spawn([id]))
        .catch((err) => console.warn("캐릭터를 불러오지 못함", id, err));
  }

  // 화면 좌표로 캐릭터 고르기 (탭해서 인사)
  pickActor(clientX: number, clientY: number): CharacterActor | null {
    if (this.mode !== "room" || !this.actors.length) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    let best: { a: CharacterActor; d: number } | null = null;
    for (const a of this.actors) {
      // 스킨 메시는 정확한 판정이 비싸므로 캐릭터를 감싸는 원기둥 근사로 고른다
      const p = a.group.position;
      const box = new THREE.Box3(new THREE.Vector3(p.x - 0.7, 0, p.z - 0.7), new THREE.Vector3(p.x + 0.8, 2.8, p.z + 0.8));
      const hit = ray.ray.intersectBox(box, new THREE.Vector3());
      if (hit) {
        const d = hit.distanceTo(ray.ray.origin);
        if (!best || d < best.d) best = { a, d };
      }
    }
    return best?.a ?? null;
  }

  moduleStateList(): ModuleState[] {
    return [...this.states];
  }

  // 지금 화면에 그려진 조각 상태 (벽걸이 장소 미리보기 중엔 그 조각을 지어진 모습으로)
  shownModuleStates(): ModuleState[] {
    return [...this.shownStates];
  }
  private shownStates: ModuleState[] = [];
  private previewModule: number | null = null;

  private computeStates(): ModuleState[] {
    return moduleStates(this.zone, (id) => !!this.rooms[id]?.done);
  }

  // 방 조각을 상태에 맞춰 다시 만든다 (재질은 구역별로 공유되어 툰 변환도 재사용)
  private renderModules(appearing?: number, states: ModuleState[] = this.states): THREE.Group {
    if (this.modules) {
      this.roomGroup.remove(this.modules);
      disposeGroup(this.modules);
    }
    this.shownStates = [...states];
    const g = buildModules(this.zone, states, { appearing });
    toonify(g);
    addOutline(g, 0.02);
    setDecorGlow(g, this.glowStep);
    this.roomGroup.add(g);
    this.modules = g;
    this.refreshShadows();
    return g;
  }

  // 지어진 조각 + 폐허 범위로 카메라 기준점·줌·끌기 범위·그림자 범위를 맞춘다
  private updateFraming(): void {
    const defs = ZONE_MODULES[this.zone];
    const b = zoneBounds(defs, this.states);
    // 화면에 보이는 모양의 가운데를 바라보고, 투영 폭에 맞춰 줌 (끌어서 둘러보는 범위는 panClampModules)
    const f = frameZone(defs, this.states);
    this.fit = f.zoom;
    this.home.set(f.x, f.y, f.z);
    const dl = this.dirLight;
    if (dl) {
      const r = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.8 + 3;
      dl.target.position.set(this.home.x, 0, this.home.z);
      dl.position.set(this.home.x + 8, 16, this.home.z + 10);
      Object.assign(dl.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: 60 });
      dl.shadow.camera.updateProjectionMatrix();
    }
  }

  private restoring = false;
  private rerenderAfterRestore = false;
  private modelsReady: Promise<void> = Promise.resolve();

  private rerenderModels(): void {
    for (const sp of ROOMS[this.zone].spots) if (sp.id !== this.holdSpot) this.renderSpot(sp.id);
    this.zonePropsCount = -1;
    this.renderZoneProps(false);
  }

  // 구역 모델을 불러오는 동안은 절차적 가구를 보여 주고, 다 오면 장소를 모델로 다시 그린다 (이미 캐시에 있으면 즉시)
  private loadZoneModels(zone: ZoneKey): void {
    const names = [...ROOMS[zone].spots.flatMap((sp) => spotModelNames(sp.id)), ...CLUTTER_MODELS, ...zonePropModels(zone)];
    if (ModelLibrary.hasAll(names)) {
      this.modelsReady = Promise.resolve();
      return;
    }
    this.modelsReady = ModelLibrary.preload(names).then(() => {
      if (this.mode !== "room" || this.zone !== zone) return;
      // 복구 연출 중에는 떨어지는 가구를 바꾸지 않고, 연출이 끝난 뒤 다시 그린다
      if (this.restoring) {
        this.rerenderAfterRestore = true;
        return;
      }
      this.rerenderModels();
    });
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
    if (this.holdSpot) return;
    const next = this.computeStates();
    if (next.join() !== this.states.join()) {
      this.states = next;
      this.renderModules();
      for (const spot of ROOMS[this.zone].spots) this.renderSpot(spot.id);
      this.updateFraming();
      this.resetCamera(false);
      this.syncActors();
    }
    this.renderZoneProps(true);
  }

  doneCount(): number {
    return ROOMS[this.zone].spots.filter((sp) => this.rooms[sp.id]?.done).length;
  }

  // 🔨 복구 순간: 방을 어둡게 → 스포트라이트 → 카메라 다가감 → 잔해가 가라앉고 → 방 조각이 지어짐(바닥·벽·문)
  // → 가구가 떨어지며 쿵 + 반짝임 → 다음 장소 폐허가 나타남 → 조명 복귀, 카메라가 넓어진 방을 다시 잡음
  async playRestore(spotId: string, rooms: Record<string, SpotState>): Promise<void> {
    if (this.mode !== "room") {
      this.holdSpot = null;
      return;
    }
    const zone = this.zone;
    const left = () => this.mode !== "room" || this.zone !== zone;
    this.rooms = rooms;
    this.restoring = true;
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
    const endEarly = () => {
      this.restoring = false;
      this.holdSpot = null;
      if (this.spot === spot) this.spot = null;
    };
    // 모델이 오는 중이면 어두워지는 동안 조금 기다려, 떨어지는 가구가 최종 모습이 되게 한다
    await Promise.all([this.focusSpot(spotId, 1.5, 0.6), Promise.race([this.modelsReady, wait(1200)])]);
    if (left()) return endEarly();

    // 잔해가 가라앉음
    const clutter = this.furniture.get(spotId);
    if (clutter) gsap.to(clutter.position, { y: clutter.position.y - 1.2, duration: 0.3, ease: "power2.in" });
    if (clutter) gsap.to(clutter.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 0.3, ease: "power2.in" });
    await wait(320);
    if (left()) return endEarly();

    // 방 조각 짓기
    this.states = this.computeStates();
    // 다음 장소 폐허는 가구가 떨어진 뒤에 나타나도록 그때까지 청사진으로 둔다
    const nextIdx = this.states.indexOf("ruin");
    const modules = this.renderModules(nextIdx > 0 ? nextIdx : undefined);
    const idx = moduleIndexOf(zone, spotId);
    const buildSec = animateModuleBuild(modules, idx);
    this.refreshShadowsFor(buildSec * 1000 + 1500);
    await wait(buildSec * 1000 * 0.8);
    if (left()) return endEarly();

    const g = this.renderSpot(spotId);
    this.holdSpot = null;
    if (g) {
      gsap.fromTo(g.position, { y: layout.pos[1] + 2.8 }, { y: layout.pos[1], duration: 0.65, ease: "bounce.out" });
      gsap.fromTo(g.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1, y: 1, z: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" });
    }
    for (const a of this.actors) a.cheer();
    await wait(450);
    this.constructionBurst(spotId, 22);
    await wait(250);
    this.constructionBurst(spotId, 14);

    // 다음 장소 폐허가 청사진 자리에 나타남
    const nextSpot = nextIdx > 0 ? ZONE_MODULES[zone][nextIdx].spotId : null;
    if (nextSpot) {
      animateModuleAppear(modules, nextIdx);
      const ng = this.renderSpot(nextSpot);
      if (ng) gsap.from(ng.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: "back.out(1.8)" });
    }
    await wait(500);
    gsap.to(spot, { intensity: 0, duration: 0.6, onComplete: () => { this.roomGroup.remove(spot, spot.target); if (this.spot === spot) this.spot = null; } });
    if (amb) gsap.to(amb, { intensity: prevIntensity, duration: 0.4 });
    this.ambience?.apply(this.doneCount(), true);
    this.renderZoneProps(true);
    this.updateFraming();
    this.resetCamera(true);
    this.syncActors();
    await wait(700);
    this.restoring = false;
    if (this.rerenderAfterRestore && this.mode === "room") {
      this.rerenderAfterRestore = false;
      this.rerenderModels();
    }
  }

  // 🎉 구역 완성: 복구 전(0단계) 모습을 잠깐 보여 준 뒤 완성된 모습(5단계)으로 밝아지고, 카메라가 좌우로 둘러본다
  playZoneShowcase(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mode !== "room") return resolve();
      this.resetCamera(false);
      this.ambience?.apply(0, false);
      // 방 구도(ROOM_CAM_OFFSET·확대) 그대로 좌우로 둘러본다
      const radius = Math.hypot(ROOM_CAM_OFFSET.x, ROOM_CAM_OFFSET.z);
      const base = Math.atan2(ROOM_CAM_OFFSET.z, ROOM_CAM_OFFSET.x);
      const z0 = this.baseZoom();
      const orbit = { a: 0, zoom: 1 };
      const apply = () => {
        const ang = base + orbit.a;
        this.camera.position.set(this.lookTarget.x + Math.cos(ang) * radius, this.lookTarget.y + ROOM_CAM_OFFSET.y, this.lookTarget.z + Math.sin(ang) * radius);
        this.camera.zoom = orbit.zoom * z0;
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
        .to(orbit, { a: 0.75, zoom: 1.12, duration: 1.6, ease: "sine.inOut" })
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
    if (old) {
      this.roomGroup.remove(old);
      disposeGroup(old);
    }
    const st = this.rooms[spotId] ?? { done: false, styleIdx: 0 };
    const previewing = this.preview?.spotId === spotId;
    const styleIdx = previewing ? this.preview!.styleIdx : st.styleIdx;
    const group = new THREE.Group();
    group.position.set(...layout.pos);
    if (st.done || previewing) {
      const pal = STYLE_PALETTES[styleIdx] ?? STYLE_PALETTES[0];
      buildSpotFurniture(spotId, group, pal, layout.type);
      const pt = new THREE.PointLight(pal.accent, 0.85, 5.5);
      pt.position.set(0, 2, 0);
      group.add(pt);
    } else if (this.states[moduleIndexOf(this.zone, spotId)] === "ruin") {
      // 다음 복구 장소(폐허 조각)에만 잔해. 그 뒤 장소는 청사진이라 비워 둔다
      const idx = ROOMS[this.zone].spots.findIndex((sp) => sp.id === spotId);
      buildSpotClutter(Math.max(0, idx), group, -layout.pos[1]);
    }
    legacyLightCompensate(group);
    toonify(group);
    addOutline(group, 0.025);
    this.roomGroup.add(group);
    this.furniture.set(spotId, group);
    this.refreshShadows();
    return group;
  }

  furnitureOf(spotId: string): THREE.Group | null {
    return this.furniture.get(spotId) ?? null;
  }

  previewSpot(spotId: string, styleIdx: number): void {
    const first = this.preview?.spotId !== spotId;
    this.preview = { spotId, styleIdx };
    // 벽에 거는 장소(창문·태피스트리 등)를 폐허 조각에서 미리 보면 벽이 없어 공중에 뜬다 — 미리보기 동안 그 조각을 지어진 모습으로
    const idx = moduleIndexOf(this.zone, spotId);
    if (first && this.mode === "room" && SPOT_LAYOUT[spotId]?.pos[1] > 0.5 && this.states[idx] === "ruin") {
      this.previewModule = idx;
      this.renderModules(undefined, this.states.map((s, i) => (i === idx ? "built" : s)));
    }
    const g = this.renderSpot(spotId);
    if (g) gsap.fromTo(g.scale, { x: 0.7, y: 0.7, z: 0.7 }, { x: 1, y: 1, z: 1, duration: 0.38, ease: "back.out(2)" });
    this.refreshShadowsFor(600);
    if (first) this.focusSpot(spotId);
  }

  clearPreview(): void {
    const id = this.preview?.spotId;
    this.preview = null;
    if (this.previewModule !== null) {
      this.previewModule = null;
      // 확정해서 복구 연출이 곧 시작되면(holdSpot) 지어진 모습을 그대로 두고 연출이 다시 짓게 한다 — 폐허로 잠깐 돌아갔다 다시 지어지는 깜빡임 방지
      if (this.mode === "room" && this.holdSpot !== id) this.renderModules();
    }
    if (id) this.renderSpot(id);
    this.resetCamera(true);
  }

  private baseZoom(): number {
    return this.mode === "room" ? this.fit : 1;
  }

  // 카메라는 바라보는 점에서 항상 같은 방향·거리에 둔다 (구도 유지)
  private aim(): void {
    const off = this.mode === "room" ? ROOM_CAM_OFFSET : DEFAULT_CAM.clone().sub(new THREE.Vector3(0, 1, 0));
    this.camera.position.copy(this.lookTarget).add(off);
    this.camera.lookAt(this.lookTarget);
  }

  // 손가락 끌기로 방 둘러보기 (화면 픽셀 → 바닥 평면 이동, 방 밖으로는 못 나감)
  panBy(dx: number, dy: number): void {
    if (this.mode !== "room" || !this.camera) return;
    const w = this.host.clientWidth || 1;
    const perPx = (this.camera.right - this.camera.left) / this.camera.zoom / w;
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).setY(0).normalize();
    const fwd = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1).setY(0).normalize();
    this.lookTarget.addScaledVector(right, -dx * perPx).addScaledVector(fwd, dy * perPx * 1.6);
    const [x, z] = panClampModules(ZONE_MODULES[this.zone], this.states, this.lookTarget.x, this.lookTarget.z, this.home);
    this.lookTarget.x = x;
    this.lookTarget.z = z;
    this.aim();
  }

  focusSpot(spotId: string, zoom = 1.55, duration = 0.65): Promise<void> {
    const layout = SPOT_LAYOUT[spotId];
    if (!layout) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.to(this.camera, { zoom: Math.max(zoom * this.baseZoom() * 0.85, this.baseZoom()), duration, ease: "power2.out", onUpdate: () => this.camera.updateProjectionMatrix() });
      gsap.to(this.lookTarget, {
        x: layout.pos[0],
        y: layout.pos[1] + 0.9,
        z: layout.pos[2],
        duration,
        ease: "power2.out",
        onUpdate: () => this.aim(),
        onComplete: () => resolve(),
      });
    });
  }

  resetCamera(animate: boolean): void {
    gsap.killTweensOf(this.camera);
    gsap.killTweensOf(this.lookTarget);
    const z0 = this.baseZoom();
    const home = this.mode === "room" ? this.home : new THREE.Vector3(...MAP_CENTER);
    if (!animate) {
      this.camera.zoom = z0;
      this.lookTarget.copy(home);
      this.camera.updateProjectionMatrix();
      this.aim();
      return;
    }
    gsap.to(this.camera, { zoom: z0, duration: 0.55, ease: "power2.inOut", onUpdate: () => this.camera.updateProjectionMatrix() });
    gsap.to(this.lookTarget, { x: home.x, y: home.y, z: home.z, duration: 0.55, ease: "power2.inOut", onUpdate: () => this.aim() });
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
    return this.project(wingPinPos(zone));
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

  private refreshShadows(): void {
    if (this.renderer) this.renderer.shadowMap.needsUpdate = true;
  }

  // 가구가 튀어나오는 동안은 그림자도 따라가게 잠깐 매 프레임 갱신
  private shadowBusyUntil = 0;
  private refreshShadowsFor(ms: number): void {
    this.shadowBusyUntil = Math.max(this.shadowBusyUntil, performance.now() + ms);
  }

  private step(dt: number): void {
    if (this.restoring || this.showcase || performance.now() < this.shadowBusyUntil) this.refreshShadows();
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
    for (const a of this.actors) a.tick(dt);
    for (const fn of this.frameHooks) fn(dt);
  }
}
