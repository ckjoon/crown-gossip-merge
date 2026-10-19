<script lang="ts">
  import Modal from "./Modal.svelte";
  import ChainStrip from "../components/ChainStrip.svelte";
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { CHAINS } from "../../../core/rules/chains";
  import { CHAIN_UNLOCK_LEVEL, CORE_GEN_CHAINS, isExtraChain } from "../../../core/rules/levels";
  import { getItemSVG } from "../../art/sprites";
  import type { ChainId, ExtraChain, GenChain } from "../../../core/types";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const genChains: GenChain[] = [...CORE_GEN_CHAINS, ...(Object.keys(CHAIN_UNLOCK_LEVEL) as ExtraChain[])];
  // 보유한 생성기 중 가장 높은 등급 (보드 + 보관함)
  const owned = $derived.by(() => {
    const m = new Map<string, number>();
    for (const it of [...$game.board, ...$game.bag]) if (it?.isGenerator) m.set(it.chain, Math.max(m.get(it.chain) ?? 0, it.level || 1));
    return m;
  });
  const others = (Object.keys(CHAINS) as ChainId[]).filter((k) => !CHAINS[k].generator && k !== "combo");
  let listEl: HTMLDivElement | undefined = $state();
  // 다른 모달로 바뀌어 닫혀도 다음에 📖로 열 때 지난 생성기에 머물지 않게
  $effect(() => () => (ui.codexFocus = null));
  $effect(() => {
    const f = ui.codexFocus;
    if (!f || !listEl) return;
    listEl.querySelector(`[data-chain="${f}"]`)?.scrollIntoView({ block: "center" });
  });
</script>

<Modal title="🗺️ 생성기 지도 & 아이템 도감" onclose={() => { ui.codexFocus = null; onclose(); }}>
  <div class="codex-card" style="background:#f3e8ff;border-color:#9333ea">
    <h4>🔥 생성기는 같은 것끼리 합치면 ★ → ★★ → ★★★</h4>
    <p style="font-size:11px;color:#475569">등급이 오를수록 더 높은 재료가 바로 나와요. 아래에서 내 생성기 등급과 만들 수 있는 단계를 확인하세요.</p>
    <div class="cs-legend"><span class="cs-spawn">바로 나옴</span><span class="cs-boost">⚡배속으로</span><span class="cs-merge">합성으로만</span></div>
  </div>
  <div bind:this={listEl}>
    {#each genChains as c (c)}
      {@const lockLv = isExtraChain(c) && $game.playerLv < CHAIN_UNLOCK_LEVEL[c] ? CHAIN_UNLOCK_LEVEL[c] : null}
      <div data-chain={c}><ChainStrip chain={c} tier={owned.get(c) ?? null} lockedLv={lockLv} focus={ui.codexFocus === c} /></div>
    {/each}
  </div>
  {#each others as key (key)}
    {@const ch = CHAINS[key]}
    <div class="codex-card">
      <h4>{ch.name}</h4>
      <div class="codex-flow">
        {#each ch.items as it, idx (it.level)}
          <div class="codex-node">
            <div class="codex-svg-mini">{@html getItemSVG(key, it.level, false)}</div>
            <strong style="font-size:9.5px">{it.name}</strong>
            <small style="font-size:8.5px;color:#64748b">Lv.{it.level}</small>
          </div>
          {#if idx < ch.items.length - 1}<span style="color:#94a3b8;font-weight:900">➔</span>{/if}
        {/each}
      </div>
    </div>
  {/each}
</Modal>
