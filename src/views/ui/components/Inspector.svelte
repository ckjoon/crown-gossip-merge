<script lang="ts">
  import { app } from "../context";
  import { ui, act, pointOf } from "../ui.svelte";
  import { getItemSVG, getCrateSVG } from "../../art/sprites";
  import { CHAINS, getItemMeta, getGeneratorTierMeta, formatGeneratorStars } from "../../../core/rules/chains";
  import { spawnRange } from "../../../core/rules/progression";
  import { generatorSeen } from "../../../core/codex";
  import { spawnFromGenerator, storeToBag, sellItem, collectItem, unlockCobweb, sortBoard } from "../../../core/actions/board";

  const game = app().store;
  const item = $derived(ui.selectedCell !== null ? $game.board[ui.selectedCell] : null);
  const meta = $derived(item && !item.isGenerator ? getItemMeta(item.chain, item.level) : null);
  const tier = $derived(item && item.isGenerator ? getGeneratorTierMeta(item.chain, item.level) : null);
  const range = $derived(item && item.isGenerator ? spawnRange(item.level) : null);

  // 이 재료가 어디서 오는지 (v3.9): 지금 가진 생성기 등급이 바로 만드는 단계면 생성기에서, 아니면 한 단계 아래 둘을 합쳐서
  const origin = $derived.by(() => {
    if (!item || item.isGenerator || !meta) return "";
    if (item.chain === "combo") return meta.chainName;
    const src = CHAINS[item.chain]?.shortGen ?? "";
    const tier = generatorSeen($game, item.chain);
    const r = tier ? spawnRange(tier) : null;
    const direct = r !== null && item.level >= r.min && item.level <= r.max;
    const next = item.level < meta.maxLv ? `둘을 합치면 Lv.${item.level + 1}` : "최고 단계!";
    if (item.level === 1) return `${tier && !direct ? `이제 ${src} 생성은 Lv.${r!.min}부터` : `${src}에서 나와요`} · ${next}`;
    return `${direct ? `${src}에서 바로 · ` : ""}Lv.${item.level - 1} 둘을 합쳐서 · ${next}`;
  });

  const cell = () => ui.selectedCell!;
  // 계보 화면 (v3.11)
  function openInfo(generator: boolean) {
    app().sfx.tap();
    ui.itemInfo = { chain: item!.chain, level: item!.level, generator };
    ui.modal = "itemInfo";
  }
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
      <div class="insp-title-row"><strong>{tier.name}</strong></div>
      <p><span class="insp-lv-badge">{formatGeneratorStars(item.level)}</span> Lv.{range!.min}~{range!.max} · 배속 Lv.{range!.boostMax}</p>
    </div>
    <div class="insp-actions">
      <button class="insp-btn spawn-btn" onclick={(e) => act(spawnFromGenerator, { cell: cell() }, pointOf(e))}>⚡생성{#if $game.boostMultiplier > 1} ×{$game.boostMultiplier}{/if}</button>
      <button class="insp-btn store-btn" title="등급과 나오는 재료" aria-label="등급과 나오는 재료" onclick={() => openInfo(true)}>📜</button>
      <button class="insp-btn store-btn" title="보관함에 넣기" aria-label="보관함에 넣기" onclick={(e) => { act(storeToBag, { cell: cell() }, pointOf(e)); afterRemove(); }}>🎒</button>
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
        <p>{origin}</p>
      {/if}
    </div>
    {#if item.state === "cobweb"}
      <div class="insp-actions">
        <button class="insp-btn sell-btn" onclick={(e) => act(unlockCobweb, { preferred: cell() }, pointOf(e))}>🕸️해제 🪙20</button>
      </div>
    {:else if item.state === "active"}
      <div class="insp-actions">
        <button class="insp-btn store-btn" title="어디서 왔는지와 단계" aria-label="어디서 왔는지와 단계" onclick={() => openInfo(false)}>📜</button>
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
