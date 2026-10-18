// furniture.ts — 장소별 3D 가구 모델과 복구 전 잔해 (v2 interior3d.js build3DFurnitureModel·renderSpotMesh 이전)

import * as THREE from "three";
import type { StylePalette } from "../../core/rules/rooms";
import { ModelLibrary } from "./models/library";
import { SPOT_RECIPES, CLUTTER, ZONE_PROPS, recipeModels, type RecipeItem, type TintKey } from "./models/recipes";

// 복구 전: 부서진 나무 판자, 잔해 돌멩이
export function buildRubble(group: THREE.Group): void {
  // 복구 전: 부서진 나무 판자, 잔해 돌멩이, 보라색 연기 코어
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });

  const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.35), plankMat);
  p1.position.set(0, 0.12, 0);
  p1.rotation.y = 0.4;
  p1.rotation.z = 0.12;
  group.add(p1);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), plankMat);
  p2.position.set(0.1, 0.2, 0.1);
  p2.rotation.y = -0.5;
  p2.rotation.z = -0.15;
  group.add(p2);

  for (let i = 0; i < 4; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), rubbleMat);
    rock.position.set(Math.cos(i * 1.5) * 0.45, 0.18, Math.sin(i * 1.5) * 0.45);
    rock.castShadow = true;
    group.add(rock);
  }
}

// 복구 완료(또는 디자인 미리보기): 가구 종류별 3D 모델 + 스타일 팔레트
export function buildFurniture(group: THREE.Group, type: string, pal: StylePalette): void {
  const matPrimary = new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.35, metalness: 0.2 });
  const matSecondary = new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.3, metalness: 0.15 });
  const matAccent = new THREE.MeshStandardMaterial({
    color: pal.accent,
    emissive: pal.accent,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });
  const matWood = new THREE.MeshStandardMaterial({ color: pal.wood, roughness: 0.65 });

  if (type === "cauldron") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.3, 16), matPrimary);
    base.position.y = 0.15;
    base.castShadow = true;
    group.add(base);

    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), matWood);
    pot.scale.set(1, 0.82, 1);
    pot.position.y = 0.82;
    pot.castShadow = true;
    group.add(pot);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 12, 24), matPrimary);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.32;
    group.add(rim);

    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16), matAccent);
    liquid.position.y = 1.28;
    group.add(liquid);

    for (let i = 0; i < 3; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), matSecondary);
      bubble.position.set((i - 1) * 0.25, 1.48 + (i % 2) * 0.18, 0);
      bubble.userData.floatBubble = true;
      bubble.userData.baseY = bubble.position.y;
      bubble.userData.phase = i * 1.5;
      group.add(bubble);
    }
  } else if (type === "bookcase") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.8), matWood);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.95), matPrimary);
    crown.position.y = 2.9;
    group.add(crown);

    for (let row = 0; row < 3; row++) {
      for (let b = -3; b <= 3; b++) {
        const bkMat = b % 2 === 0 ? matSecondary : b % 3 === 0 ? matAccent : matPrimary;
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.55), bkMat);
        book.position.set(b * 0.26, 0.6 + row * 0.8, 0.2);
        group.add(book);
      }
    }
  } else if (type === "planter") {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.9, 12), matWood);
    stand.position.y = 0.45;
    stand.castShadow = true;
    group.add(stand);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.08, 10, 24), matPrimary);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.9;
    group.add(goldRing);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), matSecondary);
    foliage.position.y = 1.55;
    foliage.castShadow = true;
    group.add(foliage);

    const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), matAccent);
    flower.position.y = 2.35;
    flower.userData.floatBubble = true;
    flower.userData.baseY = 2.35;
    flower.userData.phase = 0.5;
    group.add(flower);
  } else if (type === "window") {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.25), matPrimary);
    frame.castShadow = true;
    group.add(frame);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.3), matAccent);
    group.add(glass);

    const innerOrb = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 12, 24), matSecondary);
    innerOrb.position.z = 0.16;
    group.add(innerOrb);
  } else if (type === "counter") {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1.1), matWood);
    bar.position.y = 0.55;
    bar.castShadow = true;
    group.add(bar);

    const topCounter = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.16, 1.25), matPrimary);
    topCounter.position.y = 1.15;
    group.add(topCounter);

    const machine = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.7, 12), matSecondary);
    machine.position.set(-0.6, 1.55, 0);
    group.add(machine);

    const displayCake = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.35, 16), matAccent);
    displayCake.position.set(0.55, 1.4, 0);
    group.add(displayCake);
  } else if (type === "parasol") {
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.14, 20), matPrimary);
    tableTop.position.y = 0.85;
    tableTop.castShadow = true;
    group.add(tableTop);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 10), matWood);
    pole.position.y = 1.3;
    group.add(pole);

    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.75, 12), matSecondary);
    umbrella.position.y = 2.65;
    umbrella.castShadow = true;
    group.add(umbrella);

    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), matAccent);
    cup.position.set(0.35, 1.05, 0.25);
    group.add(cup);
  } else if (type === "fountain") {
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.45, 20), matPrimary);
    pool.position.y = 0.22;
    pool.castShadow = true;
    group.add(pool);

    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.48, 20), matSecondary);
    water.position.y = 0.24;
    group.add(water);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.3, 12), matPrimary);
    pillar.position.y = 0.85;
    group.add(pillar);

    const topGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), matAccent);
    topGem.position.y = 1.75;
    topGem.userData.floatBubble = true;
    topGem.userData.baseY = 1.75;
    topGem.userData.phase = 0;
    group.add(topGem);
  } else if (type === "oven") {
    const ovenBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 1.4), matPrimary);
    ovenBody.position.y = 1.05;
    ovenBody.castShadow = true;
    group.add(ovenBody);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.1, 12), matWood);
    chimney.position.set(0, 2.5, -0.2);
    group.add(chimney);

    const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), matAccent);
    fireGlow.position.set(0, 0.75, 0.55);
    group.add(fireGlow);
  }
}

// ==================== v3.1: 장소별 고유 가구 ====================

interface Mats {
  primary: THREE.MeshStandardMaterial;
  secondary: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
}

function mats(pal: StylePalette): Mats {
  return {
    primary: new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.4, metalness: 0.15 }),
    secondary: new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.35 }),
    accent: new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.4, roughness: 0.25 }),
    wood: new THREE.MeshStandardMaterial({ color: pal.wood, roughness: 0.7 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.55, roughness: 0.3 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }),
  };
}

function put(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

// 하버: 달빛 가든 에스프레소 바 — 곡선 카운터 + 황동 에스프레소 머신 + 컵 탑
function espressoBar(g: THREE.Group, M: Mats): void {
  put(g, new THREE.CylinderGeometry(1.4, 1.4, 1.0, 24, 1, false, 0, Math.PI), M.wood, 0, 0.5, 0, 0, Math.PI / 2);
  put(g, new THREE.CylinderGeometry(1.5, 1.5, 0.12, 24, 1, false, 0, Math.PI), M.primary, 0, 1.06, 0, 0, Math.PI / 2);
  put(g, new THREE.BoxGeometry(0.7, 0.75, 0.5), M.gold, -0.35, 1.5, -0.4);
  put(g, new THREE.SphereGeometry(0.22, 14, 10), M.gold, -0.35, 2.0, -0.4);
  put(g, new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), M.secondary, -0.15, 1.3, -0.1, Math.PI / 2);
  for (let i = 0; i < 3; i++) put(g, new THREE.CylinderGeometry(0.13 - i * 0.02, 0.1 - i * 0.02, 0.14, 12), M.white, 0.55, 1.2 + i * 0.15, -0.3);
  put(g, new THREE.TorusGeometry(0.16, 0.03, 8, 16), M.accent, 0.55, 1.75, -0.3, Math.PI / 2);
}

// 하버: 마녀의 성 달빛 정문 아치 — 돌 아치 + 초승달 장식 + 덩굴
function moonArch(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(0.45, 2.4, 0.4), M.white, -1.2, -0.3, 0);
  put(g, new THREE.BoxGeometry(0.45, 2.4, 0.4), M.white, 1.2, -0.3, 0);
  put(g, new THREE.TorusGeometry(1.2, 0.22, 10, 24, Math.PI), M.primary, 0, 0.9, 0);
  const moon = put(g, new THREE.TorusGeometry(0.38, 0.1, 10, 20, Math.PI * 1.3), M.accent, 0, 1.25, 0.2, 0, 0, -0.6);
  moon.castShadow = false;
  for (let i = 0; i < 5; i++) put(g, new THREE.SphereGeometry(0.12, 8, 6), M.secondary, -1.2 + i * 0.6, 2.0 - Math.abs(i - 2) * 0.25, 0.25);
}

// 온실: 에메랄드 수련 분수 연못 — 낮은 원형 연못 + 수면 + 연잎 + 작은 물줄기
function lilyPond(g: THREE.Group, M: Mats): void {
  put(g, new THREE.TorusGeometry(1.3, 0.2, 10, 32), M.white, 0, 0.18, 0, Math.PI / 2);
  put(g, new THREE.CylinderGeometry(1.25, 1.25, 0.08, 32), M.accent, 0, 0.12, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    put(g, new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12, 1, false, 0.4, Math.PI * 1.8), M.secondary, Math.cos(a) * 0.8, 0.18, Math.sin(a) * 0.8);
  }
  put(g, new THREE.ConeGeometry(0.15, 0.35, 8), M.primary, 0.8, 0.32, 0);
  put(g, new THREE.CylinderGeometry(0.06, 0.12, 0.7, 10), M.white, 0, 0.5, 0);
  put(g, new THREE.SphereGeometry(0.16, 12, 10), M.accent, 0, 0.92, 0);
}

// 온실: 로얄 티타임 가제보 테이블 — 기둥 4개 + 돔 지붕 + 원탁
function gazebo(g: THREE.Group, M: Mats): void {
  for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) put(g, new THREE.CylinderGeometry(0.07, 0.07, 1.8, 10), M.white, x, 0.9, z);
  put(g, new THREE.SphereGeometry(1.08, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.primary, 0, 1.8, 0);
  put(g, new THREE.ConeGeometry(0.1, 0.35, 8), M.gold, 0, 2.95, 0);
  put(g, new THREE.CylinderGeometry(0.6, 0.6, 0.08, 20), M.wood, 0, 0.75, 0);
  put(g, new THREE.CylinderGeometry(0.08, 0.15, 0.72, 10), M.wood, 0, 0.37, 0);
  put(g, new THREE.SphereGeometry(0.16, 12, 10), M.accent, 0.2, 0.9, 0.1);
}

// 온실: 세계수 묘목 화단 — 육각 화단 + 은빛 묘목 + 빛나는 잎
function saplingBed(g: THREE.Group, M: Mats): void {
  put(g, new THREE.CylinderGeometry(1.1, 1.2, 0.45, 6), M.wood, 0, 0.22, 0);
  put(g, new THREE.CylinderGeometry(1.0, 1.0, 0.05, 6), M.secondary, 0, 0.47, 0);
  put(g, new THREE.CylinderGeometry(0.07, 0.12, 1.3, 8), M.wood, 0, 1.1, 0);
  put(g, new THREE.IcosahedronGeometry(0.55, 0), M.accent, 0, 1.9, 0);
  put(g, new THREE.IcosahedronGeometry(0.32, 0), M.primary, 0.45, 1.6, 0.2);
  put(g, new THREE.IcosahedronGeometry(0.3, 0), M.primary, -0.4, 1.65, -0.2);
}

// 온실: 연금술 허브티 브루잉 바 — 바 + 큰 유리 주전자 + 매달린 허브 다발
function herbTeaBar(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(2.2, 1.0, 0.9), M.wood, 0, 0.5, 0);
  put(g, new THREE.BoxGeometry(2.35, 0.1, 1.0), M.secondary, 0, 1.05, 0);
  put(g, new THREE.SphereGeometry(0.38, 16, 12), M.accent, -0.45, 1.45, 0);
  put(g, new THREE.CylinderGeometry(0.1, 0.16, 0.3, 10), M.gold, -0.45, 1.9, 0);
  put(g, new THREE.CylinderGeometry(0.2, 0.15, 0.3, 12), M.primary, 0.5, 1.25, 0.1);
  put(g, new THREE.BoxGeometry(2.2, 0.06, 0.06), M.wood, 0, 2.4, -0.3);
  for (let i = 0; i < 4; i++) put(g, new THREE.ConeGeometry(0.12, 0.45, 6), M.secondary, -0.8 + i * 0.55, 2.1, -0.3, Math.PI);
}

// 온실: 크리스탈 보타니컬 아치창 — 뾰족 아치 창틀 + 잎 모양 유리 칸
function crystalArch(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(2.4, 1.6, 0.22), M.white, 0, -0.3, 0);
  put(g, new THREE.ConeGeometry(1.2, 1.1, 4, 1, false, Math.PI / 4), M.white, 0, 1.05, 0, 0, 0, 0);
  put(g, new THREE.BoxGeometry(2.1, 1.35, 0.26), M.accent, 0, -0.3, 0);
  for (let i = 0; i < 3; i++) put(g, new THREE.OctahedronGeometry(0.25), M.secondary, -0.7 + i * 0.7, -0.3, 0.18);
  put(g, new THREE.TorusGeometry(0.3, 0.05, 8, 16), M.gold, 0, 0.85, 0.15);
}

// 연회장: 황금 천문대 천구의 — 받침 + 기울어진 혼천의 고리 3개 + 별 구슬
function astrolabe(g: THREE.Group, M: Mats): void {
  put(g, new THREE.CylinderGeometry(0.7, 0.9, 0.4, 16), M.primary, 0, 0.2, 0);
  put(g, new THREE.CylinderGeometry(0.1, 0.14, 1.0, 10), M.gold, 0, 0.9, 0);
  put(g, new THREE.TorusGeometry(0.9, 0.05, 8, 40), M.gold, 0, 1.9, 0, Math.PI / 2);
  put(g, new THREE.TorusGeometry(0.8, 0.05, 8, 40), M.gold, 0, 1.9, 0, 0.5, 0.6);
  put(g, new THREE.TorusGeometry(0.7, 0.04, 8, 40), M.secondary, 0, 1.9, 0, -0.4, 0, 0.8);
  put(g, new THREE.SphereGeometry(0.28, 16, 12), M.accent, 0, 1.9, 0);
}

// 연회장: 황실 비전 기록보관소 — 높은 아치 서가 2단 + 사다리 + 두루마리 통
function archive(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(1.0, 2.8, 0.6), M.wood, -0.55, 1.4, 0);
  put(g, new THREE.BoxGeometry(1.0, 2.8, 0.6), M.wood, 0.55, 1.4, 0);
  for (let r = 0; r < 4; r++) {
    put(g, new THREE.BoxGeometry(0.85, 0.42, 0.45), r % 2 ? M.primary : M.secondary, -0.55, 0.45 + r * 0.65, 0.1);
    put(g, new THREE.BoxGeometry(0.85, 0.42, 0.45), r % 2 ? M.secondary : M.primary, 0.55, 0.45 + r * 0.65, 0.1);
  }
  put(g, new THREE.TorusGeometry(1.05, 0.1, 8, 20, Math.PI), M.gold, 0, 2.8, 0);
  put(g, new THREE.BoxGeometry(0.08, 2.6, 0.08), M.gold, 1.25, 1.3, 0.45, 0.25);
  put(g, new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10), M.accent, -1.3, 0.25, 0.4);
}

// 연회장: 대리석 황실 만찬 테이블 — 긴 대리석 상판 + 촛대 + 접시 + 의자
function feastTable(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(2.6, 0.12, 1.0), M.white, 0, 0.85, 0);
  put(g, new THREE.BoxGeometry(2.4, 0.06, 0.4), M.primary, 0, 0.93, 0);
  for (const x of [-1.1, 1.1]) for (const z of [-0.4, 0.4]) put(g, new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), M.gold, x, 0.4, z);
  for (const x of [-0.7, 0, 0.7]) put(g, new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), M.white, x, 0.97, 0.25);
  put(g, new THREE.CylinderGeometry(0.05, 0.08, 0.5, 8), M.gold, 0, 1.2, -0.15);
  put(g, new THREE.SphereGeometry(0.08, 8, 6), M.accent, 0, 1.5, -0.15);
  for (const x of [-0.8, 0.8]) put(g, new THREE.BoxGeometry(0.45, 0.9, 0.1), M.secondary, x, 0.95, -0.85);
}

// 연회장: 드래곤 브레스 황금 화로 — 돌 화로 + 용머리 + 불꽃
function dragonHearth(g: THREE.Group, M: Mats): void {
  put(g, new THREE.BoxGeometry(2.0, 1.6, 0.9), M.primary, 0, 0.8, 0);
  put(g, new THREE.BoxGeometry(1.1, 0.8, 0.95), M.wood, 0, 0.45, 0.05);
  put(g, new THREE.ConeGeometry(0.4, 0.8, 5), M.accent, 0, 0.5, 0.25);
  put(g, new THREE.BoxGeometry(0.7, 0.45, 0.6), M.gold, 0, 1.85, 0.2);
  put(g, new THREE.ConeGeometry(0.12, 0.45, 6), M.gold, -0.25, 2.2, 0.1, 0, 0, 0.4);
  put(g, new THREE.ConeGeometry(0.12, 0.45, 6), M.gold, 0.25, 2.2, 0.1, 0, 0, -0.4);
  put(g, new THREE.SphereGeometry(0.07, 8, 6), M.accent, -0.15, 1.95, 0.52);
  put(g, new THREE.SphereGeometry(0.07, 8, 6), M.accent, 0.15, 1.95, 0.52);
}

// 연회장: 차원 성운 스테인드글라스 — 원형 창 + 소용돌이 성운 고리
function nebulaPortal(g: THREE.Group, M: Mats): void {
  put(g, new THREE.TorusGeometry(1.15, 0.16, 12, 40), M.gold, 0, 0, 0);
  put(g, new THREE.CircleGeometry(1.05, 40), M.primary, 0, 0, 0.02);
  put(g, new THREE.TorusGeometry(0.75, 0.06, 8, 40, Math.PI * 1.5), M.accent, 0, 0, 0.08, 0, 0, 0.3);
  put(g, new THREE.TorusGeometry(0.45, 0.05, 8, 40, Math.PI * 1.4), M.secondary, 0, 0, 0.1, 0, 0, 2.1);
  put(g, new THREE.SphereGeometry(0.16, 12, 10), M.accent, 0, 0, 0.14);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    put(g, new THREE.OctahedronGeometry(0.07), M.white, Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.12);
  }
}

const TYPE_OF: Record<string, string> = {
  alc_cauldron: "cauldron",
  alc_bookcase: "bookcase",
  alc_herbtable: "planter",
  alc_window: "window",
  alc_counter: "counter",
  hb_parasol: "parasol",
  hb_fountain: "fountain",
  hb_bakery: "oven",
};

const UNIQUE: Record<string, (g: THREE.Group, M: Mats) => void> = {
  hb_espresso: espressoBar,
  hb_arch: moonArch,
  gd_pond: lilyPond,
  gd_gazebo: gazebo,
  gd_planter: saplingBed,
  gd_teabar: herbTeaBar,
  gd_dome: crystalArch,
  bq_astrolabe: astrolabe,
  bq_library: archive,
  bq_feast: feastTable,
  bq_hearth: dragonHearth,
  bq_portal: nebulaPortal,
};

// 장소 id → 가구 빌더 (첫 구역의 8곳은 원래 종류별 모델, 나머지 12곳은 장소 전용 모델)
export const SPOT_BUILDERS: Record<string, (g: THREE.Group, pal: StylePalette) => void> = {
  ...Object.fromEntries(Object.entries(TYPE_OF).map(([id, type]) => [id, (g: THREE.Group, pal: StylePalette) => buildFurniture(g, type, pal)])),
  ...Object.fromEntries(Object.entries(UNIQUE).map(([id, fn]) => [id, (g: THREE.Group, pal: StylePalette) => fn(g, mats(pal))])),
};

// ==================== v3.3: CC0 모델 배치 ====================

// 모델 팩에 없는 작은 구조물
function brew(g: THREE.Group, pal: StylePalette): void {
  // 가마솥 속 빛나는 물약 수면
  const M = mats(pal);
  const liquid = put(g, new THREE.CylinderGeometry(0.62, 0.62, 0.06, 24), M.accent);
  liquid.castShadow = false;
  for (let i = 0; i < 3; i++) {
    const b = put(g, new THREE.SphereGeometry(0.09 - i * 0.02, 10, 8), M.accent, -0.2 + i * 0.22, 0.12 + i * 0.05, 0.1 - i * 0.1);
    b.userData.floatBubble = true;
    b.userData.baseY = b.position.y;
    b.userData.phase = i;
  }
}

function cobweb(g: THREE.Group): void {
  // 먼지 낀 거미줄 덩어리 + 바닥 먼지
  const web = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.35, roughness: 1 });
  const dust = new THREE.MeshStandardMaterial({ color: 0x6b6375, transparent: true, opacity: 0.55, roughness: 1 });
  const d = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), dust);
  d.rotation.x = -Math.PI / 2;
  d.position.y = 0.02;
  g.add(d);
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.35 + i * 0.18, 0.012, 4, 18), web);
    w.position.set(0.2, 0.9 + i * 0.05, -0.2);
    w.rotation.set(0.6, 0.4, 0);
    g.add(w);
  }
}

// 줄무늬 파라솔 (기둥 + 8조각 캐노피를 두 색으로 번갈아)
function umbrella(g: THREE.Group, pal: StylePalette): void {
  const M = mats(pal);
  put(g, new THREE.CylinderGeometry(0.05, 0.06, 2.9, 8), M.wood, 0, 1.45, 0);
  for (let i = 0; i < 8; i++) {
    const seg = put(g, new THREE.ConeGeometry(1.35, 0.55, 2, 1, true, (i * Math.PI) / 4, Math.PI / 4), i % 2 ? M.white : M.secondary, 0, 3.0, 0);
    seg.material = (i % 2 ? M.white : M.secondary).clone();
    (seg.material as THREE.Material).side = THREE.DoubleSide;
  }
  put(g, new THREE.SphereGeometry(0.09, 8, 6), M.gold, 0, 3.3, 0);
}

// 카페 원탁 (나무 상판 + 받침)
function cafeTable(g: THREE.Group, pal: StylePalette): void {
  const M = mats(pal);
  put(g, new THREE.CylinderGeometry(0.75, 0.75, 0.08, 20), M.wood, 0, 0.88, 0);
  put(g, new THREE.CylinderGeometry(0.07, 0.09, 0.85, 10), M.gold, 0, 0.43, 0);
  put(g, new THREE.CylinderGeometry(0.38, 0.42, 0.06, 16), M.gold, 0, 0.03, 0);
}

// 벽돌 화덕 (둥근 돔 + 불빛 아치 + 굴뚝)
function brickOven(g: THREE.Group, pal: StylePalette): void {
  const M = mats(pal);
  const brick = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
  put(g, new THREE.BoxGeometry(2.0, 0.9, 1.6), stone, 0, 0.45, 0);
  put(g, new THREE.SphereGeometry(0.95, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brick, 0, 0.9, 0);
  const mouth = put(g, new THREE.CircleGeometry(0.42, 16, 0, Math.PI), M.accent, 0, 0.92, 0.9);
  mouth.castShadow = false;
  put(g, new THREE.TorusGeometry(0.46, 0.07, 6, 16, Math.PI), stone, 0, 0.92, 0.88);
  put(g, new THREE.CylinderGeometry(0.18, 0.22, 0.9, 10), brick, 0.4, 2.0, -0.3);
}

// 돌 벽난로 (아치 입구 안 불꽃 + 금빛 선반)
function fireplace(g: THREE.Group, pal: StylePalette): void {
  const M = mats(pal);
  const stone = new THREE.MeshStandardMaterial({ color: 0x8b8494, roughness: 0.95 });
  const soot = new THREE.MeshStandardMaterial({ color: 0x1f1b24, roughness: 1 });
  put(g, new THREE.BoxGeometry(2.2, 2.0, 0.8), stone, 0, 1.0, 0);
  put(g, new THREE.BoxGeometry(1.2, 1.0, 0.82), soot, 0, 0.5, 0.02);
  put(g, new THREE.BoxGeometry(2.5, 0.16, 1.0), M.gold, 0, 2.08, 0.05);
  for (let i = 0; i < 3; i++) {
    const f = put(g, new THREE.ConeGeometry(0.16 - i * 0.03, 0.55 - i * 0.1, 8), M.accent, -0.25 + i * 0.25, 0.3, 0.3);
    f.castShadow = false;
  }
  put(g, new THREE.BoxGeometry(1.0, 0.1, 0.25), M.wood, 0, 0.08, 0.3);
  put(g, new THREE.BoxGeometry(0.5, 1.2, 0.5), stone, 0, 2.7, -0.1);
}

// 둥근 러그 (테두리 + 안쪽 무늬)
function rug(g: THREE.Group, pal: StylePalette): void {
  const M = mats(pal);
  const outer = put(g, new THREE.CircleGeometry(1.5, 32), M.secondary, 0, 0.015, 0, -Math.PI / 2);
  const inner = put(g, new THREE.CircleGeometry(1.15, 32), M.primary, 0, 0.02, 0, -Math.PI / 2);
  const ring = put(g, new THREE.RingGeometry(0.55, 0.65, 32), M.accent, 0, 0.025, 0, -Math.PI / 2);
  for (const m of [outer, inner, ring]) m.castShadow = false;
}

export const PROC_BUILDERS: Record<string, (g: THREE.Group, pal: StylePalette) => void> = {
  ...SPOT_BUILDERS,
  rug,
  fireplace,
  umbrella,
  cafeTable,
  brickOven,
  brew,
  cobweb: (g) => cobweb(g),
};

// 텍스처 모델에 스타일 색을 은은하게 입힌다 (원본 재질은 공유하므로 색별로 복제해 둔다)
const tinted = new Map<string, THREE.Material>();
function tint(obj: THREE.Object3D, hex: number): void {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as THREE.MeshStandardMaterial;
    const key = `${src.uuid}:${hex}`;
    let m = tinted.get(key);
    if (!m) {
      const c = src.clone();
      c.color = new THREE.Color(0xffffff).lerp(new THREE.Color(hex), 0.55);
      tinted.set(key, c);
      m = c;
    }
    mesh.material = m;
  });
}

// 작은 소품(촛불·물약·책·음식)은 그림자와 외곽선을 생략해 그리기 호출을 줄인다
export function markSmallProp(obj: THREE.Object3D, size: number): void {
  if (size >= 0.8) return;
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      (o as THREE.Mesh).castShadow = false;
      o.userData.noOutline = true;
    }
  });
}

// 배치표의 크기를 방 비율에 맞춰 한꺼번에 키운다
const MODEL_SCALE = 1.2;

function placeItems(group: THREE.Group, items: RecipeItem[], pal: StylePalette): void {
  const placed: THREE.Object3D[] = [];
  for (const it of items) {
    const [x, y, z] = it.p ?? [0, 0, 0];
    if (it.proc) {
      const sub = new THREE.Group();
      PROC_BUILDERS[it.proc]?.(sub, pal);
      sub.position.set(x, y, z);
      if (it.r) sub.rotation.y = it.r;
      group.add(sub);
      placed.push(sub);
      continue;
    }
    if (!it.m) continue;
    const obj = ModelLibrary.clone(it.m, (it.s ?? 1) * MODEL_SCALE);
    if (!obj) continue;
    if (it.tint) tint(obj, pal[it.tint as TintKey]);
    markSmallProp(obj, it.s ?? 1);
    let baseY = y;
    if (it.on !== undefined && placed[it.on]) {
      group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(placed[it.on]);
      const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
      box.applyMatrix4(inv);
      baseY = box.max.y + y;
    }
    obj.position.set(x, baseY, z);
    if (it.tip) {
      obj.rotation.z = Math.PI / 2;
      obj.position.y += (it.s ?? 1) * 0.3;
    }
    if (it.r) obj.rotation.y = it.r;
    group.add(obj);
    placed.push(obj);
  }
}

export function spotModelNames(spotId: string): ReturnType<typeof recipeModels> {
  const r = SPOT_RECIPES[spotId];
  return r ? recipeModels(r) : [];
}

// 구역 분위기 소품: 복구 수(doneCount) 이하 단계만 놓는다
export function buildZoneProps(zone: string, doneCount: number, pal: StylePalette): THREE.Group {
  const g = new THREE.Group();
  const list = (ZONE_PROPS[zone] ?? []).filter((p) => p.step <= doneCount);
  placeItems(g, list, pal);
  return g;
}

export function zonePropModels(zone: string): ReturnType<typeof recipeModels> {
  return recipeModels({ items: ZONE_PROPS[zone] ?? [] });
}

export const CLUTTER_MODELS = [...new Set(CLUTTER.flatMap((c) => recipeModels({ items: c })))];

// 복구 전 잔해: 모델이 준비됐으면 먼지 쌓인 상자·항아리, 아니면 예전 판자 더미. floorY는 벽에 붙은 장소용 바닥 높이 보정
export function buildSpotClutter(spotIdx: number, group: THREE.Group, floorY = 0): void {
  // 벽에 붙은 장소(창문)는 잔해를 바닥 쪽 벽 앞으로 끌어낸다
  const fwd = floorY < -0.5 ? 1.0 : 0;
  const set = CLUTTER[spotIdx % CLUTTER.length];
  if (!ModelLibrary.hasAll(recipeModels({ items: set }))) {
    const g = new THREE.Group();
    buildRubble(g);
    g.position.set(0, floorY, fwd);
    group.add(g);
    return;
  }
  const g = new THREE.Group();
  g.position.set(0, floorY, fwd);
  placeItems(g, set, { id: 0, name: "", primary: 0x6b7280, secondary: 0x6b7280, accent: 0x9ca3af, wood: 0x57534e });
  group.add(g);
}

export function buildSpotFurniture(spotId: string, group: THREE.Group, pal: StylePalette, fallbackType = "counter"): void {
  const recipe = SPOT_RECIPES[spotId];
  if (recipe && ModelLibrary.hasAll(recipeModels(recipe))) {
    placeItems(group, [...recipe.items, ...recipe.styles[pal.id] ?? recipe.styles[0]], pal);
    return;
  }
  const b = SPOT_BUILDERS[spotId];
  if (b) b(group, pal);
  else buildFurniture(group, fallbackType, pal);
}
