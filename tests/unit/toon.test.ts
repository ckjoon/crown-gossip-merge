import { test, expect } from "vitest";
import * as THREE from "three";
import { toonify, addOutline, disposeGroup } from "../../src/views/castle/toon";

function sample(): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfde047, emissiveIntensity: 0.8 })));
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
  return g;
}

test("toonify: Standard 재질 → Toon(색·발광 유지), Basic은 그대로", () => {
  const g = sample();
  toonify(g);
  const [a, b, c] = g.children as THREE.Mesh[];
  expect((a.material as THREE.Material).type).toBe("MeshToonMaterial");
  expect((a.material as THREE.MeshToonMaterial).color.getHex()).toBe(0xff0000);
  expect((b.material as THREE.MeshToonMaterial).emissive.getHex()).toBe(0xfde047);
  expect((b.material as THREE.MeshToonMaterial).emissiveIntensity).toBe(0.8);
  expect((b.material as THREE.MeshToonMaterial).gradientMap).toBeTruthy();
  expect((c.material as THREE.Material).type).toBe("MeshBasicMaterial");
});

test("addOutline: 메쉬마다 뒷면 검은 외곽선 자식 1개, 두 번 호출해도 중복 없음", () => {
  const g = sample();
  addOutline(g, 0.03);
  addOutline(g, 0.03);
  const meshes = (g.children as THREE.Mesh[]).filter((m) => !m.userData.outline);
  for (const m of meshes) {
    const outlines = m.children.filter((c) => c.userData.outline);
    expect(outlines.length).toBe(1);
    const mat = (outlines[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    expect(mat.side).toBe(THREE.BackSide);
    expect((outlines[0] as THREE.Mesh).geometry).toBe(m.geometry);
  }
});

test("addOutline: 투명 재질(유리)과 얇은 고리(토러스)에는 외곽선을 붙이지 않음", () => {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.05), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.35 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.06, 6, 40), new THREE.MeshStandardMaterial());
  const solid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  g.add(glass, ring, solid);
  addOutline(g, 0.03);
  expect(glass.children.length).toBe(0);
  expect(ring.children.length).toBe(0);
  expect(solid.children.filter((c) => c.userData.outline).length).toBe(1);
});

test("toonify: 텍스처(map)·알파 컷·버텍스 색을 그대로 유지 (glTF 모델용)", () => {
  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  const src = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, vertexColors: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), src);
  toonify(mesh);
  const t = mesh.material as unknown as THREE.MeshToonMaterial;
  expect(t.isMeshToonMaterial).toBe(true);
  expect(t.map).toBe(tex);
  expect(t.alphaTest).toBe(0.5);
  expect(t.vertexColors).toBe(true);
});

test("addOutline: 알파 컷 재질(나뭇잎)에는 외곽선을 붙이지 않음, disposeGroup: 공유 모델 기하는 해제하지 않음", () => {
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ alphaTest: 0.2 }));
  const g = new THREE.Group();
  g.add(leaf);
  addOutline(g, 0.03);
  expect(leaf.children.length).toBe(0);

  const shared = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  shared.userData.shared = true;
  let disposed = false;
  shared.geometry.addEventListener("dispose", () => (disposed = true));
  const h = new THREE.Group();
  h.add(shared);
  disposeGroup(h);
  expect(disposed).toBe(false);
});
