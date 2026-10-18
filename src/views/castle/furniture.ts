// furniture.ts — 장소별 3D 가구 모델과 복구 전 잔해 (v2 interior3d.js build3DFurnitureModel·renderSpotMesh 이전)

import * as THREE from "three";
import type { StylePalette } from "../../core/rules/rooms";

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
