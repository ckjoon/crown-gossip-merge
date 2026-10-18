<script lang="ts">
  import { app } from "../context";
  import { ui, act, pointOf } from "../ui.svelte";
  import { getItemSVG, getCrateSVG } from "../../art/sprites";
  import { getItemMeta, getGeneratorTierMeta, formatGeneratorStars } from "../../../core/rules/chains";
  import { spawnFromGenerator, storeToBag, sellItem, collectItem } from "../../../core/actions/board";

  const game = app().store;
  const item = $derived(ui.selectedCell !== null ? $game.board[ui.selectedCell] : null);
  const meta = $derived(item && !item.isGenerator ? getItemMeta(item.chain, item.level) : null);
  const tier = $derived(item && item.isGenerator ? getGeneratorTierMeta(item.chain, item.level) : null);

  const cell = () => ui.selectedCell!;
  function afterRemove() {
    if (ui.selectedCell !== null && !app().store.get().board[ui.selectedCell]) ui.selectedCell = null;
  }
</script>

<div class="gh-inspector">
  {#if !item}
    <div class="insp-icon">{@html getItemSVG("potion", 2, true)}</div>
    <div class="insp-details">
      <div class="insp-title-row"><strong>타일을 탭하거나 드래그해 합성하세요</strong><span class="insp-lv-badge">안내</span></div>
      <p>같은 생성기끼리 합성(★➔★★➔★★★)하면 더 높은 재료가 한 번에 나와요!</p>
    </div>
  {:else if item.state === "crate"}
    <div class="insp-icon">{@html getCrateSVG()}</div>
    <div class="insp-details">
      <div class="insp-title-row"><strong>봉인된 고대 상자</strong><span class="insp-lv-badge">잠김</span></div>
      <p>인접한 거미줄(🕸️) 타일을 합치면 상자가 열립니다.</p>
    </div>
  {:else if tier}
    <div class="insp-icon">{@html getItemSVG(item.chain, item.level, true)}</div>
    <div class="insp-details">
      <div class="insp-title-row"><strong>{tier.name}</strong><span class="insp-lv-badge">생성기 {formatGeneratorStars(item.level)}</span></div>
      <p>{tier.desc} (현재 배속 ×{$game.boostMultiplier})</p>
    </div>
    <div class="insp-actions">
      <button class="insp-btn spawn-btn" onclick={(e) => act(spawnFromGenerator, { cell: cell() }, pointOf(e))}>⚡ 생성 ×{$game.boostMultiplier}</button>
      <button class="insp-btn store-btn" onclick={(e) => { act(storeToBag, { cell: cell() }, pointOf(e)); afterRemove(); }}>🎒보관</button>
    </div>
  {:else if meta}
    <div class="insp-icon">{@html getItemSVG(item.chain, item.level, false)}</div>
    <div class="insp-details">
      <div class="insp-title-row">
        <strong>{meta.name}</strong>
        <span class="insp-lv-badge">{item.state === "cobweb" ? `Lv.${item.level}(거미줄)` : `Lv.${item.level}/${meta.maxLv}`}</span>
      </div>
      {#if item.state === "cobweb"}
        <p>같은 레벨의 활성 재료를 드래그해 합치거나 [🕸️해제] 버튼으로 푸세요.</p>
      {:else if meta.isCollectible}
        <p>탭하여 즉시 획득하거나 같은 단계끼리 합쳐 최대 Lv.{meta.maxLv} 보상으로 키우세요!</p>
      {:else if item.chain === "combo"}
        <p>이전 버전의 스페셜 조합품입니다. 판매만 가능해요.</p>
      {:else}
        <p>{meta.chainName} · 같은 재료끼리 드래그하여 상위 단계로 합치세요.</p>
      {/if}
    </div>
    {#if item.state === "active"}
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
