<script lang="ts">
  // 장소 복구 후(또는 다시보기) 해당 화의 대화를 한 줄씩 보여 주는 컷신
  import { fade, scale, fly } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { findSpot, ROOMS } from "../../../core/rules/rooms";
  import { CHARACTERS } from "../../../core/rules/characters";
  import Portrait from "../components/Portrait.svelte";

  const cs = $derived(ui.cutscene!);
  const found = $derived(findSpot(cs.spotId)!);
  const lines = $derived(found.spot.dialogues.length ? found.spot.dialogues : [{ characterId: "selene", line: found.spot.story }]);
  const d = $derived(lines[Math.min(cs.step, lines.length - 1)]);
  const ch = $derived(CHARACTERS[d.characterId]);
  const last = $derived(cs.step >= lines.length - 1);

  function close() {
    const done = cs.onFinish;
    ui.cutscene = null;
    done?.();
  }
  function next() {
    app().sfx.tap();
    if (last) close();
    else ui.cutscene = { ...cs, step: cs.step + 1 };
  }
</script>

<div class="gh-modal-backdrop" transition:fade={{ duration: 160 }}>
  <div class="gh-modal story-cutscene-modal" transition:scale={{ duration: 260, start: 0.85, easing: backOut }}>
    <div class="gh-modal-header story-header">
      <h2>🎬 마녀의 성 이야기</h2>
      <button class="gh-close-btn" onclick={() => { app().sfx.tap(); close(); }}>건너뛰기</button>
    </div>
    <div class="gh-modal-body story-body">
      <div class="cutscene-stage-banner">
        <span class="cutscene-zone-badge">{ROOMS[found.zoneKey].title}</span>
        <strong>📖 제{found.chapter}화 · {found.spot.name}</strong>
      </div>
      {#key cs.step}
        <div class="cutscene-dialogue-card" in:fly={{ y: 12, duration: 220 }}>
          <div class="cutscene-avatar"><Portrait characterId={d.characterId} size={44} /></div>
          <div class="cutscene-speech-box">
            <div class="cutscene-speaker">{ch?.name ?? "대마녀 셀레네"}</div>
            <p class="cutscene-line">"{d.line}"</p>
          </div>
        </div>
      {/key}
      <div class="cutscene-footer">
        <span class="cutscene-step-indicator">스토리 대화 {Math.min(cs.step + 1, lines.length)} / {lines.length}</span>
        <button class="cutscene-next-btn" onclick={next}>{last ? "이야기 닫기 ✔" : "다음 대화 ▶"}</button>
      </div>
    </div>
  </div>
</div>
