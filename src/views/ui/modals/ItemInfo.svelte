<script lang="ts">
  // v3.11 계보 화면: 이 재료(또는 생성기)가 어디서 오는지, 단계마다 어떻게 얻는지, 지금 어디쯤인지 한 화면에
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { CHAINS, getItemMeta, getGeneratorTierMeta, formatGeneratorStars } from "../../../core/rules/chains";
  import { spawnRange } from "../../../core/rules/progression";
  import { itemLineage, generatorSeen, type LineageHow } from "../../../core/codex";
  import { getItemSVG } from "../../art/sprites";

  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const info = ui.itemInfo!;
  const ch = CHAINS[info.chain];
  const lin = $derived(itemLineage($game, info.chain, info.generator ? 0 : info.level));
  const meta = info.generator ? null : getItemMeta(info.chain, info.level);
  const owned = $derived(info.generator ? generatorSeen($game, info.chain) : 0);
  const title = info.generator ? getGeneratorTierMeta(info.chain, info.level).name : meta!.name;
  const sub = info.generator ? `${formatGeneratorStars(info.level)} 생성기 · ${ch.name}` : `Lv.${info.level}/${meta!.maxLv} · ${ch.name}`;
  const HOW: Record<LineageHow, string> = { spawn: "바로 나옴", boost: "⚡배속으로", merge: "합성으로만", below: "지금은 안 나옴" };
  const sourceText = $derived.by(() => {
    const src = lin.source;
    if (src.kind === "generator") {
      if (!src.tier) return "아직 이 생성기가 없어요";
      const r = spawnRange(src.tier);
      return `${src.name} ${formatGeneratorStars(src.tier)} · 바로 Lv.${r.min}~${r.max} · ⚡배속 Lv.${r.boostMax}까지`;
    }
    if (src.kind === "byproduct") return `${src.name}에서 가끔 함께 나와요 (생성기 ★ 등급과 같은 단계로)`;
    if (src.kind === "drop") return "주문을 완성하거나 Lv.4 이상 재료를 합치면 가끔 나와요. 누르면 바로 받아요";
    return ch.items[Math.max(0, info.level - 1)]?.recipeText ?? "특별한 조합으로 만들어요";
  });
  const srcIcon = $derived(lin.source.kind === "generator" || lin.source.kind === "byproduct" ? getItemSVG(lin.source.chain, Math.max(1, lin.source.tier), true) : getItemSVG(info.chain, 1, false));
  const srcUnknown = $derived((lin.source.kind === "generator" || lin.source.kind === "byproduct") && !lin.source.tier);

  function openCodex() {
    app().sfx.tap();
    ui.itemInfo = null;
    ui.codexFocus = ch.generator ? info.chain : null;
    ui.modal = "codex";
  }
</script>

<Modal title="📜 {title}" subtitle={sub} onclose={() => { ui.itemInfo = null; onclose(); }}>
  <div class="ii-hero">
    <div class="ii-hero-icon">{@html getItemSVG(info.chain, info.level, info.generator)}</div>
    {#if !info.generator && lin.wanted > 0}<div class="ii-wanted">📜 지금 주문 {lin.wanted}건이 이 재료를 기다려요</div>{/if}
  </div>

  {#if !info.generator}
    <h4 class="ii-h">어디서 와요?</h4>
    <div class="ii-source" class:cs-unknown={srcUnknown}>
      <div class="ii-src-icon cs-svg">{@html srcIcon}</div>
      <p>{sourceText}</p>
    </div>
  {:else}
    <h4 class="ii-h">생성기 등급 (같은 등급 둘을 합치면 올라가요)</h4>
    <div class="ii-tiers">
      {#each [1, 2, 3] as t (t)}
        {@const reached = owned >= t}
        {@const tm = getGeneratorTierMeta(info.chain, t)}
        {@const r = spawnRange(t)}
        <div class="cs-tier" class:cs-unknown={!reached} class:cs-current={t === info.level}>
          <div class="cs-tier-icon">{@html getItemSVG(info.chain, t, true)}</div>
          <div class="cs-tier-text">
            <strong>{"★".repeat(t)} {reached ? tm.name : "???"}</strong>
            <p>{reached ? `바로 Lv.${r.min}~${r.max} · ⚡배속 Lv.${r.boostMax}까지` : `${"★".repeat(t - 1)} 둘을 합치면 모습이 드러나요`}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <h4 class="ii-h">{info.generator ? "여기서 나오는 재료" : "단계"}</h4>
  <ol class="ii-steps">
    {#each lin.steps as st, i (st.level)}
      {#if i > 0}<li class="ii-join" aria-hidden="true">▼ 둘을 합치면</li>{/if}
      <li class="ii-step ii-{st.how}" class:ii-current={st.current} class:cs-unknown={st.name === null}>
        <span class="ii-step-icon cs-svg">{@html getItemSVG(info.chain, st.level, false)}</span>
        <span class="ii-step-name"><b>Lv.{st.level}</b> {st.name ?? "???"}</span>
        <span class="ii-tag">{st.current ? "지금 여기" : HOW[st.how]}</span>
      </li>
    {/each}
  </ol>
  <button class="ii-codex-btn" onclick={openCodex}>📖 도감 전체 보기</button>
</Modal>
