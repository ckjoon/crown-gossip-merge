<script lang="ts">
  // 복구 리본·캐릭터 반응 말풍선·구역 완성 배너 (RewardDirector가 ui.reward로 띄움)
  import { fly, scale, fade } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import { ui } from "../ui.svelte";
  import { CHARACTERS } from "../../../core/rules/characters";
  import { skipZoneShowcase } from "../../reward/RewardDirector";
  import Portrait from "../components/Portrait.svelte";
  const r = $derived(ui.reward);
</script>

{#if r?.kind === "ribbon"}
  <div class="restore-ribbon" in:scale={{ duration: 420, start: 0.3, easing: backOut }} out:fade={{ duration: 200 }}>
    <div class="ribbon-band">📖 제{r.chapter}화 복구 완료!</div>
    <div class="ribbon-name">{r.name}</div>
    <div class="ribbon-chips">
      {#each r.chips as c, i (c)}<span class="ribbon-chip" in:fly={{ y: 14, delay: 250 + i * 120, duration: 300 }}>{c}</span>{/each}
    </div>
  </div>
{:else if r?.kind === "reaction"}
  <div class="reaction-bubble" in:fly={{ y: 24, duration: 320, easing: backOut }} out:fade={{ duration: 180 }}>
    <div class="reaction-face"><Portrait characterId={r.characterId} size={40} /></div>
    <div>
      <strong>{CHARACTERS[r.characterId]?.name}</strong>
      <p>"{r.line}"</p>
    </div>
  </div>
{:else if r?.kind === "zone"}
  <button class="zone-complete-banner" onclick={skipZoneShowcase} transition:fade={{ duration: 200 }}>
    <strong>{r.title}</strong>
    <span>구역 완성 보상 +💎{r.gems} · 화면을 탭하면 건너뛰어요</span>
  </button>
{/if}

<style>
  .restore-ribbon {
    position: absolute;
    left: 50%;
    top: 22%;
    transform: translateX(-50%);
    z-index: 30;
    text-align: center;
    pointer-events: none;
  }
  .ribbon-band {
    background: linear-gradient(90deg, #b45309, #f59e0b, #b45309);
    color: #fff;
    font-weight: 900;
    font-size: 17px;
    padding: 8px 22px;
    border-radius: 8px;
    border: 2px solid #fde047;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), 0 0 18px rgba(253, 224, 71, 0.5);
    white-space: nowrap;
  }
  .ribbon-name {
    margin-top: 6px;
    color: #fef3c7;
    font-weight: 800;
    font-size: 13px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  }
  .ribbon-chips {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-top: 6px;
  }
  .ribbon-chip {
    background: rgba(15, 23, 42, 0.85);
    color: #fde047;
    border: 1.5px solid rgba(253, 224, 71, 0.6);
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 11.5px;
    font-weight: 900;
  }
  .reaction-bubble {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 86px;
    z-index: 30;
    display: flex;
    gap: 10px;
    align-items: center;
    background: #fffbeb;
    border: 2px solid #f59e0b;
    border-radius: 14px;
    padding: 9px 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
  .reaction-bubble strong {
    font-size: 12px;
    color: #92400e;
  }
  .reaction-bubble p {
    font-size: 12px;
    color: #1e293b;
    font-weight: 700;
    line-height: 1.35;
  }
  .reaction-face {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fde68a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .zone-complete-banner {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 18px;
    border: none;
    cursor: pointer;
    background: linear-gradient(180deg, rgba(17, 10, 33, 0.6), transparent 45%);
  }
  .zone-complete-banner strong {
    font-size: 22px;
    font-weight: 900;
    color: #fde047;
    text-shadow: 0 2px 0 #7c2d12, 0 0 18px rgba(253, 224, 71, 0.6);
    animation: zoneBannerPop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
  }
  .zone-complete-banner span {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 800;
    color: #f5f3ff;
  }
</style>
