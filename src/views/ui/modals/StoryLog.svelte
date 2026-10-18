<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { ALL_SPOTS_IN_ORDER, ROOMS } from "../../../core/rules/rooms";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const seen = $derived(ALL_SPOTS_IN_ORDER.filter((e) => $game.rooms[e.spot.id]?.done));
  function replay(spotId: string) {
    ui.modal = null;
    ui.cutscene = { spotId, step: 0, onFinish: null };
  }
</script>

<Modal title="📜 마녀의 성 스토리 다시보기" {onclose}>
  {#if seen.length === 0}
    <p style="font-size:12px;color:#64748b">아직 공개된 이야기가 없어요. [📖 다음 이야기 진행]으로 제1화를 열어 보세요!</p>
  {:else}
    {#each seen as e (e.spot.id)}
      <button class="codex-card story-log-item" onclick={() => replay(e.spot.id)}>
        <h4>제{e.chapter}화 · {e.spot.name}</h4>
        <p style="font-size:11px;color:#475569">{ROOMS[e.zoneKey].shortName}</p>
      </button>
    {/each}
  {/if}
</Modal>
