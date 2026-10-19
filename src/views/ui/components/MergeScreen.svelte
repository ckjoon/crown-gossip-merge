<script lang="ts">
  import { ui } from "../ui.svelte";
  import OrdersStrip from "./OrdersStrip.svelte";
  import SideTools from "./SideTools.svelte";
  import Inspector from "./Inspector.svelte";
  import Coach from "./Coach.svelte";
  import BoardCanvas from "../../board/BoardCanvas.svelte";
</script>

<section class="screen-view" class:hidden={ui.screen !== "merge"} id="view-merge">
  <div class="orders-and-story">
    <OrdersStrip />
  </div>

  <main class="gh-board-container" id="board-section">
    <BoardCanvas mode="main" />
  </main>

  <footer class="gh-bottom-panel">
    <Coach />
    <SideTools />
    <Inspector />
  </footer>
</section>
