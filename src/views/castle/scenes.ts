// scenes.ts — 구역 방 조명 (성 전체지도는 floorplan.ts, 방 바닥·벽은 roomBuilder.ts)
// 데이터 판단(완료·잠금)은 하지 않고, 넘겨받은 값대로 메쉬만 만든다

import * as THREE from "three";
import type { ZoneLook } from "./layout";

// 구역 방 조명 (바닥·벽은 roomBuilder가 방 조각마다 그린다). 그림자 범위는 CastleView가 지어진 범위에 맞춘다
export function buildRoomLights(group: THREE.Group, theme: ZoneLook): { background: THREE.Color; ambient: THREE.AmbientLight; dirLight: THREE.DirectionalLight } {
  const background = new THREE.Color(theme.wallColor).multiplyScalar(0.45);

  const ambient = new THREE.AmbientLight(theme.ambientColor, 0.75);
  ambient.name = "ambient";
  group.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
  dirLight.position.set(8, 16, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  group.add(dirLight, dirLight.target);
  return { background, ambient, dirLight };
}
