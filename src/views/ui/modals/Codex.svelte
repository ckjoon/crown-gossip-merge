<script lang="ts">
  import Modal from "./Modal.svelte";
  import ChainStrip from "../components/ChainStrip.svelte";
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { CHAINS } from "../../../core/rules/chains";
  import { CHAIN_UNLOCK_ZONE, CORE_GEN_CHAINS, chainUnlockLabel, isExtraChain, unlockedChains } from "../../../core/rules/levels";
  import { getItemSVG } from "../../art/sprites";
  import type { ChainId, ExtraChain, GenChain } from "../../../core/types";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const genChains: GenChain[] = [...CORE_GEN_CHAINS, ...(Object.keys(CHAIN_UNLOCK_ZONE) as ExtraChain[])];
  const open = $derived(unlockedChains($game));
  // 보유한 생성기 중 가장 높은 등급 (보드 + 보관함)
  const owned = $derived.by(() => {
    const m = new Map<string, number>();
    for (const it of [...$game.board, ...$game.bag]) if (it?.isGenerator) m.set(it.chain, Math.max(m.get(it.chain) ?? 0, it.level || 1));
    return m;
  });
  const others = (Object.keys(CHAINS) as ChainId[]).filter((k) => !CHAINS[k].generator && k !== "combo");
  // 발견한 재료 단계 수 / 전체 (수집품 제외)
  const counted = (Object.keys(CHAINS) as ChainId[]).filter((k) => !CHAINS[k].isCollectible && k !== "combo");
  const totalCount = counted.reduce((n, k) => n + CHAINS[k].items.length, 0);
  const seenCount = $derived(counted.reduce((n, k) => n + Math.min(CHAINS[k].items.length, $game.codexSeen[k] ?? 0), 0));
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
    <p style="font-size:11px;color:#475569">등급이 오를수록 모습이 화려해지고 더 높은 재료가 바로 나와요. 체인마다 ★★★ 하나면 충분해요. 줄을 누르면 등급별 설명, 아직 못 본 단계는 ???로 숨어 있어요 (발견 {seenCount}/{totalCount}).</p>
    <div class="cs-legend"><span class="cs-spawn">바로 나옴</span><span class="cs-boost">⚡배속으로</span><span class="cs-merge">합성으로만</span></div>
  </div>
  <div bind:this={listEl}>
    {#each genChains as c (c)}
      {@const lockText = isExtraChain(c) && !open.includes(c) ? chainUnlockLabel(c) : null}
      <div data-chain={c}><ChainStrip chain={c} tier={owned.get(c) ?? null} seen={$game.codexSeen[c] ?? 0} locked={lockText} focus={ui.codexFocus === c} /></div>
    {/each}
  </div>
  {#each others as key (key)}
    {@const ch = CHAINS[key]}
    <div class="codex-card">
      <h4>{ch.name}</h4>
      <div class="codex-flow">
        {#each ch.items as it, idx (it.level)}
          {@const known = it.level <= ($game.codexSeen[key] ?? 0)}
          <div class="codex-node" class:cs-unknown={!known}>
            <div class="codex-svg-mini">{@html getItemSVG(key, it.level, false)}</div>
            <strong style="font-size:9.5px">{known ? it.name : "???"}</strong>
            <small style="font-size:8.5px;color:#64748b">Lv.{it.level}</small>
          </div>
          {#if idx < ch.items.length - 1}<span style="color:#94a3b8;font-weight:900">➔</span>{/if}
        {/each}
      </div>
    </div>
  {/each}
</Modal>
