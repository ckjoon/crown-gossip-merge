<script lang="ts">
  import TopBar from "./components/TopBar.svelte";
  import MergeScreen from "./components/MergeScreen.svelte";
  import Toasts from "./components/Toasts.svelte";
  import { ui } from "./ui.svelte";

  let { onBoardHost }: { onBoardHost: (el: HTMLDivElement) => void } = $props();
  let boardHost = $state<HTMLDivElement>();
  $effect(() => {
    if (boardHost) onBoardHost(boardHost);
  });
</script>

<div id="game-shell">
  <TopBar />
  <MergeScreen bind:boardHost />
  {#if ui.screen === "castle"}
    <section class="screen-view" id="view-castle">
      <button class="gh-castle-btn" onclick={() => (ui.screen = "merge")}>합성 보드로 돌아가기</button>
    </section>
  {/if}
  <Toasts />
</div>
