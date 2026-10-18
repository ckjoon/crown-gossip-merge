// resident.ts — 방 안 캐릭터: 치비 초상화 얼굴 + 망토 몸통을 캔버스에 그려 빌보드로 세운다. 평소엔 숨 쉬듯 흔들리고, 복구 때 점프하며 기뻐한다

import * as THREE from "three";
import { gsap } from "gsap";
import { portraitDataUrl } from "../art/portraits";
import type { Expression } from "../../core/rules/expressions";
import type { ZoneKey } from "../../core/types";

// 위치는 그 구역 가구를 가리지 않는 앞쪽 빈 바닥
export const ZONE_RESIDENT: Record<ZoneKey, { id: string; robe: string; pos: [number, number, number] }> = {
  alchemy: { id: "selene", robe: "#5b21b6", pos: [3.4, 0, 0.8] },
  harbor: { id: "quinn", robe: "#155e75", pos: [-3.4, 0, 2.8] },
  garden: { id: "nero", robe: "#1f2937", pos: [-3.4, 0, 2.8] },
  banquet: { id: "lucian", robe: "#7f1d1d", pos: [-3.4, 0, 2.8] },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 128×192 캔버스: 아래는 망토 몸통, 위는 초상화 얼굴
async function drawChibi(id: string, robe: string, expr: Expression): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 192;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = robe;
  ctx.strokeStyle = "#1b1028";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(64, 92);
  ctx.quadraticCurveTo(104, 110, 112, 188);
  ctx.lineTo(16, 188);
  ctx.quadraticCurveTo(24, 110, 64, 92);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(64, 132, 7, 0, Math.PI * 2);
  ctx.fill();
  const face = await loadImage(portraitDataUrl(id, expr));
  ctx.drawImage(face, 8, 0, 112, 112);
  return c;
}

export class Resident {
  readonly group = new THREE.Group();
  private sprite: THREE.Sprite;
  private textures: Partial<Record<Expression, THREE.CanvasTexture>> = {};
  private t = Math.random() * 10;
  private cheering = false;
  private disposed = false;
  private cheerTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(zone: ZoneKey) {
    const { id, robe, pos } = ZONE_RESIDENT[zone];
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    this.sprite.scale.set(1.6, 2.4, 1);
    this.sprite.center.set(0.5, 0);
    // 그림이 준비되기 전엔 흰 사각형이 보이지 않게 숨김
    this.sprite.visible = false;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.group.add(shadow, this.sprite);
    this.group.position.set(...pos);
    for (const ex of ["neutral", "happy"] as Expression[]) {
      drawChibi(id, robe, ex)
        .then((canvas) => {
          if (this.disposed) return;
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          this.textures[ex] = tex;
          if (ex === "neutral" && !this.cheering) this.show("neutral");
        })
        .catch(() => {});
    }
  }

  private show(ex: Expression): void {
    const tex = this.textures[ex];
    if (!tex || this.disposed) return;
    (this.sprite.material as THREE.SpriteMaterial).map = tex;
    (this.sprite.material as THREE.SpriteMaterial).needsUpdate = true;
    this.sprite.visible = true;
  }

  tick(dt: number): void {
    if (this.cheering) return;
    this.t += dt * 0.05;
    this.sprite.position.y = Math.abs(Math.sin(this.t)) * 0.06;
    this.sprite.scale.set(1.6 + Math.sin(this.t * 2) * 0.025, 2.4 - Math.sin(this.t * 2) * 0.025, 1);
  }

  // 복구 순간: 기쁜 표정으로 바꾸고 두 번 점프
  cheer(): void {
    if (this.cheerTimer) clearTimeout(this.cheerTimer);
    this.cheering = true;
    this.show("happy");
    gsap.killTweensOf(this.sprite.position);
    gsap
      .timeline({
        onComplete: () => {
          this.cheerTimer = setTimeout(() => {
            this.cheerTimer = null;
            this.cheering = false;
            this.show("neutral");
          }, 900);
        },
      })
      .to(this.sprite.position, { y: 0.7, duration: 0.22, ease: "power2.out" })
      .to(this.sprite.position, { y: 0, duration: 0.22, ease: "bounce.out" })
      .to(this.sprite.position, { y: 0.45, duration: 0.18, ease: "power2.out" })
      .to(this.sprite.position, { y: 0, duration: 0.2, ease: "bounce.out" });
  }

  get expression(): Expression {
    return this.cheering ? "happy" : "neutral";
  }

  dispose(): void {
    this.disposed = true;
    if (this.cheerTimer) clearTimeout(this.cheerTimer);
    gsap.killTweensOf(this.sprite.position);
    for (const t of Object.values(this.textures)) t?.dispose();
    (this.sprite.material as THREE.SpriteMaterial).dispose();
  }
}
