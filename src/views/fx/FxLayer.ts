// FxLayer.ts — 화면 전체를 덮는 투명 Pixi 캔버스(터치 통과). 보드 ↔ HTML UI 사이를 오가는 비행 연출을 그린다

import { Application, Sprite, Text, type Container, type Texture } from "pixi.js";
import { gsap } from "gsap";
import { Particles } from "./particles";

export interface Pt {
  x: number;
  y: number;
}

export class FxLayer {
  readonly app = new Application();
  particles!: Particles;
  timeScale = 1;

  async init(): Promise<void> {
    await this.app.init({ backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), resizeTo: window });
    const c = this.app.canvas;
    Object.assign(c.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "150" });
    document.body.appendChild(c);
    this.particles = new Particles(this.app.ticker);
    this.app.stage.addChild(this.particles.layer);
  }

  // 텍스처 또는 이모지를 from → to로 포물선 비행 (화면 좌표)
  fly(what: Texture | string, from: Pt, to: Pt, o: { size?: number; duration?: number; delay?: number; arc?: number; onArrive?: () => void } = {}): void {
    let node: Container;
    const size = o.size ?? 34;
    if (typeof what === "string") {
      const t = new Text({ text: what, style: { fontSize: size } });
      t.anchor.set(0.5);
      node = t;
    } else {
      const s = new Sprite(what);
      s.anchor.set(0.5);
      s.width = size;
      s.height = size;
      node = s;
    }
    node.position.set(from.x, from.y);
    const baseScale = node.scale.x;
    this.app.stage.addChild(node);
    const arc = o.arc ?? Math.min(120, Math.hypot(to.x - from.x, to.y - from.y) * 0.35);
    const prog = { p: 0 };
    gsap.to(prog, {
      p: 1,
      duration: (o.duration ?? 0.55) * this.timeScale,
      delay: (o.delay ?? 0) * this.timeScale,
      ease: "power1.in",
      onUpdate: () => {
        const p = prog.p;
        node.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p - arc * 4 * p * (1 - p));
        node.scale.set(baseScale * (1 - p * 0.45));
      },
      onComplete: () => {
        node.destroy();
        o.onArrive?.();
      },
    });
  }

  burst(at: Pt, count: number, colors: number[], speed = 4): void {
    this.particles.burst(at.x, at.y, { count, colors, speed, size: 3.2 });
  }
}

export function elementCenter(el: Element | null): Pt | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
