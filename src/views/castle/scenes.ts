// scenes.ts — 성 3D 장면 구성 (v2 interior3d.js의 buildCastleOverviewScene·buildRoomScene 이전)
// 데이터 판단(완료·잠금)은 하지 않고, 넘겨받은 값대로 메쉬만 만든다

import * as THREE from "three";
import type { ZoneLook } from "./layout";

// 🏰 마녀의 성 전체 3D 외관 디오라마 지도 (본관 공방 + 앞마당 분수정원 + 동쪽 유리돔 온실 + 최상층 천문대 첨탑)
export function buildCastleOverview(group: THREE.Group): THREE.Color {
  const background = new THREE.Color(0x0f0722);

  const ambient = new THREE.AmbientLight(0xc084fc, 0.85);
  group.add(ambient);

  const moonLight = new THREE.DirectionalLight(0xfef08a, 1.05);
  moonLight.position.set(10, 18, 12);
  moonLight.castShadow = true;
  group.add(moonLight);

  // 1. 마법 해자(Moat) & 성채 대지 섬
  const moatGeo = new THREE.CylinderGeometry(6.3, 6.5, 0.3, 32);
  const moatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.4 });
  const moat = new THREE.Mesh(moatGeo, moatMat);
  moat.position.set(0, -0.25, 0);
  group.add(moat);

  const islandGeo = new THREE.BoxGeometry(9.4, 0.45, 9.4);
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.set(0, 0, 0);
  island.receiveShadow = true;
  group.add(island);

  // 성곽 외벽 테두리 & 모서리 망루
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const roofPurpleMat = new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.35, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
    roughness: 0.25,
    metalness: 0.6,
  });
  const glowWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.85,
  });

  const corners = [
    [-4.2, -4.2],
    [4.2, -4.2],
    [-4.2, 4.2],
    [4.2, 4.2],
  ];
  corners.forEach(([cx, cz]) => {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.2, 12), stoneMat);
    turret.position.set(cx, 1.1, cz);
    turret.castShadow = true;
    group.add(turret);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 12), roofPurpleMat);
    cone.position.set(cx, 2.75, cz);
    group.add(cone);
  });

  // 2. [제1구역: 성 본관 1층 마녀의 연금술 공방] (-1.8, 0, -1.2)
  const keepGroup = new THREE.Group();
  keepGroup.position.set(-1.8, 0.2, -1.2);

  const keepBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), stoneMat);
  keepBody.position.y = 1.2;
  keepBody.castShadow = true;
  keepGroup.add(keepBody);

  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(2.45, 1.5, 4), roofPurpleMat);
  keepRoof.rotation.y = Math.PI / 4;
  keepRoof.position.y = 3.15;
  keepGroup.add(keepRoof);

  // 공방 가마솥 굴뚝 & 보라색 연기 오브
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 10), stoneMat);
  chimney.position.set(-0.9, 2.8, -0.6);
  keepGroup.add(chimney);

  const smokeOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.6 })
  );
  smokeOrb.position.set(-0.9, 3.7, -0.6);
  smokeOrb.userData.floatBubble = true;
  smokeOrb.userData.baseY = 3.7;
  smokeOrb.userData.phase = 0.2;
  keepGroup.add(smokeOrb);

  // 빛나는 공방 창문
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.1), glowWindowMat);
  win1.position.set(0, 1.3, 1.42);
  keepGroup.add(win1);

  group.add(keepGroup);

  // 3. [제2구역: 성 앞마당 달빛 분수 정원 & 테라스] (-2.0, 0, 2.5)
  const courtGroup = new THREE.Group();
  courtGroup.position.set(-2.0, 0.2, 2.5);

  const patio = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.15, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.6 })
  );
  patio.position.y = 0.08;
  courtGroup.add(patio);

  const fountainPool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.35, 18),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 })
  );
  fountainPool.position.set(0, 0.28, 0);
  courtGroup.add(fountainPool);

  const fountainGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), goldMat);
  fountainGem.position.set(0, 0.95, 0);
  fountainGem.userData.floatBubble = true;
  fountainGem.userData.baseY = 0.95;
  fountainGem.userData.phase = 1.4;
  courtGroup.add(fountainGem);

  group.add(courtGroup);

  // 4. [제3구역: 성 동쪽 별관 유리돔 마법 온실] (2.6, 0, 1.5)
  const gardenGroup = new THREE.Group();
  gardenGroup.position.set(2.6, 0.2, 1.5);

  const lawn = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.75, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
  );
  lawn.position.y = 0.1;
  gardenGroup.add(lawn);

  const glassDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
    })
  );
  glassDome.position.y = 0.2;
  gardenGroup.add(glassDome);

  const worldTree = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.65),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 0.35 })
  );
  worldTree.position.y = 1.05;
  gardenGroup.add(worldTree);

  group.add(gardenGroup);

  // 5. [제4구역: 성 최상층 첨탑 별빛 천문대 & 대연회장] (2.0, 0, -2.0)
  const spireGroup = new THREE.Group();
  spireGroup.position.set(2.0, 0.2, -2.0);

  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 3.6, 16), stoneMat);
  towerBase.position.y = 1.8;
  towerBase.castShadow = true;
  spireGroup.add(towerBase);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.7, 16), roofPurpleMat);
  towerRoof.position.y = 4.45;
  spireGroup.add(towerRoof);

  const astrolabeRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 24), goldMat);
  astrolabeRing.position.y = 5.65;
  astrolabeRing.userData.floatBubble = true;
  astrolabeRing.userData.baseY = 5.65;
  astrolabeRing.userData.phase = 2.5;
  spireGroup.add(astrolabeRing);

  group.add(spireGroup);
  return background;
}

// 구역 방 껍데기: 조명, 10×10 체크무늬 바닥, 두 벽, 황금 몰딩 (가구는 furniture.ts)
export function buildRoomShell(group: THREE.Group, theme: ZoneLook): { background: THREE.Color; ambient: THREE.AmbientLight; dirLight: THREE.DirectionalLight } {
  const background = new THREE.Color(theme.wallColor).multiplyScalar(0.45);

  // 조명 설정
  const ambient = new THREE.AmbientLight(theme.ambientColor, 0.75);
  ambient.name = "ambient";
  group.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
  dirLight.position.set(8, 16, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  group.add(dirLight);

  // 1. 체크무늬 아이소메트릭 바닥 타일 (10x10)
  const tileGeo = new THREE.BoxGeometry(1, 0.25, 1);
  const mat1 = new THREE.MeshStandardMaterial({ color: theme.floorColor1, roughness: 0.6 });
  const mat2 = new THREE.MeshStandardMaterial({ color: theme.floorColor2, roughness: 0.65 });

  for (let x = -4.5; x <= 4.5; x += 1) {
    for (let z = -4.5; z <= 4.5; z += 1) {
      const isEven = (Math.round(x + 4.5) + Math.round(z + 4.5)) % 2 === 0;
      const tile = new THREE.Mesh(tileGeo, isEven ? mat1 : mat2);
      tile.position.set(x, -0.125, z);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  // 2. 좌측 벽 & 우측 뒷벽 (아이소메트릭 디오라마 룸)
  const wallMat = new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: 0.7 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.5, roughness: 0.3 });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.3, 4.6, 0.3), wallMat);
  backWall.position.set(0, 2.15, -5.0);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 10.3), wallMat);
  leftWall.position.set(-5.0, 2.15, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // 황금 몰딩 테두리
  const topTrimBack = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.2, 0.36), trimMat);
  topTrimBack.position.set(0, 4.45, -5.0);
  group.add(topTrimBack);

  const topTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 10.4), trimMat);
  topTrimLeft.position.set(-5.0, 4.45, 0);
  group.add(topTrimLeft);
  return { background, ambient, dirLight };
}
