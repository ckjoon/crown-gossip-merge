// floorplan.ts — 🏰 성 전체지도: 가운데 안뜰(분수)에서 4개 구역 날개로 길이 이어진 평면도 디오라마
// 날개마다 방 조각(modules.ts)을 작게 줄여 블록으로 쌓는다: 지어짐 = 구역 색 블록, 폐허 = 회색 낮은 블록, 청사진 = 점선
// 잠긴 구역은 모두 청사진 + 자물쇠. 완료·잠금 판단은 넘겨받은 값대로만 그린다

import * as THREE from "three";
import type { SpotState, ZoneKey } from "../../core/types";
import { CELL, ZONE_MODULES, moduleCells, moduleStates, type Bounds } from "./modules";

export const MAP_SCALE = 0.3;
const C = CELL * MAP_SCALE; // 지도 위 한 칸

// 날개의 입구 홀 위치. 세로 화면을 채우도록 위(공방)→왼쪽(정원)·오른쪽(하버)→아래(연회장)로 늘어놓는다
// (화면 가로 ≈ x−z, 세로 ≈ x+z. 날개끼리·안뜰과 0.6 이상 떨어짐)
export const WING_OFFSET: Record<ZoneKey, [number, number]> = {
  alchemy: [-9.5, -5.1],
  harbor: [-2.4, -6.1],
  garden: [-7.8, -0.6],
  banquet: [-1.3, 7.4],
  cellar: [6.0, -0.7],
  tower: [7.3, 4.7],
};

// 지도 카메라가 바라보는 점 (날개 전체의 화면 가운데)
export const MAP_CENTER: [number, number, number] = [-1.15, 1, -0.9];

export const WING_COLOR: Record<ZoneKey, number> = {
  alchemy: 0x8b5cf6,
  harbor: 0x38bdf8,
  garden: 0x22c55e,
  banquet: 0xf59e0b,
  cellar: 0xea580c,
  tower: 0x6366f1,
};

export function wingBox(zone: ZoneKey): Bounds {
  const [ox, oz] = WING_OFFSET[zone];
  const b: Bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const d of ZONE_MODULES[zone])
    for (const [cx, cz] of moduleCells(d)) {
      b.minX = Math.min(b.minX, ox + (cx - 0.5) * C);
      b.maxX = Math.max(b.maxX, ox + (cx + 0.5) * C);
      b.minZ = Math.min(b.minZ, oz + (cz - 0.5) * C);
      b.maxZ = Math.max(b.maxZ, oz + (cz + 0.5) * C);
    }
  return b;
}

export function wingPinPos(zone: ZoneKey): [number, number, number] {
  const b = wingBox(zone);
  return [(b.minX + b.maxX) / 2, 1.6, (b.minZ + b.maxZ) / 2];
}

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildWing(group: THREE.Group, zone: ZoneKey, rooms: Record<string, SpotState>, unlocked: boolean): void {
  const [ox, oz] = WING_OFFSET[zone];
  const states = moduleStates(zone, (id) => !!rooms[id]?.done, unlocked);
  const builtMat = std(WING_COLOR[zone]);
  const roofMat = std(new THREE.Color(WING_COLOR[zone]).multiplyScalar(0.6).getHex());
  const ruinMat = std(0x64748b, { roughness: 0.9 });
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.12, depthWrite: false });
  const lineMat = new THREE.LineDashedMaterial({ color: 0xe9d5ff, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.7 });
  ZONE_MODULES[zone].forEach((d, i) => {
    const st = states[i];
    const tag = (o: THREE.Object3D, role: string) => {
      o.userData = { ...o.userData, wing: zone, module: i, role };
      group.add(o);
    };
    for (const [cx, cz] of moduleCells(d)) {
      const x = ox + cx * C;
      const z = oz + cz * C;
      if (st === "ghost") {
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(C * 0.92, C * 0.92), ghostMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(x, 0.03, z);
        plane.userData.noOutline = true;
        tag(plane, "ghost");
        const h = (C * 0.92) / 2;
        const pts = [new THREE.Vector3(-h, 0, -h), new THREE.Vector3(h, 0, -h), new THREE.Vector3(h, 0, h), new THREE.Vector3(-h, 0, h), new THREE.Vector3(-h, 0, -h)];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
        line.computeLineDistances();
        line.position.set(x, 0.05, z);
        tag(line, "ghost");
        continue;
      }
      if (st === "ruin") {
        tag(mesh(new THREE.BoxGeometry(C * 0.9, 0.25, C * 0.9), ruinMat, x, 0.125, z), "ruin");
        continue;
      }
      const h = d.kind === "hall" ? 0.9 : 0.55;
      tag(mesh(new THREE.BoxGeometry(C * 0.94, h, C * 0.94), builtMat, x, h / 2, z), "built");
      if (d.kind === "tower") {
        tag(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.7, 12), builtMat, x, h + 0.35, z), "built");
        tag(mesh(new THREE.ConeGeometry(0.42, 0.6, 12), roofMat, x, h + 1.0, z), "roof");
      } else if (d.kind === "hall") {
        tag(mesh(new THREE.ConeGeometry(C * 0.55, 0.6, 4), roofMat, x, h + 0.3, z), "roof");
      }
    }
  });
  if (!unlocked) {
    const [px, , pz] = wingPinPos(zone);
    const gold = std(0xfbbf24, { metalness: 0.5, roughness: 0.3 });
    const body = mesh(new THREE.BoxGeometry(0.7, 0.55, 0.3), gold, px, 1.0, pz);
    const shackle = mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16, Math.PI), gold, px, 1.27, pz);
    for (const o of [body, shackle]) {
      o.userData = { wing: zone, role: "lock" };
      group.add(o);
    }
  }
}

// 지도 장면: 바탕 섬 + 안뜰 분수 + 날개로 가는 길 + 날개 4개
export function buildFloorplan(group: THREE.Group, rooms: Record<string, SpotState>, accessible: ZoneKey[]): THREE.Color {
  const background = new THREE.Color(0x0f0722);
  group.add(new THREE.AmbientLight(0xc084fc, 0.85));
  group.add(new THREE.HemisphereLight(0xe9dcff, 0x3b2160, 0.6));
  const sun = new THREE.DirectionalLight(0xfef08a, 1.05);
  sun.position.set(10, 18, 12);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
  sun.shadow.mapSize.set(2048, 2048);
  group.add(sun);

  const all = (Object.keys(WING_OFFSET) as ZoneKey[]).map(wingBox);
  const minX = Math.min(-1.5, ...all.map((b) => b.minX)) - 1;
  const maxX = Math.max(1.5, ...all.map((b) => b.maxX)) + 1;
  const minZ = Math.min(-1.5, ...all.map((b) => b.minZ)) - 1;
  const maxZ = Math.max(1.5, ...all.map((b) => b.maxZ)) + 1;
  const island = mesh(new THREE.BoxGeometry(maxX - minX, 0.4, maxZ - minZ), std(0x1e1b3a, { roughness: 0.9 }), (minX + maxX) / 2, -0.2, (minZ + maxZ) / 2);
  island.userData.noOutline = true;
  group.add(island);

  const stone = std(0x94a3b8);
  const plaza = mesh(new THREE.BoxGeometry(3, 0.2, 3), stone, 0, 0.1, 0);
  const basin = mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.35, 20), std(0xe2e8f0), 0, 0.35, 0);
  const water = mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 20), std(0x38bdf8, { emissive: 0x38bdf8, emissiveIntensity: 0.5 }), 0, 0.53, 0);
  water.userData.noOutline = true;
  group.add(plaza, basin, water);

  // 안뜰에서 각 날개 입구 홀로 가는 길
  const pathMat = std(0x475569);
  for (const z of Object.keys(WING_OFFSET) as ZoneKey[]) {
    const [hx, hz] = WING_OFFSET[z];
    const len = Math.hypot(hx, hz);
    const path = mesh(new THREE.BoxGeometry(0.7, 0.12, len), pathMat, hx / 2, 0.06, hz / 2);
    path.rotation.y = Math.atan2(hx, hz);
    path.userData.noOutline = true;
    group.add(path);
  }

  for (const z of Object.keys(WING_OFFSET) as ZoneKey[]) buildWing(group, z, rooms, accessible.includes(z));
  return background;
}
