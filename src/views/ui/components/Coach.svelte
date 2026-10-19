<script lang="ts">
  // 첫 복구 코치 띠 (v3.7): 보드 아래에 "다음에 할 일" 한 줄 — 모달이 아니라 아무것도 막지 않는다
  import { app } from "../context";
  import { coachStep } from "../coach";

  const game = app().store;
  const coach = $derived(coachStep($game));
</script>

{#if coach}
  {#key coach.step}
    <div class="coach-bar" data-step={coach.step} role="status" aria-live="polite">
      <span class="coach-badge">첫 이야기까지</span>
      <span class="coach-text">{coach.text}</span>
    </div>
  {/key}
{/if}
