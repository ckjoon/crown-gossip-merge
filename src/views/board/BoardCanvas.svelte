<script lang="ts">
  // Pixi 보드를 Svelte 화면에 붙이고, 게임 상태·선택 칸이 바뀔 때마다 다시 그린다
  import { app } from "../ui/context";
  import { ui, act } from "../ui/ui.svelte";
  import { BoardView } from "./BoardView";
  import { setMainBoard } from "./registry";
  import { mainBoardVisuals, holidayBoardVisuals } from "./visuals";
  import { computeWanted } from "../../core/actions/orders";
  import { spawnFromGenerator, collectItem, moveOrMerge, getMergeTargets, findMergePair } from "../../core/actions/board";
  import { holidaySpawn, holidayMoveOrMerge } from "../../core/actions/holiday";
  import { getItemMeta } from "../../core/rules/chains";
  import { getHolidayConfig } from "../../core/rules/holidays";
  import { coachFor } from "../ui/coach";

  let { mode = "main", onReady }: { mode?: "main" | "holiday"; onReady?: (bv: BoardView) => void } = $props();
  const game = app().store;
  let host = $state<HTMLDivElement>();
  let bv = $state<BoardView | null>(null);

  $effect(() => {
    if (!host) return;
    const view = mode === "main" ? new BoardView(host, 7, 8) : new BoardView(host, 5, 5);
    let alive = true;
    let idleTimer: ReturnType<typeof setInterval> | null = null;
    void view.init().then(() => {
      if (!alive) return;
      if (mode === "main") {
        wireMain(view);
        idleTimer = setInterval(() => idleHint(view), 1000);
      } else wireHoliday(view);
      bv = view;
      if (mode === "main") setMainBoard(view);
      onReady?.(view);
    });
    return () => {
      alive = false;
      if (idleTimer) clearInterval(idleTimer);
      bv = null;
      if (mode === "main") setMainBoard(null);
      view.destroy();
    };
  });

  $effect(() => {
    if (!bv) return;
    const s = $game;
    if (mode === "main") bv.render(mainBoardVisuals(s, computeWanted(s).wantedUids), { selected: ui.selectedCell });
    else bv.render(holidayBoardVisuals(s), { selected: ui.selectedEventCell });
  });

  // 가리킬 칸이 바뀌면(합성·주문 완료 등으로 코치 단계가 넘어감) 지금 넛지를 멈추고 대기 후 새 칸으로
  let hintKey = "";
  $effect(() => {
    if (mode !== "main") return;
    const key = String(coachFor($game)?.cells ?? "");
    if (key !== hintKey) {
      hintKey = key;
      bv?.stopNudge();
    }
  });

  $effect(() => {
    bv?.setInputEnabled(!ui.inputLocked && (mode === "holiday" ? ui.modal === "holiday" : ui.modal === null && ui.screen === "merge"));
  });

  // 막혔을 때 힌트 (v3.7): 보드를 IDLE_MS 동안 안 만지면 합칠 쌍을 톡톡 넛지, 보드가 가득 차 거절되면 바로
  // 첫 복구 코치가 있으면 코치가 가리키는 칸(합칠 쌍·생성기)을 더 빨리 넛지
  const IDLE_MS = 5000;
  const COACH_IDLE_MS = 1500;
  let lastInput = performance.now();

  function hintCells(): number[] {
    const s = app().store.get();
    const coach = coachFor(s);
    if (coach) return coach.cells;
    // 주문에 쓰일 재료는 되도록 빼고 (그것밖에 없으면 그 쌍이라도)
    return findMergePair(s, computeWanted(s).wantedUids) ?? findMergePair(s) ?? [];
  }

  function idleHint(view: BoardView) {
    const visible = ui.screen === "merge" && ui.modal === null && !ui.inputLocked;
    if (!visible) {
      if (view.isNudging()) view.stopNudge();
      return;
    }
    const wait = coachFor(app().store.get()) ? COACH_IDLE_MS : IDLE_MS;
    if (view.isNudging() || view.isPressing() || performance.now() - lastInput < wait) return;
    view.reduceMotion = app().store.get().settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cells = hintCells();
    if (cells.length) view.nudge(cells);
  }

  function wireMain(view: BoardView) {
    view.onInput = () => (lastInput = performance.now());
    view.onTap = (cell, isDouble, at) => {
      const s = app().store.get();
      const item = s.board[cell];
      if (!item) return;
      if (item.isGenerator && item.state === "active") {
        ui.selectedCell = cell;
        const ev = act(spawnFromGenerator, { cell }, at);
        if (ev.some((e) => e.type === "rejected" && e.reason === "boardFull")) {
          const cells = hintCells();
          view.reduceMotion = s.settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (cells.length) view.nudge(cells);
        }
        return;
      }
      const meta = getItemMeta(item.chain, item.level);
      if (item.state === "active" && meta.isCollectible && (isDouble || ui.selectedCell === cell)) {
        act(collectItem, { cell }, at);
        if (!app().store.get().board[cell]) ui.selectedCell = null;
        return;
      }
      ui.selectedCell = cell;
      app().sfx.tap();
    };
    view.onDragStart = (from) => new Set(getMergeTargets(app().store.get(), from));
    view.onDrop = (from, to, at) => {
      if (from === to) return;
      act(moveOrMerge, { from, to }, at);
      if (app().store.get().board[to]) ui.selectedCell = to;
    };
  }

  function wireHoliday(view: BoardView) {
    const maxLv = () => getHolidayConfig(app().store.get().holiday.activeHolidayId).items.length;
    view.onTap = (cell, _isDouble, at) => {
      const b = app().store.get().holiday.board;
      const it = b[cell];
      if (it?.isGenerator) {
        act(holidaySpawn, undefined, at);
        return;
      }
      // 이미 선택한 아이템과 같은 레벨을 연속 탭하면 합성
      const prev = ui.selectedEventCell;
      const src = prev !== null ? b[prev] : null;
      if (prev !== null && prev !== cell && src && !src.isGenerator && it && !it.isGenerator && it.level === src.level && src.level < maxLv()) {
        act(holidayMoveOrMerge, { from: prev, to: cell }, at);
      } else {
        app().sfx.tap();
      }
      ui.selectedEventCell = cell;
    };
    view.onDragStart = (from) => {
      const b = app().store.get().holiday.board;
      const src = b[from];
      const out = new Set<number>();
      if (!src || src.isGenerator) return out;
      b.forEach((t, i) => i !== from && t && !t.isGenerator && t.level === src.level && src.level < maxLv() && out.add(i));
      return out;
    };
    view.onDrop = (from, to, at) => {
      if (from === to) return;
      act(holidayMoveOrMerge, { from, to }, at);
      ui.selectedEventCell = to;
    };
  }
</script>

<div class="board-host" bind:this={host}></div>
