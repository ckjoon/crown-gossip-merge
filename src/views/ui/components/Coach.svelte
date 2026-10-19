<script lang="ts">
  // 첫 복구 코치 띠 (v3.7): 보드 아래에 "다음에 할 일" 한 줄 — 모달이 아니라 아무것도 막지 않는다
  import { app } from "../context";
  import { coachFor } from "../coach";

  const game = app().store;
  const coach = $derived(coachFor($game));
</script>

<!-- 알림 영역(aria-live)은 늘 같은 요소로 두어 단계가 바뀔 때 스크린리더가 새 문구를 읽게 한다 -->
<div class="coach-live" role="status" aria-live="polite">
  {#if coach}
    {#key coach.step}
      <div class="coach-bar" data-step={coach.step}>
        <span class="coach-badge">첫 이야기까지</span>
        <span class="coach-text">{coach.text}</span>
      </div>
    {/key}
  {/if}
</div>
