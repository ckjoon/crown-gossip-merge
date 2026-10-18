<script lang="ts">
  import TopBar from "./components/TopBar.svelte";
  import MergeScreen from "./components/MergeScreen.svelte";
  import Toasts from "./components/Toasts.svelte";
  import DialogueBar from "./components/DialogueBar.svelte";
  import Modals from "./Modals.svelte";
  import CastleScreen from "./castle/CastleScreen.svelte";

</script>

<div id="game-shell">
  <TopBar />
  <MergeScreen />
  <CastleScreen />
  <Modals />
  <DialogueBar />
  <Toasts />
</div>
