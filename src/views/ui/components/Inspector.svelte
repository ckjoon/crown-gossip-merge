<script lang="ts">
  import { app } from "../context";
  import { ui, act, pointOf } from "../ui.svelte";
  import { getItemSVG, getCrateSVG } from "../../art/sprites";
  import { getItemMeta, getGeneratorTierMeta, formatGeneratorStars } from "../../../core/rules/chains";
  import { spawnRange } from "../../../core/rules/progression";
  import { spawnFromGenerator, storeToBag, sellItem, collectItem, unlockCobweb, sortBoard } from "../../../core/actions/board";

  const game = app().store;
  const item = $derived(ui.selectedCell !== null ? $game.board[ui.selectedCell] : null);
  const meta = $derived(item && !item.isGenerator ? getItemMeta(item.chain, item.level) : null);
  const tier = $derived(item && item.isGenerator ? getGeneratorTierMeta(item.chain, item.level) : null);
  const range = $derived(item && item.isGenerator ? spawnRange(item.level) : null);

  const cell = () => ui.selectedCell!;
  function afterRemove() {
    if (ui.selectedCell !== null && !app().store.get().board[ui.selectedCell]) ui.selectedCell = null;
  }
</script>

<div class="gh-inspector">
  {#if !item}
    <div class="insp-details">
      <div class="insp-title-row"><strong>같은 그림끼리 합치세요</strong></div>
    </div>
    <div class="insp-actions">
      <button class="insp-btn store-btn" onclick={(e) => act(sortBoard, undefined, pointOf(e))}>🧹정렬</button>
    </div>
  {:else if item.state === "crate"}
    <div class="insp-icon">{@html getCrateSVG()}</div>
    <div class="insp-details">
      <div class="insp-title-row"><strong>봉인 상자</strong></div>
      <p>옆 칸에서 합성하면 열려요</p>
    </div>
  {:else if tier}
    <div class="insp-icon">{@html getItemSVG(item.chain, item.level, true)}</div>
    <div class="insp-details">
      <div class="insp-title-row"><strong>{tier.name}</strong><span class="insp-lv-badge">{formatGeneratorStars(item.level)}</span></div>
      <p>바로 Lv.{range!.min}~{range!.max} · ⚡배속 최대 Lv.{range!.boostMax}</p>
    </div>
    <div class="insp-actions">
      <button class="insp-btn spawn-btn" onclick={(e) => act(spawnFromGenerator, { cell: cell() }, pointOf(e))}>⚡ 생성 ×{$game.boostMultiplier}</button>
      <button class="insp-btn store-btn" title="이 생성기로 만드는 것" onclick={() => { app().sfx.tap(); ui.codexFocus = item!.chain; ui.modal = "codex"; }}>📜</button>
      <button class="insp-btn store-btn" onclick={(e) => { act(storeToBag, { cell: cell() }, pointOf(e)); afterRemove(); }}>🎒보관</button>
    </div>
  {:else if meta}
    <div class="insp-icon">{@html getItemSVG(item.chain, item.level, false)}</div>
    <div class="insp-details">
      <div class="insp-title-row">
        <strong>{meta.name}</strong>
        <span class="insp-lv-badge">Lv.{item.level}/{meta.maxLv}</span>
      </div>
      {#if item.state === "cobweb"}
        <p>같은 그림을 끌어와 합치면 풀려요</p>
      {:else if meta.isCollectible}
        <p>탭하면 바로 받아요</p>
      {:else}
        <p>{meta.chainName}</p>
      {/if}
    </div>
    {#if item.state === "cobweb"}
      <div class="insp-actions">
        <button class="insp-btn sell-btn" onclick={(e) => act(unlockCobweb, { preferred: cell() }, pointOf(e))}>🕸️해제 🪙20</button>
      </div>
    {:else if item.state === "active"}
      <div class="insp-actions">
        {#if meta.isCollectible}
          <button class="insp-btn sell-btn" onclick={(e) => { act(collectItem, { cell: cell() }, pointOf(e)); afterRemove(); }}>수집</button>
        {:else}
          <button class="insp-btn store-btn" onclick={(e) => { act(storeToBag, { cell: cell() }, pointOf(e)); afterRemove(); }}>🎒보관</button>
          <button class="insp-btn sell-btn" onclick={(e) => { act(sellItem, { cell: cell() }, pointOf(e)); afterRemove(); }}>+{meta.sell}🪙</button>
        {/if}
      </div>
    {/if}
  {/if}
</div>
