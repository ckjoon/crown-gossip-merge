<script lang="ts">
  // 캐릭터 초상화: 초상화 이미지가 있으면 이미지, 없으면 이모지 (v3.1에서 초상화 추가)
  import { CHARACTERS, characterIdForName } from "../../../core/rules/characters";
  let { characterId = null, name = "", face = "🙂", size = 32 }: { characterId?: string | null; name?: string; face?: string; size?: number } = $props();
  const ch = $derived(CHARACTERS[characterId ?? characterIdForName(name) ?? ""] ?? null);
  const src = $derived(ch?.portraitKey ? `/portraits/${ch.portraitKey}.svg` : null);
</script>

{#if src}
  <img class="portrait-img" {src} alt={ch?.name ?? name} width={size} height={size} style="width:{size}px;height:{size}px" />
{:else}
  <span class="portrait-emoji" style="font-size:{Math.round(size * 0.72)}px">{ch?.face ?? face}</span>
{/if}

<style>
  .portrait-img {
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }
  .portrait-emoji {
    line-height: 1;
  }
</style>
