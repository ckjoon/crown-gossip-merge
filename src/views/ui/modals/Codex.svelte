<script lang="ts">
  import Modal from "./Modal.svelte";
  import { CHAINS } from "../../../core/rules/chains";
  import { getGeneratorTierCap } from "../../../core/rules/progression";
  import { getItemSVG } from "../../art/sprites";
  import type { ChainId } from "../../../core/types";
  let { onclose }: { onclose: () => void } = $props();
  const potTiers = CHAINS.potion.generator!.tiers;
  const chains = (Object.keys(CHAINS) as ChainId[]).filter((k) => k !== "combo");
</script>

<Modal title="📖 생성기 진화 & 아이템 체인 도감" {onclose}>
  <div class="codex-card" style="background:#f3e8ff;border-color:#9333ea">
    <h4>🔥 생성기 합성 진화 (★ ➔ ★★ ➔ ★★★)</h4>
    <p style="font-size:11px;color:#475569;margin-bottom:6px">같은 생성기 2개를 합치면 등급이 올라 더 높은 재료가 한 번에 나옵니다!</p>
    <div class="codex-flow">
      {#each potTiers as t, idx (t.level)}
        <div class="codex-node" style="flex:1">
          <div class="codex-svg-mini">{@html getItemSVG("potion", t.level, true)}</div>
          <strong style="font-size:9.5px">{t.name}</strong>
          <small style="font-size:8.5px;color:#6d28d9">{"★".repeat(t.level)} · 최대 Lv.{getGeneratorTierCap(t.level)}</small>
        </div>
        {#if idx < potTiers.length - 1}<span style="color:#9333ea;font-weight:900">➔</span>{/if}
      {/each}
    </div>
  </div>
  {#each chains as key (key)}
    {@const ch = CHAINS[key]}
    <div class="codex-card">
      <h4>{ch.name} {ch.generator ? `(생성기: ${ch.generator.name})` : ""}</h4>
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
