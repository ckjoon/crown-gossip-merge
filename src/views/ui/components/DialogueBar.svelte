<script lang="ts">
  import { ui } from "../ui.svelte";

  // 말풍선은 4초 뒤 저절로 사라진다 (아래 화면 터치를 막지 않음)
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
  <div class="speech-bubble" role="status">
    <span class="speaker-tag">{ui.dialogue.speaker}</span>
    <span class="speech-text">{ui.dialogue.text}</span>
  </div>
{/if}
