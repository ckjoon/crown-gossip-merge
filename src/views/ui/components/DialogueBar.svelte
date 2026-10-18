<script lang="ts">
  import { ui } from "../ui.svelte";

  // 말풍선은 4초 뒤 사라지고, 누르면 바로 닫힌다
  let shownSeq = $state(0);
  $effect(() => {
    const seq = ui.dialogue.seq;
    if (!seq) return;
    shownSeq = seq;
    const t = setTimeout(() => {
      if (shownSeq === seq) shownSeq = 0;
    }, 4000);
    return () => clearTimeout(t);
  });
</script>

{#if shownSeq && ui.dialogue.text}
  <button class="speech-bubble" onclick={() => (shownSeq = 0)}>
    <span class="speaker-tag">{ui.dialogue.speaker}</span>
    <span class="speech-text">{ui.dialogue.text}</span>
  </button>
{/if}
