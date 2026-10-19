<script lang="ts">
  // 캐릭터 초상화: 3D 모델에서 구운 그림(표정 4종, v3.6) → 없거나 못 불러오면 치비 벡터 초상화 → 캐릭터를 모르면 이모지
  import { CHARACTERS, characterIdForName } from "../../../core/rules/characters";
  import { portraitSrc } from "../../art/portraits";
  import { failedPortraits } from "./portraitFailures.svelte";
  import type { Expression } from "../../../core/rules/expressions";
  let { characterId = null, name = "", face = "🙂", size = 32, expression = "neutral" }: { characterId?: string | null; name?: string; face?: string; size?: number; expression?: Expression } = $props();
  const ch = $derived(CHARACTERS[characterId ?? characterIdForName(name) ?? ""] ?? null);
  const src = $derived(!ch?.portraitKey ? null : portraitSrc(ch.id, ch.portraitKey, expression, failedPortraits));
</script>

{#if src}
  {#key src}
    <img class="portrait-img" {src} alt={ch?.name ?? name} width={size} height={size} style="width:{size}px;height:{size}px" onerror={() => src && failedPortraits.add(src)} />
  {/key}
{:else}
  <span class="portrait-emoji" style="font-size:{Math.round(size * 0.72)}px">{ch?.face ?? face}</span>
{/if}

<style>
  .portrait-img {
    border-radius: 50%;
    object-fit: cover;
    display: block;
    animation: portraitPop 0.28s cubic-bezier(0.2, 1.6, 0.4, 1);
  }
  .portrait-emoji {
    line-height: 1;
  }
  @keyframes portraitPop {
    0% { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
</style>
