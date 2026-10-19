// juice.ts — core 이벤트 → 손맛 연출 (생성 포물선·합성 팝·주문 비행·수집 비행·상자 열림). 연출은 상태를 바꾸지 않는다
// 상태 반영(보드 다시 그리기)은 Svelte effect로 다음 프레임에 일어나므로, "새로 생긴 노드"를 다루는 연출은 afterRender로 미룬다

import { gsap } from "gsap";
import type { Store } from "../../core/store";
import type { GameEvent } from "../../core/events";
import type { SoundEngine } from "../../services/audio";
import { HAPTIC, vibrate } from "../../services/haptics";
import { getTexture } from "../art/textures";
import { getMainBoard } from "../board/registry";
import type { BoardView, ItemNode } from "../board/BoardView";
import { elementCenter, type FxLayer } from "./FxLayer";
import { toast } from "../ui/ui.svelte";

const GOLD = [0xfde047, 0xf59e0b, 0xffffff];

function afterRender(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

function pillCenter(target: "coins" | "gems" | "energy") {
  return elementCenter(document.querySelector(`[data-fx-target="${target}"]`));
}

export function attachJuice(store: Store, fx: FxLayer, sfx: SoundEngine): () => void {
  const reduced = () => store.get().settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const amount = (n: number) => Math.max(1, Math.round(n * (reduced() ? 0.25 : 1)));

  function pop(node: ItemNode, from = 0.6) {
    gsap.killTweensOf(node.c.scale);
    gsap.fromTo(node.c.scale, { x: from, y: from }, { x: 1, y: 1, duration: 0.45, ease: "elastic.out(1.1,0.45)" });
  }

  function shake(board: BoardView, intensity: number) {
    if (reduced()) return;
    const el = board.app.canvas.parentElement;
    if (!el) return;
    gsap.fromTo(el, { x: -intensity }, { x: 0, duration: 0.3, ease: "elastic.out(1,0.25)", clearProps: "transform" });
  }

  function onSpawned(board: BoardView, e: Extract<GameEvent, { type: "spawned" }>) {
    sfx.spawn();
    vibrate(HAPTIC.spawn);
    board.expectAppear(e.to, { from: e.from, scale: 0.4 });
    const gen = board.nodeAt(e.from);
    if (gen) {
      gsap.killTweensOf(gen.c.scale);
      gsap.fromTo(gen.c.scale, { x: 0.85, y: 1.12 }, { x: 1, y: 1, duration: 0.35, ease: "elastic.out(1,0.4)" });
    }
    afterRender(() => {
      const node = board.nodeAt(e.to);
      // 그 사이 사용자가 집었거나 다른 칸으로 옮겼다면 포물선을 생략
      if (!node || node.cell !== e.to || board.isDragging(node)) {
        if (node && !board.isDragging(node)) node.c.scale.set(1);
        return;
      }
      const a = board.cellCenter(e.from);
      const b = board.cellCenter(e.to);
      const arc = Math.max(24, Math.hypot(b.x - a.x, b.y - a.y) * 0.4);
      const trail = e.boostSteps === 2 ? [0xfde047, 0xf59e0b] : e.boostSteps === 1 ? [0x38bdf8, 0xe0f2fe] : null;
      gsap.killTweensOf(node.c.position);
      node.c.position.set(a.x, a.y);
      node.c.scale.set(0.4);
      const prog = { p: 0 };
      let frame = 0;
      const tween = gsap.to(prog, {
        p: 1,
        duration: 0.35 * board.timeScale,
        ease: "power1.inOut",
        onUpdate: () => {
          const p = prog.p;
          node.c.position.set(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p - arc * 4 * p * (1 - p));
          node.c.scale.set(0.4 + 0.6 * p);
          if (trail && frame++ % 2 === 0) board.particles.burst(node.c.x, node.c.y, { count: amount(2), colors: trail, speed: 0.8, size: 2.2, life: 18, gravity: 0, shape: "dot" });
        },
        onComplete: () => {
          node.arc = null;
          node.c.position.set(b.x, b.y);
          gsap.fromTo(node.c.scale, { x: 1.18, y: 0.82 }, { x: 1, y: 1, duration: 0.3, ease: "elastic.out(1,0.35)" });
          board.particles.burst(b.x, b.y + board.cellSize().h * 0.3, { count: amount(5), colors: [0xffffff, 0xe2e8f0], speed: 1.6, size: 2, life: 16, shape: "dot" });
        },
      });
      node.arc = { tween, cell: e.to };
    });
  }

  function onMerged(board: BoardView, e: Extract<GameEvent, { type: "merged" }>) {
    const lv = e.item.level;
    sfx.merge(lv, e.generatorEvolved);
    vibrate(lv >= 5 || e.generatorEvolved ? HAPTIC.bigMerge : HAPTIC.merge);
    board.expectAppear(e.to, { scale: 0.6 });
    afterRender(() => {
      const node = board.nodeAt(e.to);
      const c = board.cellCenter(e.to);
      if (node) pop(node);
      const r = Math.min(board.cellSize().w, board.cellSize().h) * 0.55;
      board.particles.ring(c.x, c.y, e.generatorEvolved ? 0xfde047 : node?.vis.accent ?? 0xffffff, r);
      if (e.generatorEvolved) board.particles.ring(c.x, c.y, 0xf59e0b, r * 1.4, 4);
      const colors = node ? [node.vis.accent, 0xffffff, 0xfde047] : GOLD;
      board.particles.burst(c.x, c.y, { count: amount(Math.min(48, lv * 6 + (e.generatorEvolved ? 16 : 0))), colors, speed: 2.6 + lv * 0.35, size: 2.8 });
      if (lv >= 5 || e.generatorEvolved) shake(board, 4);
    });
  }

  function onOrderServed(board: BoardView, e: Extract<GameEvent, { type: "orderServed" }>) {
    sfx.serve();
    const card = () => document.querySelector(`[data-order-idx="${e.orderIdx}"]`);
    const target = elementCenter(card()) ?? { x: window.innerWidth / 2, y: 140 };
    const size = Math.min(board.cellSize().w, board.cellSize().h) * 0.94;
    e.cells.forEach((cell, i) => {
      const node = board.nodeAt(cell);
      const tex = node ? getTexture(node.vis.tex) : null;
      if (!tex) return;
      fx.fly(tex, board.cellCenterClient(cell), target, {
        size,
        delay: i * 0.08,
        duration: 0.5,
        onArrive: () => {
          const el = card();
          el?.classList.remove("absorb");
          void (el as HTMLElement | null)?.offsetWidth;
          el?.classList.add("absorb");
          fx.burst(target, amount(10), [0x10b981, 0xa7f3d0, 0xffffff], 3);
          if (i === e.cells.length - 1) {
            const coinsTo = pillCenter("coins");
            if (!coinsTo) return;
            const n = amount(Math.min(10, 6 + Math.floor(e.coins / 100)));
            for (let k = 0; k < n; k++) fx.fly("🪙", { x: target.x + (Math.random() - 0.5) * 30, y: target.y }, coinsTo, { size: 20, delay: k * 0.05, duration: 0.55 });
          }
        },
      });
    });
  }

  // 생성기 흡수 (v3.8): 더는 못 만드는 Lv.1 재료가 진화한 생성기로 빨려 들어간다 (상태에선 이미 빠졌으므로 지금 노드 모습을 복제해 날림)
  function onAbsorbed(board: BoardView, e: Extract<GameEvent, { type: "absorbed" }>) {
    const to = board.cellCenterClient(e.generator);
    const size = Math.min(board.cellSize().w, board.cellSize().h) * 0.8;
    e.cells.forEach((cell, i) => {
      const node = board.nodeAt(cell);
      const tex = node ? getTexture(node.vis.tex) : getTexture(`item:${e.items[i].chain}:1`);
      if (!tex) return;
      fx.fly(tex, board.cellCenterClient(cell), to, {
        size,
        delay: 0.25 + i * 0.06,
        duration: 0.45,
        onArrive: () => fx.burst(to, amount(6), [0xfde047, 0xc084fc, 0xffffff], 2.4),
      });
    });
    const n = e.cells.length + e.bag;
    toast(`🌀 생성기가 더는 못 만드는 Lv.1 재료 ${n}개를 흡수했어요 +${e.coins}🪙${e.bag ? ` (🎒 ${e.bag}개 포함)` : ""}`, to.x, to.y - 30, "#fde047");
  }

  function onCollected(board: BoardView, e: Extract<GameEvent, { type: "collected" }>) {
    const node = board.nodeAt(e.cell);
    const to = pillCenter(e.currency);
    const tex = node ? getTexture(node.vis.tex) : null;
    if (tex && to) fx.fly(tex, board.cellCenterClient(e.cell), to, { size: 30, duration: 0.5 });
  }

  const unsub = store.onEvent((e) => {
    const board = getMainBoard();
    const ts = reduced() ? 0.5 : 1;
    fx.timeScale = ts;
    if (board) board.timeScale = ts;
    switch (e.type) {
      case "spawned":
        if (board) onSpawned(board, e);
        break;
      case "merged":
        if (board) onMerged(board, e);
        break;
      case "orderServed":
        if (board) onOrderServed(board, e);
        break;
      case "collected":
        if (board) onCollected(board, e);
        break;
      case "absorbed":
        if (board) onAbsorbed(board, e);
        break;
      case "bonusDropped":
        if (board) board.expectAppear(e.cell, { scale: 0.2 });
        if (board)
          afterRender(() => {
            const node = board.nodeAt(e.cell);
            if (node) pop(node, 0.2);
            const c = board.cellCenter(e.cell);
            board.particles.burst(c.x, c.y, { count: amount(10), colors: GOLD, speed: 2 });
          });
        break;
      case "cratesOpened":
      case "cobwebUnlocked":
        if (board) {
          const cells = e.type === "cratesOpened" ? e.cells : [e.cell];
          afterRender(() => {
            for (const cell of cells) {
              const node = board.nodeAt(cell);
              if (node) pop(node, 0.8);
              const c = board.cellCenter(cell);
              board.particles.burst(c.x, c.y, { count: amount(8), colors: [0xd6d3d1, 0xa8a29e, 0xffffff], speed: 1.8, shape: "dot" });
            }
          });
        }
        break;
      case "currencyChanged":
        if (e.currency === "gems" && e.delta > 0 && (e.reason === "levelUp" || e.reason === "holidayMission")) {
          const to = pillCenter("gems");
          if (to) fx.fly("💎", { x: window.innerWidth / 2, y: window.innerHeight * 0.4 }, to, { size: 30, duration: 0.7 });
        }
        break;
      default:
        break;
    }
  });
  return unsub;
}
