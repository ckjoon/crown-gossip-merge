// library.ts — CC0 glTF 모델을 한 번만 불러와 보관하고, 장소를 그릴 때는 동기적으로 복제해 준다
// 불러오는 동안·실패 시에는 has()가 false라서 가구는 절차적 모델로 대체된다

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { modelUrl, type ModelName } from "./manifest";

interface Template {
  root: THREE.Group; // 바닥 가운데가 원점이 되도록 옮긴 모델
  maxDim: number;
}

// 흰색+알파 마스크로 바꾼 나뭇잎 재질은 원래 엔진 셰이더가 주던 잎 색을 여기서 입힌다
const LEAF_COLORS: Record<string, number> = { Leaves_TwistedTree: 0x7cb342 };

const templates = new Map<ModelName, Template>();
const pending = new Map<ModelName, Promise<void>>();
let loader: GLTFLoader | null = null;

function prepare(scene: THREE.Object3D): Template {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // 장소를 다시 그릴 때 기하·재질을 해제하지 않도록 공유 표시
    mesh.userData.shared = true;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats as THREE.MeshStandardMaterial[]) {
      const leaf = LEAF_COLORS[m.name];
      if (leaf !== undefined) m.color.setHex(leaf);
    }
  });
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -box.min.y, -center.z);
  const root = new THREE.Group();
  root.add(scene);
  return { root, maxDim: Math.max(size.x, size.y, size.z) || 1 };
}

function loadOne(name: ModelName): Promise<void> {
  if (templates.has(name)) return Promise.resolve();
  let p = pending.get(name);
  if (!p) {
    loader ??= new GLTFLoader();
    p = loader
      .loadAsync(modelUrl(name))
      .then((gltf) => {
        templates.set(name, prepare(gltf.scene));
      })
      .catch(() => {
        // 실패한 모델은 절차적 대체로 남는다 (다음 요청 때 다시 시도)
        pending.delete(name);
      });
    pending.set(name, p);
  }
  return p;
}

export const ModelLibrary = {
  preload(names: Iterable<ModelName>): Promise<void> {
    return Promise.all([...new Set(names)].map(loadOne)).then(() => undefined);
  },

  has(name: ModelName): boolean {
    return templates.has(name);
  },

  hasAll(names: Iterable<ModelName>): boolean {
    for (const n of names) if (!templates.has(n)) return false;
    return true;
  },

  // 가장 긴 변이 size가 되도록 맞춘 복제본 (기하·재질은 공유)
  clone(name: ModelName, size: number): THREE.Object3D | null {
    const t = templates.get(name);
    if (!t) return null;
    const c = t.root.clone(true);
    c.scale.setScalar(size / t.maxDim);
    return c;
  },

  // 테스트용
  _reset(): void {
    templates.clear();
    pending.clear();
  },
};
