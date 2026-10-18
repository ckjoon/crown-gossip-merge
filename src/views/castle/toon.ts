// toon.ts — "코지 판타지 툰" 렌더링: Standard 재질을 3단 명암 Toon 재질로 바꾸고, 가구에 검은 외곽선(뒤집힌 껍데기)을 붙인다

import * as THREE from "three";

let gradient: THREE.DataTexture | null = null;

// 3단 명암 그라디언트 (어두움·중간·밝음)
function toonGradient(): THREE.DataTexture {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    gradient.needsUpdate = true;
  }
  return gradient;
}

const converted = new WeakMap<THREE.Material, THREE.MeshToonMaterial>();

function toToon(m: THREE.MeshStandardMaterial): THREE.MeshToonMaterial {
  let t = converted.get(m);
  if (!t) {
    t = new THREE.MeshToonMaterial({
      color: m.color.clone(),
      emissive: m.emissive.clone(),
      emissiveIntensity: m.emissiveIntensity,
      transparent: m.transparent,
      opacity: m.opacity,
      side: m.side,
      // glTF 모델은 색이 텍스처에 들어 있다
      map: m.map,
      alphaTest: m.alphaTest,
      vertexColors: m.vertexColors,
      gradientMap: toonGradient(),
    });
    t.userData = { ...m.userData };
    converted.set(m, t);
  }
  return t;
}

export function toonify(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.outline) return;
    const mat = mesh.material;
    if (Array.isArray(mat)) mesh.material = mat.map((m) => ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial ? toToon(m as THREE.MeshStandardMaterial) : m));
    else if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) mesh.material = toToon(mat as THREE.MeshStandardMaterial);
  });
}

const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x1b1028, side: THREE.BackSide });

// 크기 비례로 키우면 고리 모양은 외곽선이 원래 몸통에서 떨어져 보이므로 제외
function skipOutline(mesh: THREE.Mesh): boolean {
  const mat = mesh.material as THREE.Material | THREE.Material[];
  if (Array.isArray(mat) ? mat.some((m) => m.transparent) : mat.transparent) return true;
  return (mesh.geometry as THREE.BufferGeometry).type === "TorusGeometry";
}

// 메쉬마다 살짝 키운 뒷면 복제를 붙여 외곽선처럼 보이게 한다 (기하는 공유, 이미 붙어 있으면 건너뜀, 유리·고리는 제외)
export function addOutline(root: THREE.Object3D, thickness = 0.03): void {
  const targets: THREE.Mesh[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && !mesh.userData.outline && !skipOutline(mesh) && !mesh.children.some((c) => c.userData.outline)) targets.push(mesh);
  });
  for (const mesh of targets) {
    const outline = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
    outline.userData.outline = true;
    outline.scale.setScalar(1 + thickness * 2);
    outline.castShadow = false;
    outline.receiveShadow = false;
    mesh.add(outline);
  }
}

// 그룹이 쓰던 기하를 해제한다 (외곽선은 기하를 공유하므로 한 번만)
export function disposeGroup(root: THREE.Object3D): void {
  const seen = new Set<THREE.BufferGeometry>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry && !seen.has(mesh.geometry)) {
      seen.add(mesh.geometry);
      mesh.geometry.dispose();
    }
  });
}
