// roomBuilder.ts — 방 조각(modules.ts 계산)을 3D로 그린다: 지어진 조각은 체크무늬 바닥 + 구역별 벽(돌벽·난간·생울타리) + 문,
// 다음 복구 조각은 깨진 바닥과 무너진 벽, 그 뒤 조각들은 반투명 청사진. 메시마다 userData.module·role을 달아 연출이 골라 움직인다
// 바깥 벽에는 발광 장식(재질 userData.glowBase)을 붙여 방 분위기 단계(setDecorGlow)에 따라 밝아지게 한다

import * as THREE from "three";
import { gsap } from "gsap";
import type { ZoneKey } from "../../core/types";
import { ZONE_LOOK } from "./layout";
import { CELL, WALL_H, ZONE_MODULES, moduleCells, moduleEdges, type EdgeSpec, type ModuleState } from "./modules";

type WallStyle = "stone" | "rail" | "hedge";

interface ZoneStyle {
  wall: WallStyle;
  wallH: number;
  wallColor: number;
  trim: number;
  glow: number[];
}

const STYLES: Record<ZoneKey, ZoneStyle> = {
  alchemy: { wall: "stone", wallH: WALL_H, wallColor: ZONE_LOOK.alchemy.wallColor, trim: 0xd4af37, glow: [0xa855f7, 0x22c55e, 0xf43f5e, 0x38bdf8] },
  harbor: { wall: "rail", wallH: 1.1, wallColor: 0xf8fafc, trim: 0x0ea5e9, glow: [0xfde047, 0xf472b6, 0x38bdf8] },
  garden: { wall: "hedge", wallH: 1.8, wallColor: 0x15803d, trim: 0x166534, glow: [0xf9a8d4, 0xfde047, 0xc4b5fd] },
  banquet: { wall: "stone", wallH: WALL_H, wallColor: ZONE_LOOK.banquet.wallColor, trim: 0xfbbf24, glow: [0xfde047, 0xfbbf24] },
};

const T = 0.3; // 벽 두께

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
}

function glowMat(color: number, base = 0.9): THREE.MeshStandardMaterial {
  const m = std(color, { emissive: color, emissiveIntensity: base });
  m.userData.glowBase = base;
  return m;
}

// 구역마다 같은 재질을 나눠 쓴다 (툰 변환도 한 번만)
interface Mats {
  floor: THREE.MeshStandardMaterial;
  ruinFloor: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  ruinWall: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial[];
  ghost: THREE.MeshBasicMaterial;
  ghostLine: THREE.LineDashedMaterial;
}

const matCache = new Map<ZoneKey, Mats>();

function checkerTexture(c1: number, c2: number): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 80;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      ctx.fillStyle = hex((i + j) % 2 === 0 ? c1 : c2);
      ctx.fillRect(i * 16, j * 16, 16, 16);
    }
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, 0);
    ctx.lineTo(i * 16, 80);
    ctx.moveTo(0, i * 16);
    ctx.lineTo(80, i * 16);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function mats(zone: ZoneKey): Mats {
  let m = matCache.get(zone);
  if (m) return m;
  const look = ZONE_LOOK[zone];
  const st = STYLES[zone];
  const tex = checkerTexture(look.floorColor1, look.floorColor2);
  const floor = tex ? std(0xffffff, { map: tex, roughness: 0.6 }) : std(look.floorColor1, { roughness: 0.6 });
  const ruinFloor = std(new THREE.Color(look.floorColor2).multiplyScalar(0.55).getHex(), { roughness: 0.9 });
  const ghost = new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.14, depthWrite: false });
  const ghostLine = new THREE.LineDashedMaterial({ color: 0xe9d5ff, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.75 });
  m = {
    floor,
    ruinFloor,
    wall: std(st.wallColor),
    ruinWall: std(new THREE.Color(st.wallColor).multiplyScalar(0.6).getHex(), { roughness: 0.95 }),
    trim: std(st.trim, { metalness: 0.4, roughness: 0.35 }),
    wood: std(0x5c2d16),
    glow: st.glow.map((c) => glowMat(c, 0.8)),
    ghost,
    ghostLine,
  };
  for (const mat of Object.values(m).flat()) (mat as THREE.Material).userData.shared = true;
  matCache.set(zone, m);
  return m;
}

function tag<T extends THREE.Object3D>(o: T, module: number, role: string, extra: Record<string, unknown> = {}): T {
  o.userData.module = module;
  o.userData.role = role;
  Object.assign(o.userData, extra);
  o.traverse((c) => {
    c.castShadow = role !== "floor" && role !== "ghost";
    c.receiveShadow = true;
  });
  return o;
}

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

// 변 방향에 맞춰 길이 len·높이 h·두께 t의 상자를 변 위에 세운다
function edgeBox(e: EdgeSpec, len: number, h: number, t: number, mat: THREE.Material, y = h / 2, offset = 0): THREE.Mesh {
  const b = e.along === "x" ? box(len, h, t, mat) : box(t, h, len, mat);
  const [ix, iz] = inward(e);
  b.position.set(e.x + ix * offset, y, e.z + iz * offset);
  return b;
}

// 변에서 방 안쪽을 향하는 방향
function inward(e: EdgeSpec): [number, number] {
  switch (e.side) {
    case "-x":
      return [1, 0];
    case "+x":
      return [-1, 0];
    case "-z":
      return [0, 1];
    default:
      return [0, -1];
  }
}

// 변을 따라 t(-0.5~0.5) 위치의 점
function alongEdge(e: EdgeSpec, t: number): [number, number] {
  return e.along === "x" ? [e.x + t * CELL, e.z] : [e.x, e.z + t * CELL];
}

function buildFloor(g: THREE.Group, zone: ZoneKey, i: number, state: ModuleState): void {
  const M = mats(zone);
  for (const [cx, cz] of moduleCells(ZONE_MODULES[zone][i])) {
    const x = cx * CELL;
    const z = cz * CELL;
    if (state === "ghost") {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 0.94, CELL * 0.94), M.ghost);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(x, 0.02, z);
      g.add(tag(plane, i, "ghost", { noOutline: true }));
      const h = (CELL * 0.94) / 2;
      const pts = [new THREE.Vector3(-h, 0, -h), new THREE.Vector3(h, 0, -h), new THREE.Vector3(h, 0, h), new THREE.Vector3(-h, 0, h), new THREE.Vector3(-h, 0, -h)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), M.ghostLine);
      line.computeLineDistances();
      line.position.set(x, 0.04, z);
      g.add(tag(line, i, "ghost", { noOutline: true }));
      continue;
    }
    if (state === "built") {
      const slab = box(CELL, 0.25, CELL, M.floor);
      slab.position.set(x, -0.125, z);
      g.add(tag(slab, i, "floor", { noOutline: true }));
      continue;
    }
    // 폐허: 낮게 가라앉은 바닥 + 들뜬 판 조각
    const slab = box(CELL, 0.2, CELL, M.ruinFloor);
    slab.position.set(x, -0.2, z);
    g.add(tag(slab, i, "floor", { noOutline: true }));
    const chunks: [number, number, number, number][] = [
      [-1.3, -1.1, 0.25, 0.3],
      [1.4, 0.6, -0.2, 0.5],
      [-0.4, 1.5, 0.15, -0.4],
    ];
    for (const [dx, dz, rx, ry] of chunks) {
      const c = box(1.1, 0.18, 0.9, M.floor);
      c.position.set(x + dx, 0.0, z + dz);
      c.rotation.set(rx, ry, 0);
      g.add(tag(c, i, "floor"));
    }
  }
}

function buildWall(g: THREE.Group, zone: ZoneKey, e: EdgeSpec, low: boolean): void {
  const st = STYLES[zone];
  const M = mats(zone);
  const role = low ? "low" : "wall";
  if (st.wall === "stone") {
    const h = low ? 1.3 : st.wallH;
    g.add(tag(edgeBox(e, CELL + T, h, T, M.wall), e.mod, role));
    g.add(tag(edgeBox(e, CELL + T + 0.06, 0.2, T + 0.08, M.trim, h - 0.1), e.mod, role));
  } else if (st.wall === "rail") {
    const h = st.wallH;
    g.add(tag(edgeBox(e, CELL, 0.14, 0.16, M.wall, h), e.mod, role));
    g.add(tag(edgeBox(e, CELL, 0.1, 0.12, M.wall, 0.35), e.mod, role));
    for (const t of [-0.5, -0.17, 0.17, 0.5]) {
      const [px, pz] = alongEdge(e, t);
      const post = box(0.18, h, 0.18, M.trim);
      post.position.set(px, h / 2, pz);
      g.add(tag(post, e.mod, role));
    }
  } else {
    const h = low ? 0.9 : st.wallH;
    g.add(tag(edgeBox(e, CELL + 0.2, h, 0.7, M.wall), e.mod, role));
    g.add(tag(edgeBox(e, CELL + 0.25, 0.2, 0.75, M.trim, h + 0.05), e.mod, role));
  }
  if (!low) buildOrnament(g, zone, e);
}

// 바깥 벽 장식: 공방 약병 선반, 연회장 깃발과 별, 하버 등불 기둥, 정원 꽃
function buildOrnament(g: THREE.Group, zone: ZoneKey, e: EdgeSpec): void {
  const M = mats(zone);
  const [ix, iz] = inward(e);
  const [cx, cz] = alongEdge(e, 0.15);
  const at = (o: THREE.Object3D, y: number, off: number) => {
    o.position.set(cx + ix * off, y, cz + iz * off);
    if (e.along === "z") o.rotation.y = Math.PI / 2;
    g.add(tag(o, e.mod, "ornament"));
  };
  if (zone === "alchemy") {
    at(box(1.8, 0.1, 0.4, M.wood), 2.4, T / 2 + 0.2);
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.36, 10), M.glow[k % M.glow.length]);
      const [bx, bz] = alongEdge(e, 0.15 + (k - 1.5) * 0.08);
      b.position.set(bx + ix * (T / 2 + 0.2), 2.63, bz + iz * (T / 2 + 0.2));
      g.add(tag(b, e.mod, "ornament"));
    }
  } else if (zone === "banquet") {
    at(box(1.1, 2.0, 0.06, std(0x7f1d1d)), 2.6, T / 2 + 0.04);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), M.glow[0]);
    at(star, 2.9, T / 2 + 0.12);
  } else if (zone === "harbor") {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 8), M.trim);
    at(post, 1.1, 0.35);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), M.glow[0]);
    at(bulb, 2.3, 0.35);
  } else {
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M.glow[k % M.glow.length]);
      const [fx, fz] = alongEdge(e, -0.3 + k * 0.3);
      f.position.set(fx, STYLES.garden.wallH + 0.25, fz);
      g.add(tag(f, e.mod, "ornament"));
    }
  }
}

function buildCurb(g: THREE.Group, zone: ZoneKey, e: EdgeSpec): void {
  g.add(tag(edgeBox(e, CELL, 0.3, 0.3, mats(zone).trim, 0.15), e.mod, "curb"));
}

// 문: 부모·자식 조각 사이 변 전체를 트고 양쪽 기둥 + 위 장식으로 표시
function buildDoor(g: THREE.Group, zone: ZoneKey, e: EdgeSpec): void {
  const st = STYLES[zone];
  const M = mats(zone);
  const link = { link: [e.mod, e.other] };
  if (st.wall === "stone") {
    for (const t of [-0.47, 0.47]) {
      const [px, pz] = alongEdge(e, t);
      const p = box(0.5, 3.4, 0.5, M.wall);
      p.position.set(px, 1.7, pz);
      g.add(tag(p, e.mod, "door", link));
    }
    g.add(tag(edgeBox(e, CELL + 0.1, 0.4, 0.55, M.trim, 3.6), e.mod, "door", link));
  } else if (st.wall === "rail") {
    for (const t of [-0.47, 0.47]) {
      const [px, pz] = alongEdge(e, t);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), M.trim);
      post.position.set(px, 1.2, pz);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.glow[1]);
      bulb.position.set(px, 2.5, pz);
      g.add(tag(post, e.mod, "door", link), tag(bulb, e.mod, "door", link));
    }
  } else {
    for (const t of [-0.44, 0.44]) {
      const [px, pz] = alongEdge(e, t);
      const stub = box(0.6, 1.4, 0.7, M.wall);
      stub.position.set(px, 0.7, pz);
      g.add(tag(stub, e.mod, "door", link));
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(CELL * 0.44, 0.14, 8, 24, Math.PI), M.trim);
    arch.position.set(e.x, 1.4, e.z);
    if (e.along === "z") arch.rotation.y = Math.PI / 2;
    g.add(tag(arch, e.mod, "door", link));
  }
}

function buildBroken(g: THREE.Group, zone: ZoneKey, e: EdgeSpec): void {
  const st = STYLES[zone];
  const M = mats(zone);
  const hs = [0.38, 0.14, 0.27];
  hs.forEach((k, j) => {
    const h = Math.max(0.3, st.wallH * k);
    const [px, pz] = alongEdge(e, -0.33 + j * 0.33);
    const b = e.along === "x" ? box(CELL * 0.3, h, T, M.ruinWall) : box(T, h, CELL * 0.3, M.ruinWall);
    b.position.set(px, h / 2, pz);
    b.rotation.z = (j - 1) * 0.06;
    g.add(tag(b, e.mod, "broken"));
  });
}

export function buildModules(zone: ZoneKey, states: ModuleState[]): THREE.Group {
  const g = new THREE.Group();
  g.name = "modules";
  const defs = ZONE_MODULES[zone];
  defs.forEach((_, i) => buildFloor(g, zone, i, states[i]));
  for (const e of moduleEdges(defs, states)) {
    if (e.kind === "wall") buildWall(g, zone, e, false);
    else if (e.kind === "low") buildWall(g, zone, e, true);
    else if (e.kind === "curb") buildCurb(g, zone, e);
    else if (e.kind === "door") buildDoor(g, zone, e);
    else if (e.kind === "broken") buildBroken(g, zone, e);
  }
  return g;
}

function partsOf(g: THREE.Group, pred: (o: THREE.Object3D) => boolean): THREE.Object3D[] {
  return g.children.filter(pred);
}

// 🧱 조각 짓기: 바닥 판이 차례로 떨어져 깔리고 → 벽·턱·장식이 바닥에서 솟고 → 부모와의 문이 톡 생긴다. 걸리는 시간(초) 반환
export function animateModuleBuild(g: THREE.Group, idx: number): number {
  const mine = partsOf(g, (o) => o.userData.module === idx);
  const floors = mine.filter((o) => o.userData.role === "floor");
  const rising = mine.filter((o) => o.userData.role !== "floor" && o.userData.role !== "door");
  const doors = partsOf(g, (o) => o.userData.role === "door" && !!(o.userData.link as number[] | undefined)?.includes(idx));
  floors.forEach((o, k) => gsap.from(o.position, { y: o.position.y + 3, duration: 0.45, delay: 0.08 * k, ease: "bounce.out" }));
  const t1 = 0.35 + 0.08 * floors.length;
  rising.forEach((o, k) => gsap.from(o.position, { y: o.position.y - 4.5, duration: 0.5, delay: t1 + 0.03 * k, ease: "back.out(1.6)" }));
  const t2 = t1 + 0.35 + 0.03 * rising.length;
  doors.forEach((o) => gsap.from(o.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.45, delay: t2, ease: "back.out(2.2)" }));
  return t2 + 0.45;
}

// 다음 복구 조각(폐허)이 청사진 자리에 나타남
export function animateModuleAppear(g: THREE.Group, idx: number): void {
  partsOf(g, (o) => o.userData.module === idx).forEach((o, k) =>
    gsap.from(o.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, delay: 0.04 * k, ease: "back.out(1.8)" }),
  );
}
