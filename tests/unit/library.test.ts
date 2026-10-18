import { test, expect } from "vitest";
import * as THREE from "three";
import { shareTextures } from "../../src/views/castle/models/library";

test("같은 이미지를 쓰는 모델들은 텍스처 하나를 공유 (파일마다 따로 올리지 않음)", () => {
  const mk = () => {
    const t = new THREE.Texture();
    t.name = "T_Trim_Metal_BaseColor";
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ map: t })));
    return g;
  };
  const a = mk();
  const b = mk();
  shareTextures(a);
  shareTextures(b);
  const ma = ((a.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).map;
  const mb = ((b.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).map;
  expect(ma).toBe(mb);
});
