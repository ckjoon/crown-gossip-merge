<script lang="ts">
  import { fly } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import { app } from "../context";
  import { getGeneratorTierMeta } from "../../../core/rules/chains";
  import type { GameEvent } from "../../../core/events";

  let shown = $state<Extract<GameEvent, { type: "levelUp" }> | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  $effect(() =>
    app().store.onEvent((e) => {
      if (e.type !== "levelUp") return;
      shown = e;
      app().sfx.reward();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => (shown = null), 3600);
    })
  );
</script>

{#if shown}
  <div class="levelup-banner" transition:fly={{ y: -30, duration: 380, easing: backOut }}>
    <div class="lv-banner-icon">👑</div>
    <div class="lv-banner-text">
      <strong>👑 연금술사 레벨 업! Lv.{shown.level} 달성!</strong>
      <span>보상: +{shown.coins}🪙 · +{shown.energy}⚡ · +💎{shown.gems} · [{getGeneratorTierMeta(shown.genChain, 1).name} ★] 진화 파츠 지급!</span>
    </div>
  </div>
{/if}
