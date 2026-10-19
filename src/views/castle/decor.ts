// decor.ts — 방 분위기 단계에 따라 발광 장식(재질 userData.glowBase) 밝기 조절. 장식 자체는 roomBuilder가 방 조각 벽마다 붙인다

import * as THREE from "three";

// 방 분위기 단계(0~5)에 맞춰 발광 장식 밝기 조절
export function setDecorGlow(root: THREE.Object3D, step: number): void {
  const k = 0.25 + step * 0.15;
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshToonMaterial | undefined;
    const base = (mat as THREE.Material | undefined)?.userData?.glowBase;
    if (mat && typeof base === "number" && "emissiveIntensity" in mat) mat.emissiveIntensity = base * k;
  });
}
