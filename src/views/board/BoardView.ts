// BoardView.ts — PixiJS 합성 보드 (본게임 7×8, 명절 5×5 공용): 칸·아이템 그리기, 탭·더블탭·드래그 입력
// 원칙: render()는 항상 넘겨받은 최신 상태를 기준으로 전체를 맞춘다. 손맛 연출(views/fx)은 이 위에 임시 복제본으로 얹는다.

import { Application, Container, Graphics, Sprite, Text, type FederatedPointerEvent } from "pixi.js";
import { gsap } from "gsap";
import { Particles } from "../fx/particles";
import { getTexture, onTexturesReady } from "../art/textures";
import type { CellVisual } from "./visuals";

export interface BoardDeco {
  selected: number | null;
}

export interface Point {
  x: number;
  y: number;
}

export interface ItemNode {
  c: Container;
  vis: CellVisual;
  cell: number;
  w: number;
  h: number;
  // 생성 포물선 연출 중이면 그 트윈과 도착 칸 (다른 위치 지정과 충돌하지 않게)
  arc?: { tween: gsap.core.Tween; cell: number } | null;
}

const GAP = 3.5;
const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 350;
const CELL_LIGHT = 0xefe6d4;
const CELL_DARK = 0xe4d6bd;
const CELL_WANTED = 0xa7f3d0;

export class BoardView {
  readonly app = new Application();
  readonly itemsLayer = new Container();
  readonly dragLayer = new Container();
  particles!: Particles;
  timeScale = 1; // 연출 줄이기: 0.5
  private readonly cellsG = new Graphics();
  readonly hintG = new Graphics();
  private readonly selG = new Graphics();
  private nodes = new Map<string, ItemNode>();
  private visuals: (CellVisual | null)[] = [];
  private deco: BoardDeco = { selected: null };
  private cw = 0;
  private ch = 0;
  private hints = new Set<number>();
  private inputEnabled = true;
  private drag: { pointerId: number; from: number; sx: number; sy: number; active: boolean; node: ItemNode | null } | null = null;
  private lastTap = { cell: -1, t: 0 };
  private ro: ResizeObserver | null = null;
  private offReady: (() => void) | null = null;
  private destroyed = false;
  private offWindow: (() => void) | null = null;

  onTap: (cell: number, isDouble: boolean, at: Point) => void = () => {};
  onDrop: (from: number, to: number, at: Point) => void = () => {};
  onDragStart: (from: number) => Set<number> = () => new Set();
  onDragMove: (at: Point, node: ItemNode) => void = () => {};

  constructor(
    private readonly host: HTMLElement,
    readonly cols: number,
    readonly rows: number
  ) {}

  async init(): Promise<void> {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      resizeTo: this.host,
    });
    if (this.destroyed) return;
    this.host.appendChild(this.app.canvas);
    this.particles = new Particles(this.app.ticker);
    this.app.stage.addChild(this.cellsG, this.hintG, this.selG, this.itemsLayer, this.particles.layer, this.dragLayer);
    // 합칠 수 있는 칸은 숨 쉬듯 빛난다
    gsap.to(this.hintG, { alpha: 0.35, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointerdown", (e) => this.handleDown(e));
    this.app.stage.on("globalpointermove", (e) => this.handleMove(e));
    this.app.stage.on("pointerup", (e) => this.handleUp(e));
    this.app.stage.on("pointerupoutside", (e) => this.handleUp(e));
    this.app.renderer.on("resize", () => this.relayout());
    this.ro = new ResizeObserver(() => this.app.resize());
    this.ro.observe(this.host);
    // Pixi는 pointercancel을 듣지 않으므로, 터치가 취소되면(제스처·알림창·앱 전환) 드래그를 직접 정리한다
    const cancel = () => this.cancelDrag();
    this.app.canvas.addEventListener("pointercancel", cancel);
    this.app.canvas.addEventListener("lostpointercapture", cancel);
    window.addEventListener("blur", cancel);
    const onVis = () => document.visibilityState === "hidden" && cancel();
    document.addEventListener("visibilitychange", onVis);
    this.offWindow = () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", onVis);
    };
    this.offReady = onTexturesReady(() => this.rebuildAll());
    this.relayout();
  }

  destroy(): void {
    this.destroyed = true;
    this.ro?.disconnect();
    this.offWindow?.();
    this.offReady?.();
    gsap.killTweensOf(this.hintG);
    try {
      // 텍스처·그래픽 컨텍스트는 다른 보드·fx 캔버스와 공유하므로 남기고 이 앱만 정리
      this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false, context: false });
    } catch {
      // init 전에 파괴되면 무시
    }
  }

  // ---------- 좌표 ----------

  cellRect(i: number): { x: number; y: number; w: number; h: number } {
    const col = i % this.cols;
    const row = Math.floor(i / this.cols);
    return { x: col * (this.cw + GAP), y: row * (this.ch + GAP), w: this.cw, h: this.ch };
  }

  cellCenter(i: number): Point {
    const r = this.cellRect(i);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  // 화면(client) 좌표 — fx 오버레이·알림 위치용
  cellCenterClient(i: number): Point {
    const rect = this.app.canvas.getBoundingClientRect();
    const c = this.cellCenter(i);
    return { x: rect.left + c.x, y: rect.top + c.y };
  }

  cellSize(): { w: number; h: number } {
    return { w: this.cw, h: this.ch };
  }

  cellAt(x: number, y: number): number {
    const col = Math.floor(x / (this.cw + GAP));
    const row = Math.floor(y / (this.ch + GAP));
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
    return row * this.cols + col;
  }

  isDragging(node: ItemNode): boolean {
    return this.drag?.node === node;
  }

  nodeAt(cell: number): ItemNode | null {
    for (const n of this.nodes.values()) if (n.cell === cell) return n;
    return null;
  }

  private toClient(p: Point): Point {
    const rect = this.app.canvas.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y };
  }

  // ---------- 그리기 ----------

  private relayout(): void {
    const W = this.app.screen.width;
    const H = this.app.screen.height;
    this.cw = Math.max(1, (W - GAP * (this.cols - 1)) / this.cols);
    this.ch = Math.max(1, (H - GAP * (this.rows - 1)) / this.rows);
    this.rebuildAll();
  }

  private rebuildAll(): void {
    for (const n of this.nodes.values()) this.drawNode(n);
    this.render(this.visuals, this.deco);
  }

  render(visuals: (CellVisual | null)[], deco: BoardDeco): void {
    this.visuals = visuals;
    this.deco = deco;
    if (!this.cw) return;

    this.cellsG.clear();
    for (let i = 0; i < this.cols * this.rows; i++) {
      const r = this.cellRect(i);
      const alt = (Math.floor(i / this.cols) + (i % this.cols)) % 2 === 1;
      const color = visuals[i]?.wanted ? CELL_WANTED : alt ? CELL_DARK : CELL_LIGHT;
      this.cellsG.roundRect(r.x, r.y, r.w, r.h, 8).fill({ color });
      if (visuals[i]?.wanted) this.cellsG.roundRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 7).stroke({ width: 2, color: 0x10b981 });
    }

    this.selG.clear();
    if (deco.selected !== null && deco.selected >= 0) {
      const r = this.cellRect(deco.selected);
      this.selG.roundRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 9).stroke({ width: 2.5, color: 0xf59e0b });
    }
    this.drawHints();

    const alive = new Set<string>();
    visuals.forEach((vis, cell) => {
      if (!vis) return;
      alive.add(vis.key);
      let node = this.nodes.get(vis.key);
      if (!node) {
        node = { c: new Container(), vis, cell, w: 0, h: 0 };
        this.nodes.set(vis.key, node);
        this.itemsLayer.addChild(node.c);
        this.drawNode(node);
      } else if (!sameVisual(node.vis, vis) || node.w !== this.cw * 0.96) {
        node.vis = vis;
        this.drawNode(node);
      }
      node.cell = cell;
      if (node.arc && node.arc.cell !== cell) {
        node.arc.tween.kill();
        node.arc = null;
      }
      if (this.drag?.node !== node && !node.arc) {
        const c = this.cellCenter(cell);
        const far = Math.hypot(node.c.x - c.x, node.c.y - c.y);
        if (node.c.x === 0 && node.c.y === 0) node.c.position.set(c.x, c.y);
        else if (far > 1) {
          // 이동·교체·되돌아가기는 짧게 미끄러지며 "통" 자리잡기
          gsap.killTweensOf(node.c.position);
          gsap.to(node.c.position, { x: c.x, y: c.y, duration: 0.22 * this.timeScale, ease: "back.out(2.2)" });
        }
      }
    });
    for (const [key, node] of this.nodes) {
      if (alive.has(key)) continue;
      if (this.drag?.node === node) this.drag = null;
      node.c.destroy({ children: true });
      this.nodes.delete(key);
    }
  }

  setHints(cells: Set<number>): void {
    this.hints = cells;
    this.drawHints();
  }

  private drawHints(): void {
    this.hintG.clear();
    for (const i of this.hints) {
      const r = this.cellRect(i);
      this.hintG.roundRect(r.x, r.y, r.w, r.h, 8).fill({ color: 0xfce7f3 }).stroke({ width: 2.5, color: 0xec4899 });
    }
  }

  // 아이템 타일 하나 그리기 (v2 CSS 타일과 같은 배색)
  private drawNode(node: ItemNode): void {
    const vis = node.vis;
    const w = this.cw * 0.96;
    const h = this.ch * 0.96;
    node.w = w;
    node.h = h;
    const c = node.c;
    for (const child of c.removeChildren()) child.destroy({ children: true });
    c.pivot.set(w / 2, h / 2);

    const bg = new Graphics();
    bg.roundRect(0, 2, w, h, 8).fill({ color: vis.shadow });
    bg.roundRect(0, 0, w, h, 8).fill({ color: vis.bg }).stroke({ width: 1.5, color: vis.border });
    if (!vis.isGenerator && vis.state !== "crate") bg.roundRect(3, 3, w - 6, h * 0.45, 6).fill({ color: 0xffffff, alpha: 0.55 });
    c.addChild(bg);

    const tex = getTexture(vis.tex);
    if (tex) {
      const icon = new Sprite(tex);
      const size = Math.min(w, h) * 0.66;
      icon.anchor.set(0.5);
      icon.width = size;
      icon.height = size;
      icon.position.set(w / 2, h * 0.43);
      c.addChild(icon);
    }

    const fontSize = Math.max(6.5, Math.min(9.5, h * 0.12));
    const label = new Text({ text: vis.label, style: { fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif", fontSize, fontWeight: "800", fill: vis.labelDark ? 0xffffff : 0x0f172a } });
    const maxW = w - 4;
    if (label.width > maxW) label.scale.set(maxW / label.width);
    const lbg = new Graphics();
    const lh = label.height + 1;
    lbg.roundRect(2, h - lh - 2, w - 4, lh, 3.5).fill({ color: vis.labelDark ? 0x0f172a : 0xffffff, alpha: vis.labelDark ? 0.7 : 0.88 });
    label.position.set((w - label.width) / 2, h - lh - 1.5);
    c.addChild(lbg, label);

    if (vis.pill) {
      const pill = new Text({ text: vis.pill, style: { fontFamily: "sans-serif", fontSize: Math.max(6, fontSize - 1), fontWeight: "900", fill: vis.isGenerator ? 0xfde047 : 0xffffff } });
      const pb = new Graphics();
      pb.roundRect(w - pill.width - 6, 1, pill.width + 4, pill.height, 3.5).fill({ color: 0x0f172a, alpha: 0.8 });
      pill.position.set(w - pill.width - 4, 1);
      c.addChild(pb, pill);
    }

    if (vis.state === "cobweb") {
      const web = new Graphics();
      for (let x = -h; x < w; x += 8) web.moveTo(x, h).lineTo(x + h, 0);
      web.stroke({ width: 3, color: 0x94a3b8, alpha: 0.28 });
      const mask = new Graphics().roundRect(0, 0, w, h, 8).fill({ color: 0xffffff });
      web.mask = mask;
      const t = new Text({ text: "🕸️", style: { fontSize: fontSize + 1 } });
      t.position.set(2, 1);
      c.addChild(mask, web, t);
      c.alpha = 0.92;
    } else {
      c.alpha = 1;
    }

    if (vis.wanted) {
      const badge = new Graphics().circle(5, 5, 7).fill({ color: 0x16a34a }).stroke({ width: 1, color: 0xffffff });
      const chk = new Text({ text: "✔", style: { fontSize: 8, fontWeight: "900", fill: 0xffffff } });
      chk.anchor.set(0.5);
      chk.position.set(5, 5);
      c.addChild(badge, chk);
    }
  }

  // ---------- 입력 ----------

  setInputEnabled(on: boolean): void {
    this.inputEnabled = on;
    if (!on) this.cancelDrag();
  }

  private cancelDrag(): void {
    if (!this.drag) return;
    if (this.drag.active && this.drag.node) {
      const c = this.drag.node.c;
      this.itemsLayer.addChild(c);
      gsap.killTweensOf(c.scale);
      gsap.killTweensOf(c);
      c.scale.set(1);
      c.rotation = 0;
    }
    this.drag = null;
    this.setHints(new Set());
    this.render(this.visuals, this.deco);
  }

  private handleDown(e: FederatedPointerEvent): void {
    if (!this.inputEnabled) return;
    // 이전 포인터가 움직임 없이 남아 있으면(취소된 터치) 버리고 새로 시작
    if (this.drag && this.drag.pointerId !== e.pointerId && !this.drag.active) this.drag = null;
    if (this.drag) return;
    const cell = this.cellAt(e.global.x, e.global.y);
    if (cell < 0) return;
    this.drag = { pointerId: e.pointerId, from: cell, sx: e.global.x, sy: e.global.y, active: false, node: null };
  }

  private handleMove(e: FederatedPointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.active) {
      if (Math.hypot(e.global.x - d.sx, e.global.y - d.sy) < DRAG_THRESHOLD) return;
      const vis = this.visuals[d.from];
      const node = this.nodeAt(d.from);
      if (!vis || vis.state !== "active" || !node) return;
      d.active = true;
      d.node = node;
      if (node.arc) {
        node.arc.tween.kill();
        node.arc = null;
      }
      this.dragLayer.addChild(node.c);
      gsap.killTweensOf(node.c.scale);
      gsap.to(node.c.scale, { x: 1.15, y: 1.15, duration: 0.12 * this.timeScale, ease: "back.out(3)" });
      this.setHints(this.onDragStart(d.from));
    }
    if (d.node) {
      // 이동 방향으로 살짝 기울기 (±12°)
      const vx = e.global.x - d.node.c.x;
      d.node.c.rotation = Math.max(-0.21, Math.min(0.21, d.node.c.rotation * 0.7 + vx * 0.012));
      d.node.c.position.set(e.global.x, e.global.y);
      this.onDragMove(this.toClient({ x: e.global.x, y: e.global.y }), d.node);
    }
  }

  private handleUp(e: FederatedPointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    const at = this.toClient({ x: e.global.x, y: e.global.y });
    if (d.active && d.node) {
      this.itemsLayer.addChild(d.node.c);
      gsap.to(d.node.c.scale, { x: 1, y: 1, duration: 0.2 * this.timeScale, ease: "back.out(3)" });
      gsap.to(d.node.c, { rotation: 0, duration: 0.2 * this.timeScale });
      this.setHints(new Set());
      const to = this.cellAt(e.global.x, e.global.y);
      this.onDrop(d.from, to < 0 ? d.from : to, at);
      // 상태가 바뀌지 않았다면(거부·같은 칸) 원래 자리로
      this.render(this.visuals, this.deco);
      return;
    }
    const now = performance.now();
    const isDouble = this.lastTap.cell === d.from && now - this.lastTap.t < DOUBLE_TAP_MS;
    this.lastTap = { cell: d.from, t: now };
    this.onTap(d.from, isDouble, at);
  }
}

function sameVisual(a: CellVisual, b: CellVisual): boolean {
  return a.tex === b.tex && a.label === b.label && a.pill === b.pill && a.state === b.state && a.wanted === b.wanted && a.bg === b.bg;
}
