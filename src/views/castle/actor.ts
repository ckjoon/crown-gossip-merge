// actor.ts — 방 안을 돌아다니는 3D 캐릭터: 대기 → 가끔 지어진 조각 사이를 걸어 다님, 탭하면 손 흔들기, 복구 때 환호
// 걷기 목표는 지어진 조각 칸의 빈 자리(가구는 칸 가운데)에서만 고른다

import * as THREE from "three";
import { ROOMS } from "../../core/rules/rooms";
import type { SpotState, ZoneKey } from "../../core/types";
import { CELL, ZONE_MODULES, moduleCells, type ModuleState } from "./modules";
import { CHARACTER_LOOKS, animateAnimal, type BuiltCharacter } from "./characters3d";

// 칸 가운데 기준 빈 자리: 앞쪽 오른쪽·왼쪽 (가구는 가운데, 분위기 소품은 모서리)
const SPOTS_IN_CELL: [number, number][] = [
  [1.5, 0.6],
  [-1.5, 0.9],
];

export function walkTargets(zone: ZoneKey, states: ModuleState[]): [number, number][] {
  const out: [number, number][] = [];
  ZONE_MODULES[zone].forEach((d, i) => {
    if (states[i] !== "built") return;
    for (const [cx, cz] of moduleCells(d)) for (const [ox, oz] of SPOTS_IN_CELL) out.push([cx * CELL + ox, cz * CELL + oz]);
  });
  return out;
}

// 이 구역에서 복구한 장소의 대사에 나온 캐릭터 (가장 최근 장소부터, 주민 제외, 최대 2명)
export function zoneGuests(zone: ZoneKey, rooms: Record<string, SpotState>, residentId: string): string[] {
  const out: string[] = [];
  const spots = ROOMS[zone].spots.filter((s) => rooms[s.id]?.done).reverse();
  for (const s of spots)
    for (const d of s.dialogues) {
      const ids = d.characterId === "quinn_nero" ? ["quinn", "nero"] : [d.characterId];
      for (const id of ids) if (id !== residentId && !out.includes(id) && CHARACTER_LOOKS[id]) out.push(id);
    }
  return out.slice(0, 2);
}

// 탭했을 때 말풍선: 이미 본 이야기에서 그 캐릭터가 한 말 중 하나 (없으면 인사)
export function tapLine(id: string, rooms: Record<string, SpotState>, rng: () => number = Math.random): string {
  const lines: string[] = [];
  for (const z of Object.keys(ROOMS) as ZoneKey[])
    for (const s of ROOMS[z].spots) if (rooms[s.id]?.done) for (const d of s.dialogues) if (d.characterId === id) lines.push(d.line);
  if (!lines.length) return "안녕하세요! 오늘도 성을 함께 꾸며 봐요.";
  return lines[Math.min(lines.length - 1, Math.floor(rng() * lines.length))];
}

type Mode = "idle" | "walk" | "act";
const SPEED = 1.4; // 초당
const FADE = 0.25;

export class CharacterActor {
  readonly group = new THREE.Group();
  private mode: Mode = "idle";
  private wait = 2 + Math.random() * 6;
  private target = new THREE.Vector3();
  private targets: [number, number][] = [];
  private t = Math.random() * 10;
  private current: THREE.AnimationAction | null = null;
  private actTimer = 0;

  constructor(
    readonly id: string,
    private readonly built: BuiltCharacter,
    at: [number, number],
  ) {
    this.group.add(built.root);
    this.group.position.set(at[0], 0, at[1]);
    this.group.rotation.y = Math.random() * 0.8 - 0.4;
    this.group.userData.actorId = id;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    shadow.userData.noOutline = true;
    this.group.add(shadow);
    this.play("Idle");
  }

  setTargets(points: [number, number][]): void {
    this.targets = points;
  }

  private play(name: string, once = false): void {
    const mixer = this.built.mixer;
    const clip = this.built.clips.get(name);
    if (!mixer || !clip) return;
    const next = mixer.clipAction(clip);
    if (next === this.current && !once) return;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.fadeIn(FADE).play();
    this.current?.fadeOut(FADE);
    this.current = next;
  }

  // 복구 순간: 환호 (동물은 신나게 뛴다)
  cheer(): void {
    this.mode = "act";
    this.actTimer = 2.4;
    this.play("Cheer", true);
  }

  // 탭: 손 흔들기
  wave(): void {
    this.mode = "act";
    this.actTimer = 1.8;
    this.play("Interact", true);
    this.faceCamera();
  }

  private faceCamera(): void {
    this.group.rotation.y = Math.PI / 4; // 카메라는 +x·+z 쪽에서 내려다본다
  }

  // dt: 60fps 기준 프레임 수 (CastleView.step과 같은 단위)
  tick(dt: number): void {
    const sec = dt / 60;
    this.t += sec;
    this.built.mixer?.update(sec);
    if (this.built.animal) animateAnimal(this.built.animal, this.t, this.mode === "act");
    if (this.mode === "act") {
      this.actTimer -= sec;
      if (this.actTimer <= 0) {
        this.mode = "idle";
        this.wait = 3 + Math.random() * 5;
        this.play("Idle");
      }
      return;
    }
    if (this.mode === "idle") {
      this.wait -= sec;
      if (this.wait > 0 || this.targets.length === 0) return;
      const here = this.group.position;
      const far = this.targets.filter(([x, z]) => Math.hypot(x - here.x, z - here.z) > 1.2);
      const pick = (far.length ? far : this.targets)[Math.floor(Math.random() * (far.length || this.targets.length))];
      this.target.set(pick[0], 0, pick[1]);
      this.mode = "walk";
      this.play("Walking_A");
      return;
    }
    // 걷기
    const p = this.group.position;
    const dx = this.target.x - p.x;
    const dz = this.target.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) {
      this.mode = "idle";
      this.wait = 6 + Math.random() * 5;
      this.play("Idle");
      return;
    }
    const step = Math.min(d, SPEED * sec);
    p.x += (dx / d) * step;
    p.z += (dz / d) * step;
    const want = Math.atan2(dx, dz);
    let diff = want - this.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.group.rotation.y += diff * Math.min(1, sec * 8);
    if (this.built.animal) this.built.animal.root.position.y = Math.abs(Math.sin(this.t * 10)) * 0.08;
  }

  dispose(): void {
    this.built.mixer?.stopAllAction();
    this.group.removeFromParent();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // 체형 기하는 원본과 공유(SkeletonUtils.clone, userData.shared) — 직접 만든 소품·동물·그림자만 해제
      if (!m.userData.shared) m.geometry.dispose();
    });
  }
}
