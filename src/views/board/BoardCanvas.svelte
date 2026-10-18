<script lang="ts">
  // Pixi 보드를 Svelte 화면에 붙이고, 게임 상태·선택 칸이 바뀔 때마다 다시 그린다
  import { app } from "../ui/context";
  import { ui, act } from "../ui/ui.svelte";
  import { BoardView } from "./BoardView";
  import { mainBoardVisuals, holidayBoardVisuals } from "./visuals";
  import { computeWanted } from "../../core/actions/orders";
  import { spawnFromGenerator, collectItem, moveOrMerge, getMergeTargets } from "../../core/actions/board";
  import { holidaySpawn, holidayMoveOrMerge } from "../../core/actions/holiday";
  import { getItemMeta } from "../../core/rules/chains";
  import { getHolidayConfig } from "../../core/rules/holidays";

  let { mode = "main", onReady }: { mode?: "main" | "holiday"; onReady?: (bv: BoardView) => void } = $props();
  const game = app().store;
  let host = $state<HTMLDivElement>();
  let bv = $state<BoardView | null>(null);

  $effect(() => {
    if (!host) return;
    const view = mode === "main" ? new BoardView(host, 7, 8) : new BoardView(host, 5, 5);
    let alive = true;
    void view.init().then(() => {
      if (!alive) return;
      if (mode === "main") wireMain(view);
      else wireHoliday(view);
      bv = view;
      onReady?.(view);
    });
    return () => {
      alive = false;
      bv = null;
      view.destroy();
    };
  });

  $effect(() => {
    if (!bv) return;
    const s = $game;
    if (mode === "main") bv.render(mainBoardVisuals(s, computeWanted(s).wantedUids), { selected: ui.selectedCell });
    else bv.render(holidayBoardVisuals(s), { selected: ui.selectedEventCell });
  });

  $effect(() => {
    bv?.setInputEnabled(!ui.inputLocked && (mode === "holiday" ? ui.modal === "holiday" : ui.modal === null && ui.screen === "merge"));
  });

  function wireMain(view: BoardView) {
    view.onTap = (cell, isDouble, at) => {
      const s = app().store.get();
      const item = s.board[cell];
      if (!item) return;
      if (item.isGenerator && item.state === "active") {
        ui.selectedCell = cell;
        act(spawnFromGenerator, { cell }, at);
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
