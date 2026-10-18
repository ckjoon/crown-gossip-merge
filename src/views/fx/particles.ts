// particles.ts — 객체 풀 기반 파티클 (별가루·빛 링·꼬리빛). 보드 캔버스와 화면 전체 fx 캔버스가 함께 쓴다

import { Container, Graphics, type Ticker } from "pixi.js";

interface P {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
  max: number;
  gravity: number;
  spin: number;
  grow: number;
}

export interface BurstOpts {
  count: number;
  colors: number[];
  speed?: number;
  life?: number;
  gravity?: number;
  size?: number;
  shape?: "star" | "dot";
}

const POOL_LIMIT = 400;

export class Particles {
  private active: P[] = [];
  private pool: Graphics[] = [];
  readonly layer = new Container();

  constructor(ticker: Ticker) {
    ticker.add((t) => this.step(t.deltaTime));
  }

  private take(): Graphics {
    return this.pool.pop() ?? new Graphics();
  }

  burst(x: number, y: number, o: BurstOpts): void {
    const n = Math.min(o.count, POOL_LIMIT - this.active.length);
    for (let i = 0; i < n; i++) {
      const g = this.take();
      g.clear();
      const size = (o.size ?? 3) * (0.6 + Math.random() * 0.8);
      const color = o.colors[i % o.colors.length];
      if (o.shape === "dot") g.circle(0, 0, size).fill({ color });
      else g.star(0, 0, 5, size * 1.6, size * 0.7).fill({ color });
      g.position.set(x, y);
      g.alpha = 1;
      g.scale.set(1);
      this.layer.addChild(g);
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const sp = (o.speed ?? 3) * (0.5 + Math.random());
      const life = (o.life ?? 40) * (0.7 + Math.random() * 0.6);
      this.active.push({ g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, life, max: life, gravity: o.gravity ?? 0.12, spin: (Math.random() - 0.5) * 0.3, grow: 0 });
    }
  }

  ring(x: number, y: number, color: number, radius: number, width = 3): void {
    if (this.active.length >= POOL_LIMIT) return;
    const g = this.take();
    g.clear();
    g.circle(0, 0, radius).stroke({ width, color });
    g.position.set(x, y);
    g.scale.set(0.3);
    g.alpha = 1;
    this.layer.addChild(g);
    this.active.push({ g, vx: 0, vy: 0, life: 24, max: 24, gravity: 0, spin: 0, grow: 0.055 });
  }

  private step(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.g.removeFromParent();
        if (this.pool.length < POOL_LIMIT) this.pool.push(p.g);
        else p.g.destroy();
        this.active.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.rotation += p.spin * dt;
      if (p.grow) p.g.scale.set(p.g.scale.x + p.grow * dt);
      p.g.alpha = Math.min(1, (p.life / p.max) * 1.4);
    }
  }

  get count(): number {
    return this.active.length;
  }
}
