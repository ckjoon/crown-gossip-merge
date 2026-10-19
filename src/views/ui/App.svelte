<script lang="ts">
  import TopBar from "./components/TopBar.svelte";
  import MergeScreen from "./components/MergeScreen.svelte";
  import Toasts from "./components/Toasts.svelte";
  import DialogueBar from "./components/DialogueBar.svelte";
  import Modals from "./Modals.svelte";
  import CastleScreen from "./castle/CastleScreen.svelte";
  import { app } from "./context";

  // 설정의 "연출 줄이기"를 CSS에도 (반짝임·띠 애니메이션 끄기)
  const game = app().store;
  $effect(() => {
    document.body.classList.toggle("reduce-motion", $game.settings.reduceMotion);
  });
</script>

<div id="game-shell">
  <TopBar />
  <MergeScreen />
  <CastleScreen />
  <Modals />
  <DialogueBar />
  <Toasts />
</div>
